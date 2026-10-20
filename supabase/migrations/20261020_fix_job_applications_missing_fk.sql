-- QA02, found during 2026-10-20 tester retest: job_applications has never
-- had a foreign key to jobs, confirmed live via a direct PostgREST call
-- against the exact query MyJobs.tsx uses:
--   PGRST200: Could not find a relationship between 'job_applications'
--   and 'jobs' in the schema cache
--
-- MyJobs.tsx's "Applied" tab embeds job:jobs(...) in its select, which
-- PostgREST can only resolve via a real FK constraint (or an explicit
-- embed hint, which this codebase doesn't use). Every request to that
-- tab has always errored -- and the error was silently swallowed
-- (`const { data } = await supabase...`, error never captured), so the
-- tab just showed "You have no applied jobs yet" regardless of reality.
-- saved_jobs and job_skips already have this FK (saved_jobs_job_id_fkey,
-- job_skips_job_id_fkey), which is why Saved/Archived work fine and only
-- Applied was affected.
--
-- Added NOT VALID: 3 of the 4 job_applications rows that have ever
-- existed reference a job_id that no longer exists in jobs (test
-- applications from April 2026 against JobDiva listings that have since
-- cycled out via stale-job cleanup). A normal FK would fail to validate
-- against that pre-existing data. NOT VALID enforces the constraint for
-- all new rows going forward without touching the 3 existing ones, and
-- PostgREST recognizes NOT VALID foreign keys for embeds regardless of
-- validation status (it introspects pg_constraint, not convalidated).
--
-- ON DELETE CASCADE matches the existing convention on saved_jobs/
-- job_skips for consistency.

ALTER TABLE job_applications
  ADD CONSTRAINT job_applications_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  NOT VALID;
