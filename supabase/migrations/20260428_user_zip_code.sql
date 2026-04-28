-- Per Scott 2026-04-28: ZIP code is now a required field in the candidate's
-- Job Preferences. Stored on user_job_preferences as a 5- or 5+4-digit string
-- (preserves leading zeros, which an int would lose).
-- The mandatory check is enforced client-side; the column itself is nullable
-- so existing rows don't break. Once Scott confirms, a follow-up migration
-- can add `not null` after backfilling.

alter table user_job_preferences
  add column if not exists zip_code text;

-- Optional: format check (5 digits or 5+4). Constraint named so it's
-- droppable in a follow-up if Scott wants international ZIPs later.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_job_preferences_zip_code_format'
  ) then
    alter table user_job_preferences
      add constraint user_job_preferences_zip_code_format
      check (zip_code is null or zip_code ~ '^\d{5}(-\d{4})?$');
  end if;
end $$;
