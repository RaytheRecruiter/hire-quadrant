-- Per Ray's 2026-08-18 reply:
-- "Self-serve; only manual for the highest level package."
-- "We may need a comp account... don't want to have to go through the
--  stripe paywall to post trial jobs or demo jobs."
--
-- Job posting itself has been free since Phase 1 (job_limit gate
-- retired) — the actual paywalls that need a comp bypass are Resume
-- Database search and Job Sponsorship. This migration covers the Resume
-- Database side; sponsorship comps are handled in the next migration
-- alongside the sponsorship analytics work (job_sponsorship_orders
-- already has enough columns — a comp sponsorship is just a
-- price_cents_paid = 0 row, flagged via a new is_comp column there).

-- 1. Admin-settable flag: which plans require manual (mailto) upgrade
--    instead of self-serve checkout. Seeded true for the highest tier
--    (Business) per Ray's instruction. Column, not a hard-coded slug
--    check, so admins can move the line later without a code change.
alter table subscription_plans
  add column if not exists requires_manual_upgrade boolean not null default false;

update subscription_plans
set requires_manual_upgrade = true
where slug = 'resume-business';

-- 2. Comp subscriptions — admin-granted free access (trial/demo), not
--    tied to a real Stripe subscription. Distinguished from real paying
--    customers so future analytics/reporting can exclude them.
alter table subscriptions
  add column if not exists is_comp boolean not null default false;

-- 3. Self-serve cancel-at-period-end. Cancellation doesn't cut access
--    off immediately (the company already paid for the period) — it just
--    stops renewal. The webhook flips status to 'canceled' once Stripe's
--    customer.subscription.deleted actually fires at period end.
alter table subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;
