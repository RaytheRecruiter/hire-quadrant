-- Companion to 20261009_fix_search_candidates_paywall.sql.
--
-- "Companies can search candidates" (20260416000001) granted ANY
-- company-role user full-row SELECT (including resume_url, phone_number)
-- on ANY open_to_work candidate, with zero connection to the unlock-credit
-- system added later (20260429_unlock_credits.sql). Confirmed live
-- 2026-10-09: a test employer account with zero unlocks read every
-- candidate's resume_url and phone_number via a direct REST call to this
-- table, completely bypassing search_candidates() and the paid unlock
-- flow entirely (RLS applies regardless of which code path a client uses
-- to reach the table, not just the one the frontend happens to call).
--
-- RLS can't do column-level security (show some columns, hide others, for
-- the same row/policy), so the fix is access-level: a company-role user
-- may read a candidate's full row only if they've unlocked that candidate,
-- OR that candidate has applied to one of their job postings (direct
-- applicants are implied consent -- CandidateHub.tsx relies on reading
-- applicant profiles this way and must keep working for candidates who
-- applied but aren't open_to_work or haven't been paid-unlocked).
-- search_candidates() itself is unaffected (SECURITY DEFINER bypasses RLS)
-- and already null-safes email/resume_url per the companion migration, so
-- browsing/search still works for not-yet-unlocked candidates -- this
-- migration only closes the direct-table-read bypass.

DROP POLICY IF EXISTS "Companies can search candidates" ON candidates;

CREATE POLICY "Companies can read unlocked or applicant candidates"
  ON candidates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('company', 'admin')
    )
    AND (
      EXISTS (
        SELECT 1 FROM candidate_unlocks cu
        JOIN company_members cm ON cm.company_id = cu.company_id
        WHERE cm.user_id = auth.uid()
          AND cm.status = 'active'
          AND cu.candidate_user_id = candidates.user_id
      )
      OR EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON j.id = ja.job_id
        JOIN company_members cm ON cm.company_id = j.company_id
        WHERE cm.user_id = auth.uid()
          AND cm.status = 'active'
          AND ja.user_id = candidates.user_id
      )
    )
  );
