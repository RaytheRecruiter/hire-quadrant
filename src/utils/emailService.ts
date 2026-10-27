// Candidate-facing transactional emails: application confirmation and
// application status updates.
//
// 2026-10-27 QA (Ray): candidates were getting neither of these. Root
// cause was this whole file -- every function here posted to
// `/api/email/send`, a path that doesn't exist in this Vite SPA (there is
// no backend route handler for it). It silently failed every time inside
// a try/catch, and the one place that imported from this file
// (passwordReset.ts) never even called the function it imported. The
// actual working mechanism everywhere else in the app (team invites,
// contact form, etc.) is the `send-email` Supabase Edge Function, called
// directly -- that's what this file now does.
//
// The 'application_confirmation' and 'status_update' templates below were
// already fully built in supabase/functions/send-email/index.ts; they
// were just never invoked.
//
// Preference gating: notification_preferences is self-read-only by RLS
// (a company user updating someone's application status can't read that
// candidate's prefs client-side), so the opt-out check for status_update
// happens server-side inside send-email itself, keyed off `userId`.
// application_confirmation is a receipt for an action the candidate just
// took, not an opt-out-able notification, so it's never gated.

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/send-email`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface SendResult {
  success: boolean;
  error?: unknown;
}

async function send(payload: {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, unknown>;
  userId?: string;
}): Promise<SendResult> {
  try {
    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`send-email returned ${res.status}: ${text}`);
    }
    return { success: true };
  } catch (error) {
    // Best-effort: never let a notification email failure block the
    // underlying action (applying, changing a status) that already
    // succeeded in the database.
    console.error('[emailService] send failed:', error);
    return { success: false, error };
  }
}

/**
 * Sent to a candidate right after they submit an application. Not
 * gated by notification preferences -- this is a receipt, not an
 * opt-out-able notification.
 */
export const sendApplicationConfirmation = async (
  email: string,
  jobTitle: string,
  companyName: string,
  applicationId: string,
): Promise<SendResult> =>
  send({
    to: email,
    subject: `Application Received: ${jobTitle} at ${companyName}`,
    template: 'application_confirmation',
    variables: {
      jobTitle,
      companyName,
      applicationId,
      trackingUrl: `${window.location.origin}/my-jobs`,
    },
  });

/**
 * Sent to a candidate when their application status changes. Gated
 * server-side behind the candidate's `email_application_updates`
 * preference -- pass `userId` so send-email can check it.
 */
export const sendStatusUpdate = async (
  email: string,
  userId: string,
  jobTitle: string,
  companyName: string,
  status: string,
  message?: string,
): Promise<SendResult> => {
  const statusLabels: Record<string, string> = {
    Screening: 'Your Application is Being Reviewed',
    Interview: "You're Invited to Interview",
    Offer: "Congratulations! We'd Like to Offer You This Role",
    Hired: 'Congratulations on Your New Role!',
    Rejected: 'Application Update',
  };

  return send({
    to: email,
    userId,
    subject: `${statusLabels[status] || 'Application Update'} – ${companyName}`,
    template: 'status_update',
    variables: {
      jobTitle,
      companyName,
      status,
      message,
      dashboardUrl: `${window.location.origin}/my-jobs`,
    },
  });
};
