-- Fix public_profiles view to allow unauthenticated access to public profile data
-- The view was created with security_invoker = true which inherits RLS restrictions
-- We need to recreate it without security_invoker (defaults to security_definer behavior)

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT id, display_name, avatar_url, created_at
FROM public.profiles;

-- Ensure grants are in place for anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon, authenticated;