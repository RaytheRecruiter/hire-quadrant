-- Per Ray 2026-09-28: when a new user is added to a company account,
-- notify the account owner by email (mirrors ZipRecruiter's "Alert: New
-- User Added to Your Account" pattern he shared as a reference).
--
-- The client-side code that fires this (AcceptInvite.tsx, right after
-- accept_company_invite succeeds) runs as the NEWLY-JOINED user, whose
-- user_profiles/company_members RLS visibility does not extend to other
-- members' emails. A SECURITY DEFINER function is the standard, narrowly-
-- scoped way to resolve just the one thing the caller needs (the owner's
-- email) without granting broader read access to auth.users. It restricts
-- callers to people who are themselves a member of that company (or an
-- admin), so it can't be used as a general email-disclosure endpoint.

create or replace function get_company_owner_emails(p_company_id uuid)
returns table(email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from company_members
    where company_id = p_company_id and user_id = auth.uid()
  ) and not exists (
    select 1 from user_profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Not authorized';
  end if;

  return query
    select u.email::text
    from company_members cm
    join auth.users u on u.id = cm.user_id
    where cm.company_id = p_company_id
      and cm.role = 'owner'
      and cm.status = 'active';
end;
$$;

grant execute on function get_company_owner_emails(uuid) to authenticated;
