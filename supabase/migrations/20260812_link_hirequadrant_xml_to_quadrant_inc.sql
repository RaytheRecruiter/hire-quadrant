-- Ray: "HireQuadrant.xml needs to be linked to a company."
--
-- 200 of 208 jobs in production have company = 'hirequadrant.xml' (the raw
-- XML feed filename, used as a placeholder) with no company_id at all.
-- Rafael confirmed with Ray/Scott: link these to the plain "Quadrant Inc"
-- company record (id ec8ad813-a198-4e73-a3c1-048171fedec6) — this is the
-- one that already has a real UI-posted job under it (2026-08-11), unlike
-- the three test-login duplicates (scott10 / employer / test).
--
-- source_xml_file is backfilled to preserve where these came from, since
-- the company column that used to hold "hirequadrant.xml" is being
-- overwritten with the real company name.

UPDATE jobs
SET
  company_id = 'ec8ad813-a198-4e73-a3c1-048171fedec6',
  company = 'Quadrant Inc',
  source_xml_file = COALESCE(source_xml_file, 'hirequadrant.xml')
WHERE company = 'hirequadrant.xml';
