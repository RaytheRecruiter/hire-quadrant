/*
  # Fix jobs table RLS policy

  The current policy allows ANY authenticated user to insert/update jobs.
  This should be restricted so only the service role (migration script)
  can write to the jobs table. Regular users should only read.
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON jobs;

-- Only the service role (used by migration script) can write to jobs.
-- Service role bypasses RLS entirely, so no explicit write policy needed.
-- If admin users need to manage jobs via the UI, add a specific admin policy:
CREATE POLICY "Admins can manage jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
