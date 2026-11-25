-- Run in Supabase SQL Editor, once. No existing auth tables changed.
CREATE TABLE IF NOT EXISTS public.ef_daily_activity (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 activity_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,activity_date)
);
ALTER TABLE public.ef_daily_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "EF users can view own activity" ON public.ef_daily_activity;
CREATE POLICY "EF users can view own activity" ON public.ef_daily_activity FOR SELECT TO authenticated USING (auth.uid()=user_id);
REVOKE ALL ON public.ef_daily_activity FROM anon, authenticated;
GRANT SELECT ON public.ef_daily_activity TO authenticated;
-- Trusted server/service role records verified completed tests only.
-- Do not expose service role credentials to browsers.
