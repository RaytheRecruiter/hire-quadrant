-- Per audit N10 (2026-10-09): remove test/seed content from public surfaces
-- without deleting it (preserve records/audit evidence, per the task's own
-- instruction). Scoped precisely to the records explicitly named in the
-- audit -- job-001/002/003 and the obviously-synthetic test companies --
-- not a broader guess at what else might be fake, per the audit's own
-- caution ("verify provenance rather than assuming every unfamiliar
-- company is fake").
--
-- Companies: public_company_directory (20260425_trust_bundle.sql) already
-- filters `WHERE c.is_active = true` and Companies.tsx already queries
-- that view (via useCompanyDirectory.ts) -- so flipping is_active to false
-- is sufficient, no code change needed.
--
-- Jobs: BrowseJobs.tsx has no equivalent company-status check at all (it
-- only excludes status = 'closed'), so job-001/002/003 need their own
-- status flip to stop surfacing in public search independent of their
-- companies' active flag.

update companies
set is_active = false
where name in ('TechCorp', 'StartupXYZ', 'CloudInc', 'Test Business One', 'Test Business Two', 'Quadrant Inc (test)');

update jobs
set status = 'closed'
where id in ('job-001', 'job-002', 'job-003');
