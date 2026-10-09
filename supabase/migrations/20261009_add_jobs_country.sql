-- Per Ray 2026-10-09: Browse Jobs defaults to showing US-only postings now
-- that multi-ATS ingestion pulls in real international jobs. This column
-- is populated per-source at ingest time (see src/utils/jobSources/) --
-- JobDiva jobs are always 'US' (Quadrant's own US agency placements); the
-- 4 ATS adapters resolve it from structured fields where the platform
-- exposes one (Lever, SmartRecruiters: ISO code directly; Ashby: mapped
-- from a full country name) or a text heuristic (Greenhouse, which exposes
-- no structured country field at all). Left null when a source can't
-- determine it confidently -- those jobs are excluded from the default
-- US-only view but still visible via the "Include international (OCONUS)"
-- filter toggle, which removes the country filter entirely.

alter table jobs
  add column if not exists country text;
