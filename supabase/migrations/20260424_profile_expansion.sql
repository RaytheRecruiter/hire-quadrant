-- ============================================================
-- Phase 7: Indeed-style profile expansion
-- Adds work experience, education, skills, and job preferences.
-- ============================================================

-- Skills live on the candidates row (already exists).
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------
-- Work experience
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  is_current boolean NOT NULL DEFAULT false,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_experience_user
  ON user_experience(user_id, is_current DESC, start_date DESC NULLS LAST);

ALTER TABLE user_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own experience"
  ON user_experience FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own experience"
  ON user_experience FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- Education
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  field_of_study text,
  start_year int,
  end_year int,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_education_user
  ON user_education(user_id, end_year DESC NULLS LAST, start_year DESC NULLS LAST);

ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own education"
  ON user_education FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own education"
  ON user_education FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- Job preferences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_job_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  desired_titles jsonb DEFAULT '[]'::jsonb,
  desired_locations jsonb DEFAULT '[]'::jsonb,
  desired_salary_min int,
  desired_salary_max int,
  work_types jsonb DEFAULT '[]'::jsonb,
  schedules jsonb DEFAULT '[]'::jsonb,
  workplace_types jsonb DEFAULT '[]'::jsonb,
  open_to_relocation boolean DEFAULT false,
  work_authorization text,
  ready_to_interview boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_job_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own job preferences"
  ON user_job_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own job preferences"
  ON user_job_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own job preferences"
  ON user_job_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION touch_profile_row()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_user_experience ON user_experience;
CREATE TRIGGER trg_touch_user_experience
  BEFORE UPDATE ON user_experience
  FOR EACH ROW EXECUTE FUNCTION touch_profile_row();

DROP TRIGGER IF EXISTS trg_touch_user_education ON user_education;
CREATE TRIGGER trg_touch_user_education
  BEFORE UPDATE ON user_education
  FOR EACH ROW EXECUTE FUNCTION touch_profile_row();

DROP TRIGGER IF EXISTS trg_touch_user_job_preferences ON user_job_preferences;
CREATE TRIGGER trg_touch_user_job_preferences
  BEFORE UPDATE ON user_job_preferences
  FOR EACH ROW EXECUTE FUNCTION touch_profile_row();
