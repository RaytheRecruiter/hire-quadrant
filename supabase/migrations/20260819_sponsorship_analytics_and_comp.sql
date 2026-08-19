-- Per Ray's 2026-08-18 reply: "No analytics yet on sponsorship spend vs.
-- results (views/applications lift by tier) -- Build it please!!!!" and
-- the comp/trial account ask extended to job sponsorship (Resume
-- Database comps were covered in 20260819_selfserve_billing_and_comp.sql
-- via subscriptions.is_comp; job_sponsorship_orders needs its own flag
-- since it's a one-time purchase ledger, not a subscription).

alter table job_sponsorship_orders
  add column if not exists is_comp boolean not null default false;

-- purchased_by/stripe_checkout_session_id are already nullable, so a comp
-- row (admin-granted, no real Stripe purchase) just omits
-- stripe_checkout_session_id and sets price_cents_paid/addon_price_cents
-- to 0 with is_comp = true.
--
-- The table previously had no INSERT policy at all (only the service-role
-- webhook could write, bypassing RLS) -- real purchase rows must keep
-- coming exclusively from the webhook. This adds a narrow admin path
-- restricted to is_comp = true only, so the client-side comp action can't
-- be repurposed to fabricate a real-looking financial record.
drop policy if exists "Admins can insert comp sponsorship orders" on job_sponsorship_orders;
create policy "Admins can insert comp sponsorship orders"
  on job_sponsorship_orders for insert to authenticated
  with check (
    is_comp = true
    and exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')
  );
