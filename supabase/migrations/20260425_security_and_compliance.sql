-- PR X7 security + compliance: MFA factors, session tracking surface,
-- GDPR export RPC, GDPR delete RPC, auth rate-limit RPC (uses auth_attempts
-- from X2), admin audit view.
-- Idempotent.

-- 1. MFA factors (TOTP secret per user) -------------------------------------
create table if not exists user_mfa_factors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  secret text not null,
  verified boolean not null default false,
  recovery_codes text[],
  enabled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table user_mfa_factors enable row level security;

drop policy if exists mfa_self on user_mfa_factors;
create policy mfa_self on user_mfa_factors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Session tracking -------------------------------------------------------
-- Supabase manages auth.sessions under the hood. We expose a view for
-- the signed-in user to see their own sessions via RLS.
create or replace view my_auth_sessions as
  select s.id, s.created_at, s.updated_at, s.not_after, s.user_id, s.user_agent, s.ip
  from auth.sessions s
  where s.user_id = auth.uid();

comment on view my_auth_sessions is
  'Exposes the authenticated user''s own sessions for session management UI.';

grant select on my_auth_sessions to authenticated;

-- 3. Auth rate-limit RPC ----------------------------------------------------
-- Consumed by login/register forms to short-circuit brute-force attempts.
create or replace function check_auth_rate_limit(p_email text)
returns boolean language plpgsql security definer as $$
declare
  recent int;
begin
  select count(*)
    into recent
    from auth_attempts
    where lower(email) = lower(p_email)
      and attempted_at > now() - interval '10 minutes'
      and success = false;
  return recent < 8;
end;
$$;

grant execute on function check_auth_rate_limit(text) to anon, authenticated;

-- 4. GDPR export RPC --------------------------------------------------------
-- Returns a jsonb dump of everything owned by the calling user.
create or replace function export_my_data()
returns jsonb language plpgsql security definer as $$
declare
  result jsonb := '{}'::jsonb;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  result := result || jsonb_build_object(
    'profile',     (select to_jsonb(p) from user_profiles p where p.id = uid),
    'candidate',   (select to_jsonb(c) from candidates c where c.user_id = uid),
    'experience',  coalesce((select jsonb_agg(to_jsonb(e)) from user_experience e where e.user_id = uid), '[]'::jsonb),
    'education',   coalesce((select jsonb_agg(to_jsonb(ed)) from user_education ed where ed.user_id = uid), '[]'::jsonb),
    'preferences', (select to_jsonb(jp) from user_job_preferences jp where jp.user_id = uid),
    'applications', coalesce((select jsonb_agg(to_jsonb(a)) from job_applications a where a.user_id = uid), '[]'::jsonb),
    'saved_jobs',  coalesce((select jsonb_agg(to_jsonb(s)) from saved_jobs s where s.user_id = uid), '[]'::jsonb),
    'reviews',     coalesce((select jsonb_agg(to_jsonb(r)) from company_reviews r where r.user_id = uid), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(to_jsonb(n)) from notifications n where n.user_id = uid), '[]'::jsonb),
    'notification_preferences', (select to_jsonb(np) from notification_preferences np where np.user_id = uid),
    'saved_searches', coalesce((select jsonb_agg(to_jsonb(ss)) from saved_searches ss where ss.user_id = uid), '[]'::jsonb),
    'demographics', (select to_jsonb(d) from user_demographics d where d.user_id = uid),
    'exported_at', now()
  );

  return result;
end;
$$;

grant execute on function export_my_data() to authenticated;

-- 5. GDPR delete RPC --------------------------------------------------------
-- Soft-anonymize reviews + applications, then hard-delete user-owned rows.
-- The auth.users row itself is removed by calling Supabase admin API from
-- the client, but this RPC handles all application-layer state.
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
     set user_id = null,
         title = coalesce(title, ''),
         pros  = '[Removed at user request]',
         cons  = '[Removed at user request]'
   where user_id = uid;

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

  return true;
end;
$$;

grant execute on function delete_my_data() to authenticated;

-- 6. Admin audit trail view -------------------------------------------------
-- audit_log uses entity_type/entity_id (see 20260425_audit_log.sql).
-- Alias to target_* in the view so the UI can stay stable if schema changes.
create or replace view admin_audit_feed as
  select a.id, a.actor_id, up.name as actor_name, a.action,
         a.entity_type as target_type,
         a.entity_id   as target_id,
         a.metadata, a.created_at
    from audit_log a
    left join user_profiles up on up.id = a.actor_id
   order by a.created_at desc;

comment on view admin_audit_feed is
  'Denormalized audit feed — requires admin role to read (enforce via app).';

grant select on admin_audit_feed to authenticated;
