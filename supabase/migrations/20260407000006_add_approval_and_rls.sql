-- Add is_approved to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;

-- Update trigger to set is_approved based on role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, user_id, name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'company' THEN false ELSE true END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can update all profiles (for approving companies)
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Admins can update all applications
CREATE POLICY "Admins can update all applications"
  ON job_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));
