-- QA04, found during 2026-10-20 tester retest: Applicant pipeline
-- drag-and-drop silently failed on every single stage, 100% of the time.
-- Root cause confirmed live: the Kanban's stage ids (pending, reviewing,
-- interview, offered, hired, rejected) don't match
-- job_applications_status_check, which only allows ('Applied',
-- 'Screening', 'Interview', 'Offer', 'Rejected'). Every drag attempted a
-- status update the database constraint rejects outright -- and 'hired'
-- has never had a corresponding value at all, even though the pipeline
-- UI (and the tester's own screenshot) shows Hired as a real stage.
--
-- Fixing this requires both a frontend change (aligning stage ids to the
-- real vocabulary, this migration's companion commit) and extending the
-- constraint to actually support the Hired terminal stage the UI design
-- already assumes exists.

ALTER TABLE job_applications DROP CONSTRAINT job_applications_status_check;

ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check
  CHECK (status = ANY (ARRAY['Applied'::text, 'Screening'::text, 'Interview'::text, 'Offer'::text, 'Hired'::text, 'Rejected'::text]));
