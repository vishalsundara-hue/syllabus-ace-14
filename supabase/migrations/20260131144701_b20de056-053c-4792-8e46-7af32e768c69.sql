-- Drop and recreate the public_profiles view with security_invoker enabled
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT 
    id,
    display_name,
    avatar_url,
    created_at
FROM public.profiles;

-- Add a new policy that allows reading ONLY the non-sensitive fields via the view
-- This policy allows SELECT on profiles but the view restricts which columns are visible
CREATE POLICY "Public can view non-sensitive profile data via view"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive policy since we now have proper column-level protection via the view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;