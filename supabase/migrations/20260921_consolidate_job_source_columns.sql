-- Confirmed live against production (2026-09-21) while investigating multi-ATS
-- ingestion for Ray's Greenhouse/Lever/Ashby/SmartRecruiters request: the jobs
-- table has TWO parallel sets of columns for job provenance/freshness.
--
-- Every tracked migration (20250722191000_small_snowflake.sql onward) defines
-- snake_case columns: source_company, source_xml_file, external_job_id,
-- external_url, posted_date. Every reader in the app uses these names —
-- CompanySourceManager.tsx, Admin.tsx's Source Performance tab, useAdminData.ts.
--
-- But scripts/migrateJobs.ts has been reading/writing a SECOND, undocumented
-- set of camelCase columns instead (sourceCompany, sourceXmlFile, externalJobId,
-- externalUrl, postedDate) -- these were never created by any migration in this
-- repo, meaning they were added directly against the live DB outside of
-- version control at some point. Confirmed via direct query: on every one of
-- the 208 live job rows, the snake_case columns are 100% null while the
-- camelCase ones hold the real ingested data.
--
-- Net effect: CompanySourceManager and Admin's Source Performance tab have
-- never displayed real per-source data (always falling back to their
-- "(unknown)"/"Direct" paths), and anything reading posted_date for recency
-- sorting/display has been getting null instead of the real post date.
--
-- Fix: backfill the real (camelCase) values into the correct (snake_case,
-- tracked) columns, then drop the orphaned camelCase columns so there's only
-- one source of truth going forward. scripts/migrateJobs.ts is being rewritten
-- in the same change to write snake_case from now on.

-- 1. Backfill snake_case from camelCase wherever the snake_case value is
--    missing and a camelCase value exists to recover.
update jobs
set
  source_company = coalesce(source_company, "sourceCompany"),
  source_xml_file = coalesce(source_xml_file, "sourceXmlFile"),
  external_job_id = coalesce(external_job_id, "externalJobId"),
  external_url = coalesce(external_url, "externalUrl"),
  posted_date = coalesce(posted_date, "postedDate")
where "sourceCompany" is not null
   or "sourceXmlFile" is not null
   or "externalJobId" is not null
   or "externalUrl" is not null
   or "postedDate" is not null;

-- 2. Drop the orphaned camelCase columns now that their data has been
--    recovered into the real columns.
alter table jobs
  drop column if exists "sourceCompany",
  drop column if exists "sourceXmlFile",
  drop column if exists "externalJobId",
  drop column if exists "externalUrl",
  drop column if exists "postedDate";
