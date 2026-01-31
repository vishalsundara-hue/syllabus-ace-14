-- Drop the overly permissive SELECT policy that exposes emails
DROP POLICY IF EXISTS "Public can view non-sensitive profile data via view" ON public.profiles;

-- Create a new policy that only allows users to see their own profile (with email)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- The public_profiles view already exists and excludes email
-- Anyone needing public profile data should query public_profiles instead