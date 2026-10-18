-- CRITICAL, confirmed live via N19 QA (2026-10-18): "Delete my data" in
-- Settings is broken in two separate, serious ways.
--
-- 1. delete_my_data() itself crashes on its very first statement with
--    "column user_id does not exist" -- confirmed live with a disposable
--    throwaway account. company_reviews' real column is author_id, not
--    user_id (same class of bug as the earlier screening_questions /
--    conversations.participant_a fixes -- code written against an assumed
--    schema that was never checked against the real one). Nothing after
--    that first UPDATE statement ever ran, so a user clicking "Permanently
--    delete" got an error and nothing was deleted at all.
--
-- 2. Even with that fixed, the account itself was never actually deleted.
--    This function's own comment said "the auth.users row itself is
--    removed by calling Supabase admin API from the client" -- but
--    GDPRPanel.tsx's deleteAccount() never does that, and no such call
--    exists anywhere else in the codebase either (grepped, confirmed
--    none). Confirmed live: after a (hypothetically working) call to this
--    RPC, the same email/password could still log in immediately after
--    "deleting" the account -- the GDPR "right to erasure" was not
--    actually being honored, just a data wipe with the login itself
--    left intact.
--
-- Fixed both: corrected column name, and added the auth.users delete as
-- the function's final step. SECURITY DEFINER gives this function
-- sufficient privilege to do this directly in SQL (no separate edge
-- function/service-role client call needed) -- existing ON DELETE CASCADE
-- foreign keys to auth.users clean up anything this function's explicit
-- deletes don't already cover.

create or replace function delete_my_data()
returns boolean language plpgsql security definer as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Anonymize reviews rather than hard-delete so counters stay consistent.
  update company_reviews
     set author_id = null,
         title = coalesce(title, ''),
         pros  = '[Removed at user request]',
         cons  = '[Removed at user request]'
   where author_id = uid;

  -- Anonymize applications for employer audit trail continuity.
  update job_applications
     set user_name = 'Deleted user',
         user_email = null,
         applicant_phone = null,
         applicant_first_name = null,
         applicant_last_name = null,
         applicant_zip = null,
         resume_url = null,
         cover_letter = null
   where user_id = uid;

  -- Hard-delete everything else owned by the user.
  delete from user_experience where user_id = uid;
  delete from user_education where user_id = uid;
  delete from user_job_preferences where user_id = uid;
  delete from user_demographics where user_id = uid;
  delete from candidates where user_id = uid;
  delete from saved_jobs where user_id = uid;
  delete from saved_searches where user_id = uid;
  delete from notification_preferences where user_id = uid;
  delete from notifications where user_id = uid;
  delete from job_skips where user_id = uid;
  delete from user_mfa_factors where user_id = uid;
  delete from user_profiles where id = uid;

  -- Actually delete the account -- the comment above this function always
  -- said this should happen; it never did, confirmed live.
  delete from auth.users where id = uid;

  return true;
end;
$$;

grant execute on function delete_my_data() to authenticated;
