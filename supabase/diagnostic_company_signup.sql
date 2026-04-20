-- ============================================================
-- DIAGNOSTIC: Company Sign-Up Flow
-- Run this in Supabase SQL Editor to identify the issue
-- ============================================================

-- 1. Check the current trigger function definition
-- If this shows "user_id" in the INSERT, the trigger is stale
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Check if the trigger exists and is attached
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Find company users in auth.users who are MISSING a user_profiles row
-- These are the "ghost" signups where the trigger failed
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'name' AS name,
  au.raw_user_meta_data->>'role' AS role,
  au.created_at,
  au.email_confirmed_at,
  up.id AS profile_id,
  up.role AS profile_role,
  up.is_approved
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.raw_user_meta_data->>'role' = 'company'
ORDER BY au.created_at DESC;

-- 4. Check company users who HAVE a profile but NO linked companies row
SELECT
  up.id,
  up.name,
  up.role,
  up.company_id,
  up.is_approved,
  up.created_at,
  c.id AS company_table_id,
  c.name AS company_name
FROM user_profiles up
LEFT JOIN companies c ON up.company_id = c.id
WHERE up.role = 'company'
ORDER BY up.created_at DESC;

-- 5. Check the user_profiles table schema (verify columns exist)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 6. Check if there's a user_id column (there shouldn't be)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'user_id';

-- 7. Check the role CHECK constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
AND contype = 'c';

-- 8. Check RLS policies on user_profiles
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
