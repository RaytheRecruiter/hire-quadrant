-- CRITICAL, found auditing the Stripe webhook handler (2026-10-19):
-- stripe-webhook/index.ts has no idempotency protection at all -- no
-- tracking of processed Stripe event IDs, and job_sponsorship_orders.
-- stripe_checkout_session_id has no unique constraint either, so there's
-- no backstop anywhere in the flow. Stripe retries webhooks automatically
-- on a non-2xx response, a timeout, or a network blip (documented,
-- expected behavior, not an edge case) -- confirmed by reading every
-- handler branch, a retried checkout.session.completed event would:
--   - job sponsorship: insert a second job_sponsorship_orders row and
--     push sponsor_end_date/urgent_until further into the future again,
--     giving extra sponsored-placement duration for free
--   - credit pack purchase: re-add purchased_contacts_remaining a second
--     time, crediting the company for contacts they only paid for once
-- (The subscription upsert path is already safe -- onConflict on
-- company_id makes it naturally idempotent.)
--
-- Standard fix: record every Stripe event id the first time it's seen,
-- and skip all processing on a repeat delivery.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies granted to authenticated/anon -- this table is written and
-- read only by the webhook handler via the service role key, which
-- bypasses RLS entirely. Intentionally inaccessible from the client.
