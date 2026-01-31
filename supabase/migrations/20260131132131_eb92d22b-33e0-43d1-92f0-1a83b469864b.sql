-- Drop the overly permissive policy that exposes email
DROP POLICY IF EXISTS "Anyone can view public profile data" ON public.profiles;

-- Keep only the policy that allows users to view their own profile
-- (The "Users can view own profile" policy already exists)