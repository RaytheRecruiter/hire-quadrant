-- CRITICAL, found working N14 (2026-10-18): JobDiva has never deleted a
-- single stale job, confirmed live. migrateJobs.ts's scoped stale-delete
-- (added 2026-09-21, 20260921_consolidate_job_source_columns.sql) filters
-- existing rows via `.eq('source_xml_file', adapter.id)`, where
-- adapter.id is the short identifier 'hirequadrant.xml'. But the actual
-- value written into every JobDiva job's source_xml_file column has
-- always been the full feed URL (xmlParser.ts's
-- fetchAndParseJobsXmlWithSources passed source.url instead of
-- source.name into parseJobsXml's sourceXmlFile parameter -- fixed in
-- the same commit as this migration). Since no row's source_xml_file
-- literally equals 'hirequadrant.xml', the stale-delete query always
-- returned zero candidate rows for JobDiva, so jobs that disappear from
-- the live feed are never removed.
--
-- Confirmed live: 5+ JobDiva job IDs (26-02687, 26-02675, 26-02668,
-- 26-02667, 26-02670, more likely exist) are verified absent from the
-- current live feed (fetched and grepped directly) but still sit in the
-- jobs table with status = 'open', created_at = updated_at (never
-- touched since insertion) -- meaning candidates can currently apply to
-- real postings that no longer exist. This also explains why these
-- specific rows had country = NULL even after the 2026-10-09 country-
-- backfill fix: they haven't been re-upserted since before that fix
-- shipped, because they're not in the feed to be re-upserted at all.
--
-- This migration only normalizes the stored identifier so the next
-- scheduled sync (every 4 hours) can correctly recognize and remove
-- whichever of these rows are genuinely gone -- it does not itself
-- delete anything, since that's the existing, already-correct
-- responsibility of migrateJobs.ts's stale-delete step once it can
-- actually find the rows.

UPDATE jobs
SET source_xml_file = 'hirequadrant.xml'
WHERE source_xml_file LIKE 'https://www2.jobdiva.com/%';
