-- Ray/Scott QA (2026-10-27): Quadrant Inc shows 34 jobs on the public
-- company page but ~150-200 in the Company Source Manager. Root cause
-- confirmed live: the public company page, Browse Jobs, and the homepage
-- all filter to is_it_role = true (N07, 20261018_it_job_eligibility.sql).
-- That filter is working as designed -- but platform-wide, 1,742 of 2,551
-- jobs (68%) are sitting at is_it_role = NULL ("needs review", never
-- actually reviewed), not false. For Quadrant Inc specifically: 33 true,
-- 71 correctly-excluded false (medical/admin/logistics roles), 97 NULL.
--
-- Spot-checked all 97 NULL Quadrant titles. Most are genuinely non-IT
-- (Medical Receptionist x9, Pharmacy Technician, Social Worker, etc.) and
-- are correctly sitting in the quarantine bucket -- that's the intended
-- behavior, not a bug to "fix" by force-classifying them true. But several
-- are unambiguous IT/technical roles the original regex simply didn't
-- cover:
--   - "Unix System Adminstrator" -- real, common misspelling of
--     "Administrator"; the exact-word-boundary regex never matches it
--   - "Systems Architect (...)" -- only "solutions architect" was covered
--   - "Cloud Computing Engineer (...)" -- "cloud computing engineer" has
--     an extra word between "cloud" and "engineer" vs. the existing
--     "cloud engineer" phrase match
--   - "Red Hat Linux Engineer" -- no linux/unix engineer pattern existed
--   - "NLP Engineer/Python (Sr.)" -- "ai engineer"/"ml engineer" were
--     covered, "nlp engineer" was not
--
-- This migration adds those five narrow, high-confidence patterns only.
-- It does not attempt to clear the NULL bucket generally -- the
-- quarantine-uncertain-titles design from the original handoff is correct;
-- most of what's in it is correctly non-IT. Re-running the backfill here
-- only touches currently-NULL rows so already-classified true/false rows
-- are untouched.

CREATE OR REPLACE FUNCTION classify_it_job_title(p_title text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_title IS NULL OR btrim(p_title) = '' THEN NULL
    -- Explicit non-IT disciplines that would otherwise false-positive on
    -- a bare "engineer"/"technician"/"analyst" match below.
    WHEN lower(p_title) ~ '\m(mechanical|civil|chemical|structural|industrial|biomedical|aerospace|environmental|petroleum|marine|agricultural)\s+engineer' THEN false
    WHEN lower(p_title) ~ '\m(nurse|nursing|rn|cna|lpn|physician|medical assistant|clinical|therapist|dentist|pharmacist|paramedic|phlebotomist)\M' THEN false
    WHEN lower(p_title) ~ '\m(teacher|professor|instructor|principal)\M' THEN false
    WHEN lower(p_title) ~ '\m(driver|warehouse|forklift|retail|cashier|barista|chef|cook|server|housekeeping|hospitality|janitor|custodian)\M' THEN false
    WHEN lower(p_title) ~ '\m(attorney|paralegal|accountant|bookkeeper|auditor|realtor|insurance agent)\M' THEN false
    WHEN lower(p_title) ~ '\m(recruiter|human resources|hr generalist|hr manager)\M' THEN false
    -- Strong IT/technical positive terms, grouped loosely around the
    -- categories the handoff itself suggests (software, cybersecurity,
    -- cloud, data, IT support, infrastructure).
    WHEN lower(p_title) ~ '\m(software|developer|programmer|devops|sre|site reliability|full[- ]?stack|front[- ]?end|back[- ]?end|web developer|mobile developer|ios developer|android developer|firmware|embedded)\M' THEN true
    WHEN lower(p_title) ~ '\m(cyber ?security|infosec|information security|security engineer|security analyst|penetration tester|pentester|soc analyst)\M' THEN true
    -- 2026-10-27: added "cloud computing engineer" (extra word vs. the
    -- original "cloud engineer" literal phrase).
    WHEN lower(p_title) ~ '\m(cloud engineer|cloud computing engineer|cloud architect|cloud administrator|aws|azure|gcp|kubernetes|solutions architect)\M' THEN true
    -- 2026-10-27: added "nlp engineer" / "natural language processing".
    WHEN lower(p_title) ~ '\m(data engineer|data scientist|data analyst|machine learning|ml engineer|ai engineer|nlp engineer|natural language processing|business intelligence|bi developer|analytics engineer)\M' THEN true
    WHEN lower(p_title) ~ '\m(database administrator|dba|database engineer)\M' THEN true
    WHEN lower(p_title) ~ '\m(it support|help ?desk|desktop support|it technician|network technician|noc technician|it specialist|systems administrator|sysadmin|system administrator)\M' THEN true
    -- 2026-10-27: added linux/unix engineer+administrator, including the
    -- "Adminstrator" misspelling (missing the second "i") actually present
    -- in the data -- scoped tightly to linux/unix prefixes only, so it
    -- can't catch an unrelated "Payroll Adminstrator" typo elsewhere
    -- (verified: "Payroll Adminstrator" does NOT match this pattern).
    WHEN lower(p_title) ~ '\m(linux|unix)\s+(system\s+)?(engineer|admini?strator)\M' THEN true
    -- 2026-10-27: added "systems architect" (only "solutions architect"
    -- was covered before).
    WHEN lower(p_title) ~ '\m(network engineer|network administrator|network architect|infrastructure engineer|systems engineer|systems? architect)\M' THEN true
    WHEN lower(p_title) ~ '\m(qa engineer|quality assurance engineer|test engineer|automation engineer|sdet)\M' THEN true
    WHEN lower(p_title) ~ '\mengineer\M' AND lower(p_title) ~ '\m(it|tech|technical|platform|application|product)\M' THEN true
    ELSE NULL
  END;
$$;

-- Re-run only against currently-unclassified rows -- leaves existing
-- true/false classifications untouched.
UPDATE jobs SET is_it_role = classify_it_job_title(title) WHERE is_it_role IS NULL;
