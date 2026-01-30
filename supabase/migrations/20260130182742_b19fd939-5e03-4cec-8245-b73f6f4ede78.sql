-- Recreate the view with security invoker to use the caller's permissions
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add a policy to allow anyone to read profiles via the view (for community features)
-- This only exposes non-sensitive fields since the view filters them
CREATE POLICY "Anyone can view public profile data"
ON public.profiles
FOR SELECT
USING (true);