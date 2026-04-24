-- ============================================================
-- Fix: XML ingest was writing the feed filename ("hirequadrant.xml")
-- into jobs.company for every job whose <company> element was empty.
-- Rename those rows to the real employer of record, reattach the
-- companies FK, and delete the junk directory row.
--
-- Paired with the xmlParser.ts fix that adds customer/client fallbacks
-- and defaults to 'Quadrant, Inc.' instead of the filename.
-- Idempotent — safe to re-run.
-- ============================================================

-- 1. Ensure a proper "Quadrant, Inc." company row exists
INSERT INTO companies (name, display_name, slug, industry, is_active)
VALUES ('Quadrant, Inc.', 'Quadrant, Inc.', 'quadrant-inc', 'Staffing & Recruiting', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Rename any jobs stamped with the filename to the real employer
UPDATE jobs
SET company = 'Quadrant, Inc.'
WHERE company = 'hirequadrant.xml';

-- 3. Relink jobs.company_id to the Quadrant, Inc. row
UPDATE jobs j
SET company_id = c.id
FROM companies c
WHERE c.slug = 'quadrant-inc'
  AND j.company = 'Quadrant, Inc.';

-- 4. Remove the junk "hirequadrant.xml" directory row (if it exists
--    and has no remaining jobs linked to it)
DELETE FROM companies
WHERE slug = 'hirequadrant-xml'
  AND NOT EXISTS (
    SELECT 1 FROM jobs WHERE jobs.company_id = companies.id
  );
