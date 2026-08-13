-- Ray: "The primary user in the subscription manager doesn't work. You
-- need to be able to invite 1 email as the owner of the company."
--
-- Root causes (confirmed against production data):
-- 1. company_members has been completely empty (0 rows across 86
--    companies). The Subscription Manager's "Primary User (Owner)" column
--    and the "Change ownership" transfer modal both read from it, and
--    transfer_company_ownership() requires the target to already be a
--    company_members row — so the whole feature was a no-op for every
--    company. Backfill it from the legacy single-tenant
--    user_profiles.company_id link (confirmed 1:1, no company has more
--    than one legacy company-role profile, so this is safe).
-- 2. company_invitations only allowed role in ('admin','standard') — there
--    was no way to invite someone directly as 'owner'.
-- 3. company_invitations' write policy only checked company_members
--    membership, so a HireQuadrant super-admin (Subscription Manager is
--    admin-only) couldn't create an invite for a company they don't
--    already belong to. Add the same super-admin bypass already used on
--    company_team_invites_write.

-- 1. Backfill company_members owners from legacy user_profiles
insert into company_members (company_id, user_id, role, status, joined_at)
select up.company_id, up.id, 'owner', 'active', up.created_at
from user_profiles up
where up.role = 'company'
  and up.company_id is not null
on conflict (company_id, user_id) do nothing;

-- 2. Allow role='owner' on company_invitations
alter table company_invitations drop constraint if exists company_invitations_role_check;
alter table company_invitations add constraint company_invitations_role_check
  check (role in ('owner', 'admin', 'standard'));

-- 3. Super-admin bypass on the write policy
drop policy if exists "invites_owner_admin_write" on company_invitations;
create policy "invites_owner_admin_write"
  on company_invitations for all
  to authenticated
  using (
    is_company_owner_or_admin(company_id, auth.uid())
    or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    is_company_owner_or_admin(company_id, auth.uid())
    or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin')
  );
