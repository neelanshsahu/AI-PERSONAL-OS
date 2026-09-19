# Phase 12 — Rate Limiting

## Overview

Implemented an in-memory API rate limiting system to protect backend AI endpoints from abuse and control costs. The system employs three distinct rate-limiting algorithms to handle different types of traffic patterns and logs all exceeded attempts directly to the Supabase database.

---

## Algorithms Implemented

1. **Token Bucket**
   - **File:** `app/middleware/rate_limiter.py -> TokenBucketRateLimiter`
   - **Applied to:** AI Chat Streaming (`POST /api/v1/chat/{chat_id}/send`)
   - **Behavior:** Tokens refill at a constant rate. Handles sudden bursts of messages gracefully but strictly limits sustained high-frequency spam.

2. **Sliding Window**
   - **File:** `app/middleware/rate_limiter.py -> SlidingWindowRateLimiter`
   - **Applied to:** Knowledge Base RAG Chat (`POST /api/v1/rag/chat`)
   - **Behavior:** Maintains an exact rolling time window of requests. Provides the most accurate time-based limiting for high-compute vector queries.

3. **Fixed Window**
   - **File:** `app/middleware/rate_limiter.py -> FixedWindowRateLimiter`
   - **Applied to:** Image Generation (`POST /api/v1/images/generate`)
   - **Behavior:** Simple time block counters (e.g., 5 requests per 60-second block). Ideal for strict hard caps on expensive generation tasks.

---

## Logging System

A new Supabase migration (`003_rate_limit_logs.sql`) creates the `rate_limit_logs` table. Whenever a user (or anonymous IP) exceeds their allotted limit on an endpoint, the `RateLimitDependency` automatically logs the event, storing:
- `user_id`
- `endpoint`
- `algorithm`
- `ip_address`
- `created_at`

*Note: The current storage mechanisms for rate limit counters are in-memory dictionaries for simplicity. For horizontal scalability across multiple workers in production, these should be replaced with Redis-backed implementations.*

---

## Next Step

➡️ **Phase 13 — Deployment** — Prepare the application for production deployment, configuring Dockerfiles and final production builds.
