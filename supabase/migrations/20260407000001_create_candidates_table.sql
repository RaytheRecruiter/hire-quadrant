/*
  # Create candidates table

  Stores candidate-specific profile data (phone, location, resume).
  Referenced by ProfilePage.tsx for profile management and resume uploads.

  1. New Table
    - `candidates`
      - `user_id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `location` (text)
      - `phone_number` (text)
      - `resume_url` (text)
      - `linkedin_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Candidates can read/update their own data
    - Admins can read all candidate data
*/

CREATE TABLE IF NOT EXISTS candidates (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  location text,
  phone_number text,
  resume_url text,
  linkedin_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Candidates can read their own profile
CREATE POLICY "Candidates can read own profile"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Candidates can insert their own profile
CREATE POLICY "Candidates can insert own profile"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Candidates can update their own profile
CREATE POLICY "Candidates can update own profile"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all candidate profiles
CREATE POLICY "Admins can read all candidates"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
