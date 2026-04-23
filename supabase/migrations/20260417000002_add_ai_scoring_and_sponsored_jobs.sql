-- ============================================================
-- Add AI job scoring columns to candidates + sponsored job support
-- ============================================================

-- 1. Add profile enrichment columns to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_locations text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_job_types text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS parsed_title text;

-- 2. Add sponsored job columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_tier integer DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_start_date timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sponsor_end_date timestamptz;

-- 3. Index for efficient sponsored job queries
CREATE INDEX IF NOT EXISTS idx_jobs_sponsored ON jobs(is_sponsored, sponsor_tier DESC)
  WHERE is_sponsored = true;

-- 4. Admin can update sponsored status on jobs
-- (already covered by existing "Allow authenticated insert/update" policy on jobs)
