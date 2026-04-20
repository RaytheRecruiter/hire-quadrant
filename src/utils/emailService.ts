// Email notification service for job applications and status updates
// Requires email service backend (SendGrid, Mailgun, Postmark, etc.)

interface EmailPayload {
  to: string;
  subject: string;
  template?: 'application_confirmation' | 'status_update' | 'rejection' | 'offer';
  variables?: Record<string, any>;
}

/**
 * Send application confirmation email to candidate
 */
export const sendApplicationConfirmation = async (
  email: string,
  jobTitle: string,
  companyName: string,
  applicationId: string
) => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `Application Received: ${jobTitle} at ${companyName}`,
        template: 'application_confirmation',
        variables: {
          jobTitle,
          companyName,
          applicationId,
          trackingUrl: `${window.location.origin}/applications/${applicationId}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send confirmation email');
    }
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};

/**
 * Send status update email (screening, interview, etc.)
 */
export const sendStatusUpdate = async (
  email: string,
  jobTitle: string,
  companyName: string,
  status: 'screening' | 'interview' | 'offer' | 'rejection',
  message?: string
) => {
  const statusLabels: Record<string, string> = {
    screening: 'Your Application is Being Reviewed',
    interview: 'You\'re Invited to Interview',
    offer: 'Congratulations! We\'d Like to Offer You This Role',
    rejection: 'Application Update',
  };

  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `${statusLabels[status]} – ${companyName}`,
        template: 'status_update',
        variables: {
          jobTitle,
          companyName,
          status,
          message,
          dashboardUrl: `${window.location.origin}/profile`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send status update');
    }
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};

/**
 * Send weekly job recommendations email
 */
export const sendJobRecommendations = async (
  email: string,
  jobs: Array<{ id: string; title: string; company: string; url: string }>
) => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Your Weekly Job Recommendations – HireQuadrant',
        template: 'weekly_digest',
        variables: {
          jobs,
          unsubscribeUrl: `${window.location.origin}/preferences`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send recommendations');
    }
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string, resetToken: string) => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Reset Your HireQuadrant Password',
        template: 'password_reset',
        variables: {
          resetUrl: `${window.location.origin}/reset-password?token=${resetToken}`,
          expiresInHours: 24,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send reset email');
    }
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};

/**
 * Send company welcome email
 */
export const sendCompanyWelcome = async (
  email: string,
  companyName: string,
  setupUrl: string
) => {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `Welcome to HireQuadrant, ${companyName}!`,
        template: 'company_welcome',
        variables: {
          companyName,
          setupUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send welcome email');
    }
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};
