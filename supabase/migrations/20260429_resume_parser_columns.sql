-- Per Scott 2026-04-29 (#11 + #12): resume parser pipeline.
-- candidates.resume_text already exists. Add:
--   - certifications:    text[] (e.g. "AWS Solutions Architect", "PMP")
--   - top_skills:        text[] (3–5 most prominent, drives Top Skills section)
--   - years_experience:  integer (parsed best-effort)
--   - current_title:     text
--   - resume_parsed_at:  timestamptz (when AI last ran; lets us skip re-parse)

alter table candidates
  add column if not exists certifications text[] default '{}',
  add column if not exists top_skills text[] default '{}',
  add column if not exists years_experience integer,
  add column if not exists current_title text,
  add column if not exists resume_parsed_at timestamptz;
