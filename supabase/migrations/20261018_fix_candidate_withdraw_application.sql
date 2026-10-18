-- CRITICAL, found starting the candidate-side N19 QA pass (2026-10-18):
-- "Withdraw application" (My Jobs > Applied tab) has never actually
-- withdrawn anything. job_applications has had RLS enabled since its
-- original creation (20250728193321_cool_ocean.sql) with SELECT/INSERT/
-- UPDATE policies for a candidate's own rows, but no DELETE policy was
-- ever added for anyone -- grepped every migration, confirmed none, not
-- even a FOR ALL policy that would cover it. MyJobs.tsx's withdraw()
-- calls .delete().eq('id', applicationId) and only checks the returned
-- `error` (there isn't one -- RLS just silently matches zero rows), so it
-- shows "Application withdrawn" and reloads the list with the
-- "withdrawn" application still sitting in it. Same false-success shape
-- as today's bulk-messaging and Q&A-answer fixes, this time on the
-- candidate side.

DROP POLICY IF EXISTS "Users can delete own applications" ON job_applications;
CREATE POLICY "Users can delete own applications"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
