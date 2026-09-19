import time
from typing import Dict, Tuple
from fastapi import HTTPException, status, Request
from supabase import Client

# In-memory storage for rate limits
# In a distributed production system, this would be backed by Redis.
_fixed_window_store: Dict[str, Dict[str, int]] = {}
_sliding_window_store: Dict[str, list] = {}
_token_bucket_store: Dict[str, Dict[str, float]] = {}


class RateLimiter:
    """Base class for rate limiting algorithms."""
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window

    def is_allowed(self, key: str) -> bool:
        raise NotImplementedError

    def get_algorithm_name(self) -> str:
        return self.__class__.__name__


class FixedWindowRateLimiter(RateLimiter):
    """
    Fixed Window Counter:
    Divides time into fixed windows. Increments a counter for each request in the window.
    """
    def is_allowed(self, key: str) -> bool:
        current_window = str(int(time.time() // self.window))
        
        if key not in _fixed_window_store:
            _fixed_window_store[key] = {}
            
        store = _fixed_window_store[key]
        
        # Cleanup old windows to prevent memory leak
        for w in list(store.keys()):
            if w != current_window:
                del store[w]
                
        count = store.get(current_window, 0)
        if count >= self.limit:
            return False
            
        store[current_window] = count + 1
        return True


class SlidingWindowRateLimiter(RateLimiter):
    """
    Sliding Window Log:
    Keeps a timestamp of each request. Removes requests older than the window.
    """
    def is_allowed(self, key: str) -> bool:
        now = time.time()
        
        if key not in _sliding_window_store:
            _sliding_window_store[key] = []
            
        timestamps = _sliding_window_store[key]
        
        # Remove old timestamps
        cutoff = now - self.window
        _sliding_window_store[key] = [t for t in timestamps if t > cutoff]
        
        if len(_sliding_window_store[key]) >= self.limit:
            return False
            
        _sliding_window_store[key].append(now)
        return True


class TokenBucketRateLimiter(RateLimiter):
    """
    Token Bucket:
    Tokens are added at a fixed rate. Each request consumes a token.
    limit = max burst size
    window = time in seconds to refill entirely
    """
    def is_allowed(self, key: str) -> bool:
        now = time.time()
        refill_rate = self.limit / self.window
        
        if key not in _token_bucket_store:
            _token_bucket_store[key] = {"tokens": self.limit, "last_refill": now}
            
        bucket = _token_bucket_store[key]
        time_passed = now - bucket["last_refill"]
        
        # Refill
        bucket["tokens"] = min(self.limit, bucket["tokens"] + time_passed * refill_rate)
        bucket["last_refill"] = now
        
        if bucket["tokens"] < 1:
            return False
            
        bucket["tokens"] -= 1
        return True


def log_rate_limit_exceeded(db: Client, user_id: str, endpoint: str, algorithm: str, ip_address: str = None):
    """Log the rate limit event to Supabase."""
    try:
        db.table("rate_limit_logs").insert({
            "user_id": user_id,
            "endpoint": endpoint,
            "algorithm": algorithm,
            "ip_address": ip_address or "unknown"
        }).execute()
    except Exception as e:
        print(f"Failed to log rate limit: {e}")


from fastapi import Depends
from app.middleware.auth import get_current_user_optional
from app.models.auth import UserResponse
from app.database.client import get_supabase

class RateLimitDependency:
    """
    FastAPI dependency that enforces rate limiting using a specific algorithm.
    """
    def __init__(self, limiter: RateLimiter):
        self.limiter = limiter

    async def __call__(
        self, 
        request: Request,
        user: UserResponse = Depends(get_current_user_optional),
        db: Client = Depends(get_supabase)
    ):
        user_id = user.id if user else "anonymous"
        ip = request.client.host if request.client else "unknown"
        
        # Use user_id as the rate limiting key (or IP if anonymous)
        key_id = user_id if user_id != "anonymous" else ip
        key = f"{self.limiter.get_algorithm_name()}:{key_id}:{request.url.path}"
        
        if not self.limiter.is_allowed(key):
            if user_id != "anonymous":
                log_rate_limit_exceeded(db, user_id, request.url.path, self.limiter.get_algorithm_name(), ip)
                
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
