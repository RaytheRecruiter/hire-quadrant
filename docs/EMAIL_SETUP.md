# Email Notifications Setup Guide

This guide explains how to set up email notifications for job applications, status updates, and passwordresets using SendGrid or Mailgun.

## Architecture

Email notifications are triggered from:
- Application submissions → confirmation email
- Status updates → candidate notifications
- Password resets → reset link emails
- Weekly digests → job recommendations

The client-side calls `/api/email/send` endpoint which needs to be implemented in your backend.

## Option 1: SendGrid (Recommended)

### 1. Sign Up
- Go to https://sendgrid.com
- Create free account (100 emails/day) or paid ($20/mo for more)

### 2. Get API Key
- Dashboard → Settings → API Keys → Create API Key
- Copy and save securely

### 3. Verify Sender Email
- Settings → Sender Authentication → Single Sender Verification
- Verify your company email (e.g., noreply@hirequadrant.com)

### 4. Backend Implementation

Create `/api/email/send` endpoint (example in Node.js + Express):

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/email/send', async (req, res) => {
  const { to, subject, template, variables } = req.body;

  // Build email template based on template name
  const emailBody = buildEmailTemplate(template, variables);

  try {
    await sgMail.send({
      to,
      from: 'noreply@hirequadrant.com',
      subject,
      html: emailBody,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
```

### 5. Email Templates

Create HTML email templates for each event type:

**Application Confirmation:**
```html
<h1>Application Received!</h1>
<p>We received your application for <strong>{jobTitle}</strong> at {companyName}.</p>
<p>Track your application status: <a href="{trackingUrl}">View Details</a></p>
<p>We'll keep you updated every step of the way.</p>
```

**Status Update:**
```html
<h1>{statusLabel}</h1>
<p>Great news! Your application for <strong>{jobTitle}</strong> is moving forward.</p>
<p>{message}</p>
<p><a href="{dashboardUrl}">View All Applications</a></p>
```

**Password Reset:**
```html
<p>Click the link below to reset your password:</p>
<p><a href="{resetUrl}">Reset Password</a></p>
<p>This link expires in {expiresInHours} hours.</p>
```

## Option 2: Mailgun

### 1. Sign Up
- https://mailgun.com (free tier: 5,000 emails/month)

### 2. Get Credentials
- Dashboard → API Keys → Domain → Copy API Key and Domain

### 3. Verify Domain
- Add MX records to your domain DNS
- Mailgun guides through verification

### 4. Backend Implementation

```javascript
const mailgun = require('mailgun.js');
const FormData = require('form-data');

const client = new mailgun.default({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});
const mg = client.domains.domain(process.env.MAILGUN_DOMAIN);

app.post('/api/email/send', async (req, res) => {
  const { to, subject, template, variables } = req.body;
  const emailBody = buildEmailTemplate(template, variables);

  try {
    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `HireQuadrant <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      html: emailBody,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Mailgun error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
```

## Option 3: Postmark

### 1. Sign Up
- https://postmark.com (free tier: 100 emails/month)

### 2. Get Server Token
- Account Settings → Servers → Copy Server Token

### 3. Backend Implementation

```javascript
const client = require('postmark');
const serverToken = process.env.POSTMARK_SERVER_TOKEN;
const postmark = new client.ServerClient(serverToken);

app.post('/api/email/send', async (req, res) => {
  const { to, subject, template, variables } = req.body;
  const emailBody = buildEmailTemplate(template, variables);

  try {
    await postmark.send({
      From: 'noreply@hirequadrant.com',
      To: to,
      Subject: subject,
      HtmlBody: emailBody,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Postmark error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
```

## Environment Variables

Add to your `.env` (backend):
```
SENDGRID_API_KEY=SG.xxxxx
# OR
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=mg.hirequadrant.com
# OR
POSTMARK_SERVER_TOKEN=xxxxx
```

## Testing Email Delivery

### SendGrid
- Dashboard → Email Activity → Monitor sent emails
- View bounces, clicks, opens

### Mailgun
- Dashboard → Logs → See all email events

### Postmark
- Account → Activity → Email activity stream

## Unsubscribe & Compliance

Add unsubscribe link to all marketing emails (CAN-SPAM requirement):
```html
<p><a href="{unsubscribeUrl}">Unsubscribe from job recommendations</a></p>
```

## Troubleshooting

**Emails not sending:**
- Check API key is correct
- Verify sender email is authenticated
- Check spam folder
- Review email service logs

**High bounce rate:**
- Verify email addresses before sending
- Check for typos in email format
- Implement double opt-in for newsletters

**Low deliverability:**
- Add SPF, DKIM, DMARC records to domain
- Check authentication in email service dashboard
- Monitor reputation score

## Next Steps

1. Choose email service (SendGrid recommended)
2. Create API key and authenticate domain
3. Implement `/api/email/send` backend endpoint
4. Create HTML email templates
5. Test with your own email first
6. Deploy to production
