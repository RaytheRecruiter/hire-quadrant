-- CRITICAL, confirmed live via N19 QA (2026-10-18): employers can never see
-- any applicant's application, at all -- "No Applicants Yet" shows even when
-- a real, correctly-linked application exists. Confirmed with a direct RLS
-- test signed in as the actual employer user (not the service-role key):
-- SELECT on job_applications, filtered or unfiltered, returns zero rows with
-- no error (RLS silently filtering, not a query bug).
--
-- Root cause, traced through the full migration history: the original
-- SELECT policy ("Company users can read applications for their jobs",
-- 20250728193321_cool_ocean.sql, never dropped since) and the UPDATE policy
-- that replaced it once since ("Company users can update application
-- status", 20260407000008/20260414000002) both match on
-- job_applications.source_company = companies.name/display_name. Confirmed
-- live that a normal application submitted through the Apply form always
-- has source_company = null -- the submit path never populates it -- so
-- both policies have been dead on arrival since the very first migration,
-- not something introduced later. Replacing both with the reliable
-- relational path already used correctly elsewhere in this codebase (e.g.
-- the candidates table's company-access policy):
-- job_applications.job_id -> jobs.company_id -> company_members, not a
-- text match against a column the write path doesn't populate.

DROP POLICY IF EXISTS "Company users can read applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Company users can update application status" ON job_applications;

-- Second USING clause covers the ~1-in-11 legacy company account that
-- predates company_members (no row there at all) -- CompanyApplicants.tsx
-- already treats "no member row" as "grant everything" client-side
-- (noMember = !member), so the RLS fallback matches that existing,
-- intentional behavior via the direct user_profiles.company_id link
-- instead of newly locking that account out.
CREATE POLICY "Company members can read applications for their jobs"
  ON job_applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN company_members cm ON cm.company_id = j.company_id
      WHERE j.id = job_applications.job_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN user_profiles up ON up.company_id = j.company_id
      WHERE j.id = job_applications.job_id
        AND up.id = auth.uid()
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

CREATE POLICY "Company members can update applications for their jobs"
  ON job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN company_members cm ON cm.company_id = j.company_id
      WHERE j.id = job_applications.job_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN user_profiles up ON up.company_id = j.company_id
      WHERE j.id = job_applications.job_id
        AND up.id = auth.uid()
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );
