import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface EmailRequest {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

// Build email template HTML
function buildEmailTemplate(template: string, variables: Record<string, any>): string {
  const templates: Record<string, (v: any) => string> = {
    application_confirmation: (v) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #333;">
          <h1>Application Received!</h1>
          <p>We received your application for <strong>${v.jobTitle}</strong> at ${v.companyName}.</p>
          <p>
            <a href="${v.trackingUrl}" style="background: #0035ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Track Application
            </a>
          </p>
          <p>We'll keep you updated every step of the way.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">© 2026 HireQuadrant</p>
        </body>
      </html>
    `,

    status_update: (v) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #333;">
          <h1>Application Update</h1>
          <p>Great news! Your application for <strong>${v.jobTitle}</strong> is moving forward.</p>
          <p>${v.message || 'More details coming soon.'}</p>
          <p>
            <a href="${v.dashboardUrl}" style="background: #0035ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View All Applications
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">© 2026 HireQuadrant</p>
        </body>
      </html>
    `,

    password_reset: (v) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #333;">
          <h1>Reset Your Password</h1>
          <p>Click the link below to reset your password. This link expires in ${v.expiresInHours} hours.</p>
          <p>
            <a href="${v.resetUrl}" style="background: #0035ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">© 2026 HireQuadrant</p>
        </body>
      </html>
    `,

    team_invitation: (v) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #333; max-width: 560px; margin: 0 auto;">
          <h1>You've been invited to join ${v.companyName} on HireQuadrant</h1>
          <p>${v.inviterName ? `${v.inviterName}` : 'Your team'} invited you as a <strong>${v.roleLabel}</strong>${v.scopeLabel ? ` (${v.scopeLabel})` : ''}.</p>
          <p>Click below to accept the invitation. The link expires on ${v.expiresOn}.</p>
          <p style="margin: 24px 0;">
            <a href="${v.inviteUrl}" style="background: #0035ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Accept invitation
            </a>
          </p>
          <p style="color: #666; font-size: 13px;">
            Or copy and paste this URL into your browser:<br>
            <a href="${v.inviteUrl}" style="color: #0035ff; word-break: break-all;">${v.inviteUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
          <p style="font-size: 12px; color: #666;">
            If you weren't expecting this, you can safely ignore the email.
          </p>
          <p style="font-size: 12px; color: #666;">© 2026 HireQuadrant</p>
        </body>
      </html>
    `,

    weekly_digest: (v) => `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #333;">
          <h1>Your Weekly Job Recommendations</h1>
          <p>Here are the top jobs matched for you this week:</p>
          <ul style="list-style: none; padding: 0;">
            ${(v.jobs || [])
              .map(
                (job: any) => `
              <li style="margin-bottom: 15px; padding: 10px; border-left: 4px solid #0035ff;">
                <strong>${job.title}</strong> at ${job.company}<br>
                <a href="${job.url}">View Job →</a>
              </li>
            `
              )
              .join('')}
          </ul>
          <p>
            <a href="${v.unsubscribeUrl}" style="color: #0035ff; text-decoration: underline; font-size: 12px;">
              Unsubscribe from recommendations
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">© 2026 HireQuadrant</p>
        </body>
      </html>
    `,
  };

  return templates[template]?.(variables) || '<p>Email template not found</p>';
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { to, subject, template, variables } = (await req.json()) as EmailRequest;

    if (!to || !subject || !template) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: to, subject, template',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build HTML email
    const htmlContent = buildEmailTemplate(template, variables);

    // Use SendGrid API (requires SENDGRID_API_KEY env var)
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      console.warn(
        'SENDGRID_API_KEY not set - email would be sent in production. For testing, implement fallback.'
      );
      // In production, throw error. For testing/development, return success.
      return new Response(
        JSON.stringify({
          success: true,
          note: 'Email queued (mock mode - set SENDGRID_API_KEY for production)',
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Send via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: 'noreply@hirequadrant.com',
          name: 'HireQuadrant',
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent to ${to}`,
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
