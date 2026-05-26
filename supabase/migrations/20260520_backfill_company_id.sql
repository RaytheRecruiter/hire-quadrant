-- Per Ray QA 2026-05-20: Quadrant Inc shows 65 jobs on Browse Companies
-- but 179 jobs when searching All Jobs by name. Root cause: the JobDiva
-- XML ingestion populates `jobs.company` (text) but not `jobs.company_id`
-- (FK to companies). Browse Companies counts via the public_company_directory
-- view which joins on company_id, so unlinked jobs are invisible.
--
-- Fix: backfill `company_id` from a case/whitespace-insensitive match on
-- the company name. Safe to re-run — only touches rows where company_id
-- is still NULL.

update jobs j
   set company_id = c.id
  from companies c
 where j.company_id is null
   and j.company is not null
   and lower(trim(j.company)) = lower(trim(c.name));
