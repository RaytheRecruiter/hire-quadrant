-- Both the Contact page and NewsletterSignup have been calling dead
-- third-party integrations that were never actually configured --
-- Contact.tsx posted to a hardcoded 'YOUR_FORM_ID' Formspree endpoint
-- (every submission 404s), and NewsletterSignup.tsx checked for its own
-- hardcoded 'YOUR_MAILCHIMP_ACTION_URL' placeholder and, on detecting it,
-- showed a FAKE success toast ("Thanks for subscribing! Check your email
-- to confirm.") while silently discarding the email -- confirmed live
-- 2026-10-18, never caught before now.
--
-- handle-form-submission (the edge function) already has the real logic
-- for both -- anti-spam checks, duplicate prevention, and confirmation/
-- notification emails -- but was never actually wired up to either
-- frontend, and the table it writes to never existed. Creating it here;
-- see also the 3 new email templates added to send-email/index.ts
-- (contact_confirmation, contact_notification, newsletter_confirmation).

CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('contact', 'newsletter')),
  name text,
  email text NOT NULL,
  category text,
  subject text,
  message text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_email_message
  ON form_submissions(email, message, created_at);

-- No RLS policies: this table is only ever written to by
-- handle-form-submission using the service-role key (bypasses RLS), and
-- never read by any client-facing code. RLS enabled with zero policies
-- so even an anon/authenticated key can't read or write it directly.
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
