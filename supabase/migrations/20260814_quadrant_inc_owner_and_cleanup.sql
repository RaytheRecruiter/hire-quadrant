-- Ray's reply 2026-08-14:
-- "Can you add rrrainey@quadrantinc.com as the company owner for Quadrant
-- Inc. Remove the duplicates ones that aren't linked to the XML."
--
-- The 3 duplicate "Quadrant Inc (scott10/employer/test)" companies were
-- confirmed to have zero jobs, zero company_members, zero invitations,
-- zero reviews, and zero subscriptions attached — safe to delete outright.
-- companies.id is referenced with ON DELETE CASCADE everywhere in this
-- schema, so this also cleans up anything else pointing at them.
--
-- If rrrainey@quadrantinc.com hasn't signed up yet, the owner-linking
-- block below silently does nothing (0 rows) — check auth.users for that
-- email if the row count looks off.

-- 1. Link rrrainey@quadrantinc.com as Owner of the canonical Quadrant Inc
insert into company_members (company_id, user_id, role, status, joined_at)
select 'ec8ad813-a198-4e73-a3c1-048171fedec6', au.id, 'owner', 'active', now()
from auth.users au
where au.email = 'rrrainey@quadrantinc.com'
on conflict (company_id, user_id) do update set role = 'owner', status = 'active';

-- Also set the legacy single-tenant link (user_profiles.company_id) —
-- CompanyDashboard.tsx and other older screens still key off this instead
-- of company_members.
update user_profiles
set company_id = 'ec8ad813-a198-4e73-a3c1-048171fedec6',
    role = 'company'
where id = (select id from auth.users where email = 'rrrainey@quadrantinc.com');

-- 2. Remove the 3 duplicate Quadrant Inc companies (not linked to the XML feed)
delete from companies
where id in (
  '3e0d440d-c87a-42ff-9872-82cefc83ce84', -- Quadrant Inc (scott10)
  '940f2275-215e-45d3-bd72-709dfec702fe', -- Quadrant Inc (employer)
  '80c0bf30-0249-4cec-9771-f8a6935ec281'  -- Quadrant Inc (test)
);
