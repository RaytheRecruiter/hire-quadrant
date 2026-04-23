-- ============================================================
-- Fix company sign-up flow
-- Problem: Company users register but never get a companies row,
-- so company_id stays NULL and the company dashboard breaks.
-- Also: the trigger may reference a non-existent user_id column.
-- ============================================================

-- 1. Update role CHECK constraint to allow 'rejected' status
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('candidate', 'admin', 'company', 'rejected'));

-- 2. Recreate the trigger function to:
--    a) Insert into user_profiles correctly (no user_id column)
--    b) Auto-create a companies row for employer signups
--    c) Link the companies row via company_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
  _name text;
  _company_name text;
  _company_id uuid;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
  _name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  _company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', _name);

  IF _role = 'company' THEN
    -- Create a companies row for this employer
    INSERT INTO companies (name, display_name, contact_email, is_active)
    VALUES (_company_name, _company_name, NEW.email, false)
    RETURNING id INTO _company_id;

    -- Create user profile linked to the company
    INSERT INTO user_profiles (id, name, role, company_id, is_approved)
    VALUES (NEW.id, _name, 'company', _company_id, false);
  ELSE
    -- Candidate or other role: just create the profile
    INSERT INTO user_profiles (id, name, role, is_approved)
    VALUES (NEW.id, _name, _role, true);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill: Create missing user_profiles for company users in auth.users
-- (handles cases where the old broken trigger failed silently)
INSERT INTO user_profiles (id, name, role, is_approved)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  'company',
  false
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.raw_user_meta_data->>'role' = 'company'
  AND up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill: Create missing companies rows for company users who have
-- a user_profiles row but no linked companies row
DO $$
DECLARE
  rec RECORD;
  _company_id uuid;
BEGIN
  FOR rec IN
    SELECT up.id, up.name, au.email
    FROM user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE up.role = 'company'
      AND up.company_id IS NULL
  LOOP
    INSERT INTO companies (name, display_name, contact_email, is_active)
    VALUES (rec.name, rec.name, rec.email, false)
    RETURNING id INTO _company_id;

    UPDATE user_profiles
    SET company_id = _company_id
    WHERE id = rec.id;
  END LOOP;
END $$;
