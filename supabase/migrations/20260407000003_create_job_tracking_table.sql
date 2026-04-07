/*
  # Create job tracking table

  Analytics table for tracking job views, clicks, and application funnel.
  Referenced by trackingService.ts.

  1. New Table
    - `job_tracking`
      - Tracks views, clicks, and applications per job per session

  2. Security
    - Public can insert (anonymous tracking)
    - Only admins can read (analytics dashboard)
*/

CREATE TABLE IF NOT EXISTS job_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_type text NOT NULL CHECK (event_type IN ('view', 'click', 'apply', 'share')),
  source text, -- e.g. 'search', 'featured', 'direct', 'company_page'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_job_tracking_job_id ON job_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_job_tracking_event_type ON job_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_job_tracking_created_at ON job_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_job_tracking_user_id ON job_tracking(user_id);

-- Enable RLS
ALTER TABLE job_tracking ENABLE ROW LEVEL SECURITY;

-- Anyone can insert tracking events (including anonymous users)
CREATE POLICY "Anyone can insert tracking events"
  ON job_tracking
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read tracking data
CREATE POLICY "Admins can read tracking data"
  ON job_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
