-- N07 (Nexegin developer handoff): Nexegin is now a vertical IT/technical
-- job board. Enforce eligibility by classifying every job title into IT
-- (true), explicitly non-IT (false), or unclassified/needs-review (NULL --
-- "quarantine uncertain classifications for review" per the handoff, not a
-- silent default either way). Public discovery surfaces filter to
-- is_it_role = true; company/admin management views are untouched.
--
-- Deliberately narrower than the existing `category` column
-- (20260423_add_job_category.sql), which buckets ALL jobs (including
-- Healthcare, Sales, Marketing, etc.) for the find_similar_jobs scorer and
-- must keep working for every job regardless of IT eligibility. This is a
-- separate concern, not a replacement.
--
-- Negative terms are checked first so a bare "engineer" match doesn't
-- misclassify "Mechanical Engineer" / "Civil Engineer" / "Chemical Engineer"
-- etc. as IT, and so the nursing example the handoff names explicitly
-- (N07: "excluding the nursing examples from the previous audit") is
-- excluded by rule, not by accident.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_it_role boolean;
CREATE INDEX IF NOT EXISTS idx_jobs_is_it_role ON jobs(is_it_role);

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
    WHEN lower(p_title) ~ '\m(cloud engineer|cloud architect|cloud administrator|aws|azure|gcp|kubernetes|solutions architect)\M' THEN true
    WHEN lower(p_title) ~ '\m(data engineer|data scientist|data analyst|machine learning|ml engineer|ai engineer|business intelligence|bi developer|analytics engineer)\M' THEN true
    WHEN lower(p_title) ~ '\m(database administrator|dba|database engineer)\M' THEN true
    WHEN lower(p_title) ~ '\m(it support|help ?desk|desktop support|it technician|network technician|noc technician|it specialist|systems administrator|sysadmin|system administrator)\M' THEN true
    WHEN lower(p_title) ~ '\m(network engineer|network administrator|network architect|infrastructure engineer|systems engineer)\M' THEN true
    WHEN lower(p_title) ~ '\m(qa engineer|quality assurance engineer|test engineer|automation engineer|sdet)\M' THEN true
    WHEN lower(p_title) ~ '\mengineer\M' AND lower(p_title) ~ '\m(it|tech|technical|platform|application|product)\M' THEN true
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION set_jobs_is_it_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title OR TG_OP = 'INSERT' THEN
    NEW.is_it_role := classify_it_job_title(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobs_set_is_it_role ON jobs;
CREATE TRIGGER trg_jobs_set_is_it_role
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_jobs_is_it_role();

-- One-shot backfill for existing rows.
UPDATE jobs SET is_it_role = classify_it_job_title(title);
