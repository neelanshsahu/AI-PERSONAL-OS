"""
Supabase Database Client — Phase 4
Singleton client using the service-role key for server-side operations.
All queries are explicitly scoped by user_id from the verified JWT.
"""

from functools import lru_cache
from supabase import create_client, Client
from app.utils.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Return the cached Supabase admin client.
    Uses the service-role key — never expose this on the frontend.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Supabase credentials missing. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env"
        )
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
