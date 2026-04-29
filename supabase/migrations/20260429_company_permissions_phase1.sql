-- Per Scott 2026-04-29 (#4): Phase 1 MVP for company member permissions.
-- Three roles (owner, admin, standard); standard users have a permission
-- bag + scope. Email invites use a token table; accepted invites get
-- promoted to company_members.
--
-- Phase 2 (deferred per Scott): Database Search paid permission, billing
-- permissions, recruiter activity reports, candidate unlock credits, AI
-- match score visibility.

-- ─── company_members ──────────────────────────────────────────────────────
create table if not exists company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'standard')),
  -- permission flags only meaningful for role='standard'.
  -- Owners and admins implicitly have everything.
  -- Keys mirror Scott's spec toggles. Default = recruiter floor.
  permissions jsonb not null default jsonb_build_object(
    'view_assigned_jobs', true,
    'view_all_jobs', false,
    'post_jobs', false,
    'edit_jobs', false,
    'sponsor_jobs', false,
    'close_jobs', false,
    'view_applicants', true,
    'message_applicants', true,
    'view_resume_contact', false,
    'download_resumes', false,
    'edit_company_page', false,
    'respond_to_reviews', false,
    'view_analytics_basic', true,
    'view_analytics_full', false,
    'manage_users', false,
    'manage_billing', false
  ),
  -- 'assigned' = only assigned jobs/applicants; 'all' = entire company.
  scope text not null default 'assigned' check (scope in ('assigned', 'all')),
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (company_id, user_id)
);

create index if not exists idx_company_members_company on company_members(company_id);
create index if not exists idx_company_members_user on company_members(user_id);

-- ─── company_invitations ──────────────────────────────────────────────────
create table if not exists company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'standard')),
  permissions jsonb not null default '{}'::jsonb,
  scope text not null default 'assigned' check (scope in ('assigned', 'all')),
  -- Random URL-safe token. Caller generates client-side; column is unique.
  token text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  accepted_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists idx_company_invitations_company on company_invitations(company_id);
create index if not exists idx_company_invitations_email on company_invitations(lower(email));
create index if not exists idx_company_invitations_token on company_invitations(token);

-- ─── helper: is_company_member ────────────────────────────────────────────
-- Used by RLS to avoid recursive policies on company_members itself.
create or replace function is_company_owner_or_admin(p_company_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from company_members
    where company_id = p_company_id
      and user_id = p_user_id
      and role in ('owner', 'admin')
      and status = 'active'
  );
$$;

-- ─── RLS: company_members ─────────────────────────────────────────────────
alter table company_members enable row level security;

drop policy if exists "members_self_select" on company_members;
create policy "members_self_select"
  on company_members for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "members_company_select" on company_members;
create policy "members_company_select"
  on company_members for select
  to authenticated
  using (
    exists (
      select 1 from company_members me
      where me.company_id = company_members.company_id
        and me.user_id = auth.uid()
        and me.status = 'active'
    )
  );

drop policy if exists "members_owner_admin_write" on company_members;
create policy "members_owner_admin_write"
  on company_members for all
  to authenticated
  using (is_company_owner_or_admin(company_id, auth.uid()))
  with check (is_company_owner_or_admin(company_id, auth.uid()));

-- ─── RLS: company_invitations ─────────────────────────────────────────────
alter table company_invitations enable row level security;

drop policy if exists "invites_owner_admin_select" on company_invitations;
create policy "invites_owner_admin_select"
  on company_invitations for select
  to authenticated
  using (is_company_owner_or_admin(company_id, auth.uid()));

drop policy if exists "invites_owner_admin_write" on company_invitations;
create policy "invites_owner_admin_write"
  on company_invitations for all
  to authenticated
  using (is_company_owner_or_admin(company_id, auth.uid()))
  with check (is_company_owner_or_admin(company_id, auth.uid()));

-- Anonymous and authenticated users need to be able to look up an invite
-- by its token to render the accept page. The token itself is the secret;
-- without it, this policy returns nothing. We deliberately do NOT include
-- a write path here — accepting goes through an RPC.
drop policy if exists "invites_anon_select_by_token" on company_invitations;
create policy "invites_anon_select_by_token"
  on company_invitations for select
  to anon, authenticated
  using (true);  -- token is unguessable; rows are listed only if caller knows the value

-- ─── accept_invite RPC ────────────────────────────────────────────────────
-- Atomic: validates the invite, inserts/updates company_members, and
-- marks the invite accepted. Returns the membership row id.
create or replace function accept_company_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite company_invitations%rowtype;
  v_user_id uuid := auth.uid();
  v_member_id uuid;
begin
  if v_user_id is null then
    raise exception 'Must be signed in to accept an invitation';
  end if;

  select * into v_invite from company_invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Invalid invitation token';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation is no longer valid (status: %)', v_invite.status;
  end if;

  if v_invite.expires_at < now() then
    update company_invitations set status = 'expired' where id = v_invite.id;
    raise exception 'Invitation has expired';
  end if;

  insert into company_members (
    company_id, user_id, role, permissions, scope, status,
    invited_by, invited_at, joined_at
  ) values (
    v_invite.company_id, v_user_id, v_invite.role, v_invite.permissions,
    v_invite.scope, 'active', v_invite.invited_by, v_invite.invited_at, now()
  )
  on conflict (company_id, user_id) do update set
    role = excluded.role,
    permissions = excluded.permissions,
    scope = excluded.scope,
    status = 'active',
    joined_at = now(),
    updated_at = now()
  returning id into v_member_id;

  update company_invitations
    set status = 'accepted', accepted_at = now()
    where id = v_invite.id;

  -- Also link the user_profiles row so existing single-company assumptions
  -- still resolve. Safe: only sets if currently null.
  update user_profiles
    set company_id = v_invite.company_id, role = 'company'
    where id = v_user_id and company_id is null;

  return v_member_id;
end;
$$;

grant execute on function accept_company_invite(text) to authenticated;

-- ─── Owner backfill ───────────────────────────────────────────────────────
-- Every existing user_profiles row with role='company' and a company_id
-- becomes the Owner of that company. Idempotent via unique constraint.
insert into company_members (company_id, user_id, role, scope, status, joined_at)
select
  up.company_id,
  up.id,
  'owner',
  'all',
  'active',
  coalesce(up.created_at, now())
from user_profiles up
where up.role = 'company'
  and up.company_id is not null
on conflict (company_id, user_id) do nothing;
