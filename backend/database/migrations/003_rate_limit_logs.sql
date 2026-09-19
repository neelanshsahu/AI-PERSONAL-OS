-- Phase 12: Rate Limiting Logs

CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (allow insert from backend)
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to the user
CREATE POLICY "Users can view their own rate limit logs."
    ON public.rate_limit_logs FOR SELECT
    USING (auth.uid() = user_id);
