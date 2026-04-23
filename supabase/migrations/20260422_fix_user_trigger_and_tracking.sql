-- Fix handle_new_user trigger and job_tracking table schema

-- 1. Fix handle_new_user to insert correct columns only
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Log error but don't fail signup
  RAISE WARNING 'Error creating user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add missing columns to job_tracking for aggregated stats
ALTER TABLE job_tracking ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
ALTER TABLE job_tracking ADD COLUMN IF NOT EXISTS applications integer DEFAULT 0;
ALTER TABLE job_tracking ADD COLUMN IF NOT EXISTS last_updated timestamptz DEFAULT now();

-- 3. Create index on last_updated for sync queries
CREATE INDEX IF NOT EXISTS idx_job_tracking_last_updated ON job_tracking(last_updated);
