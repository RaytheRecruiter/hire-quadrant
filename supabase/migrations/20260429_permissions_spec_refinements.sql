-- Per Scott 2026-04-29 spec refinements — closing four small gaps in the
-- detailed Phase 1 UI Design Spec for Company Member Permissions:
--   1. First/Last name on the Invite Team Member form
--   2. Resend invite (covered in code; this migration just bumps the
--      expiry on resend via the existing column)
--   3. Deactivate User action (status='inactive' was already a valid
--      enum; no schema change needed)
--   4. Admin can change a company's Primary User (Owner) from the
--      Subscription Manager — adds an RPC for the atomic role swap.

-- ─── company_invitations: invitee name (optional) ─────────────────────────
alter table company_invitations
  add column if not exists first_name text,
  add column if not exists last_name text;

-- ─── transfer_company_ownership RPC ───────────────────────────────────────
-- Atomically moves the Owner role from whoever holds it now to a target
-- user. The previous Owner is demoted to Admin so they don't lose access
-- entirely (matches Scott's spec: only one Owner per company).
--
-- Authorization: caller must either be (a) the current Owner (self
-- transfer) or (b) a HireQuadrant super-admin (user_profiles.role='admin').
create or replace function transfer_company_ownership(
  p_company_id uuid,
  p_new_owner_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_is_admin boolean;
  v_caller_is_current_owner boolean;
  v_target_member_id uuid;
begin
  if v_caller is null then
    raise exception 'Must be signed in';
  end if;

  -- Is the caller a super admin?
  select role = 'admin' into v_caller_is_admin
  from user_profiles where id = v_caller;

  -- Is the caller the current Owner of this company?
  select exists (
    select 1 from company_members
    where company_id = p_company_id
      and user_id = v_caller
      and role = 'owner'
      and status = 'active'
  ) into v_caller_is_current_owner;

  if not coalesce(v_caller_is_admin, false) and not v_caller_is_current_owner then
    raise exception 'Only the current Owner or a HireQuadrant admin can transfer ownership';
  end if;

  -- Verify the target is already a member of the company.
  select id into v_target_member_id
  from company_members
  where company_id = p_company_id
    and user_id = p_new_owner_user_id
    and status = 'active';

  if v_target_member_id is null then
    raise exception 'Target user must be an active member of the company first';
  end if;

  -- Demote the existing Owner(s) to Admin. There should only be one but
  -- guard for data oddities.
  update company_members
    set role = 'admin', updated_at = now()
    where company_id = p_company_id
      and role = 'owner';

  -- Promote the target.
  update company_members
    set role = 'owner', updated_at = now()
    where id = v_target_member_id;
end;
$$;

grant execute on function transfer_company_ownership(uuid, uuid) to authenticated;

-- ─── accept_company_invite: also populate user_profiles.name ─────────────
-- Re-create with the same signature; only difference vs the earlier
-- version is the user_profiles update now uses first/last name from the
-- invitation when present and the existing profile name is missing.
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
  v_full_name text;
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

  -- Compose the full name from first/last if both present, else first
  -- alone, else last alone.
  v_full_name := nullif(trim(coalesce(v_invite.first_name, '') || ' ' || coalesce(v_invite.last_name, '')), '');

  -- Link the user_profiles row if currently unlinked, and fill the name
  -- if the existing one is empty. We don't overwrite a name the user
  -- already set themselves.
  update user_profiles
    set company_id = coalesce(company_id, v_invite.company_id),
        role = case when role is null or role = 'candidate' then 'company' else role end,
        name = case when (name is null or name = '') and v_full_name is not null then v_full_name else name end
    where id = v_user_id;

  return v_member_id;
end;
$$;
