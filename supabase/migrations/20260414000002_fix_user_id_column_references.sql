-- Fix handle_new_user trigger: remove non-existent user_id column reference
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, name, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'company' THEN false ELSE true END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate RLS policies that reference non-existent user_id column
-- All should use id = auth.uid() since user_profiles.id IS the auth user id

-- From migration 20260407000006
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update all applications" ON job_applications;
CREATE POLICY "Admins can update all applications"
  ON job_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- From migration 20260407000007
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
CREATE POLICY "Admins can manage plans" ON subscription_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Company can read own subscription" ON subscriptions;
CREATE POLICY "Company can read own subscription" ON subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.company_id = subscriptions.company_id));

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON subscriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- From migration 20260407000008
DROP POLICY IF EXISTS "Company users can update application status" ON job_applications;
CREATE POLICY "Company users can update application status"
  ON job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN companies c ON up.company_id = c.id
      WHERE up.id = auth.uid() AND up.role = 'company'
      AND (job_applications.source_company = c.name OR job_applications.source_company = c.display_name)
    )
  );
