-- Fix RLS policies on user_profiles to use correct column
-- Previous policies incorrectly checked user_id column (which is null)
-- Corrected to check id column for SELECT operations

-- Drop incorrect policies
DROP POLICY "Users can read own profile" ON user_profiles;
DROP POLICY "Admins can read all profiles" ON user_profiles;

-- Create corrected policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
  ));
