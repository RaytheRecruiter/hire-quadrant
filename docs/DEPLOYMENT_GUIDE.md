# HireQuadrant Deployment Guide

Complete checklist for deploying HireQuadrant to production.

## Prerequisites

- GitHub account with [RaytheRecruiter/hire-quadrant](https://github.com/RaytheRecruiter/hire-quadrant) access
- Supabase project created
- Netlify account connected to GitHub
- SendGrid account (for email)
- Stripe account (for payments)
- Sentry account (optional, for error tracking)

---

## Step 1: Supabase Setup (5 min)

### Create Database Tables

1. Go to Supabase Dashboard → SQL Editor
2. Copy migration file: `supabase/migrations/20260420_init_2fa_and_features.sql`
3. Paste into SQL Editor and click "Run"
4. Wait for tables to be created (~10s)

**Tables created:**
- ✅ user_2fa (2FA settings)
- ✅ user_preferences (notification settings)
- ✅ email_logs (track sent emails)
- ✅ application_status_history (audit trail)
- ✅ user_notifications (in-app inbox)
- ✅ job_alerts (saved searches)
- ✅ saved_jobs (bookmarks)
- ✅ job_views (analytics)
- ✅ application_ratings (feedback)

### Enable Email Extension (optional but recommended)

```sql
CREATE EXTENSION IF NOT EXISTS "pgmail" WITH SCHEMA pgmail;
```

---

## Step 2: Deploy Edge Functions (10 min)

### Install Supabase CLI

```bash
npm install -g supabase
```

### Deploy Functions

```bash
cd /path/to/hire-quadrant

# Login to Supabase
supabase login

# Deploy all functions
supabase functions deploy enable-2fa
supabase functions deploy verify-2fa-setup
supabase functions deploy send-email
supabase functions deploy handle-form-submission
supabase functions deploy stripe-webhook
supabase functions deploy health-check
supabase functions deploy search-jobs
```

**Functions deployed:**
- ✅ enable-2fa → `/functions/v1/enable-2fa`
- ✅ verify-2fa-setup → `/functions/v1/verify-2fa-setup`
- ✅ send-email → `/functions/v1/send-email`
- ✅ handle-form-submission → `/functions/v1/handle-form-submission`
- ✅ stripe-webhook → `/functions/v1/stripe-webhook`
- ✅ health-check → `/functions/v1/health-check`
- ✅ search-jobs → `/functions/v1/search-jobs`

---

## Step 3: Configure Environment Variables

### In Netlify Dashboard

1. Go to Site Settings → Build & Deploy → Environment
2. Add these variables:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://key@sentry.io/project
VITE_SENTRY_ENVIRONMENT=production
VITE_MAILCHIMP_ACTION_URL=https://hirequadrant.us10.list-manage.com/subscribe/post?u=...
VITE_FORMSPREE_ID=xxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
SENDGRID_API_KEY=SG.xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

3. Click "Redeploy site" for changes to take effect

---

## Step 4: Set Up Third-Party Services

### A. SendGrid (Email Sending)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for free (100 emails/day) or pay plan

2. **Generate API Key**
   - Dashboard → Settings → API Keys
   - Create new API key with "Mail Send" permission
   - Copy key (looks like `SG.xxxxx`)

3. **Verify Sender**
   - Settings → Sender Authentication
   - Click "Single Sender Verification"
   - Verify `noreply@hirequadrant.com`
   - (or use your actual email)

4. **Add to Environment**
   - Netlify → Environment variables
   - Add `SENDGRID_API_KEY=SG.xxxxx`

**Test Email Sending:**
```bash
curl -X POST https://[your-supabase-url]/functions/v1/send-email \
  -H "Authorization: Bearer [your-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "template": "application_confirmation",
    "variables": {
      "jobTitle": "Senior Engineer",
      "companyName": "Acme Corp",
      "trackingUrl": "https://hirequadrant.com/applications/123"
    }
  }'
```

### B. Stripe (Payments)

1. **Create Stripe Account**
   - Go to https://dashboard.stripe.com
   - Sign up for business account

2. **Get API Keys**
   - Developers → API Keys
   - Copy "Publishable key" (`pk_live_xxxxx`)
   - Copy "Secret key" (`sk_live_xxxxx`)

3. **Create Products & Prices**
   - Products → Add product
   - Create pricing tiers:
     - **Basic:** $29/month (3 job listings)
     - **Pro:** $99/month (20 job listings)
     - **Enterprise:** Contact sales

4. **Set Up Webhook**
   - Developers → Webhooks
   - Add endpoint: `https://hirequadrant.com/functions/v1/stripe-webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `charge.refunded`
   - Copy signing secret (`whsec_xxxxx`)

5. **Add to Environment**
   - Netlify → Environment variables
   - Add `VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx`
   - Add `STRIPE_SECRET_KEY=sk_live_xxxxx`
   - Add `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

**Test Webhook:**
```bash
stripe trigger payment_intent.succeeded \
  --api-key sk_live_xxxxx
```

### C. Sentry (Error Tracking) - Optional

1. **Create Sentry Account**
   - Go to https://sentry.io
   - Create organization and project
   - Select "React" as platform

2. **Get DSN**
   - Settings → Projects → Your Project
   - Copy DSN (looks like `https://key@sentry.io/project`)

3. **Add to Environment**
   - Netlify → Environment variables
   - Add `VITE_SENTRY_DSN=https://key@sentry.io/project`

### D. Google Analytics 4 - Optional

1. **Create GA4 Property**
   - Go to https://analytics.google.com
   - Create new property for "hirequadrant.com"
   - Create web data stream

2. **Get Measurement ID**
   - Admin → Properties → Data Streams → Select web stream
   - Copy Measurement ID (looks like `G-XXXXXXXXXX`)

3. **Add to Environment**
   - Netlify → Environment variables
   - Add `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`

### E. Mailchimp (Newsletter) - Optional

1. **Create Mailchimp Account**
   - Go to https://mailchimp.com
   - Create audience

2. **Generate Form URL**
   - Audience → Signup Forms → Embedded Forms
   - Copy "Form action URL" (from HTML embed code)
   - Looks like `https://hirequadrant.us10.list-manage.com/subscribe/post?u=...`

3. **Add to Environment**
   - Netlify → Environment variables
   - Add `VITE_MAILCHIMP_ACTION_URL=https://hirequadrant.us10.list-manage.com/subscribe/post?u=...`

---

## Step 5: Deploy to Netlify

### Connect GitHub Repo

1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select GitHub → Choose `hire-quadrant` repo
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click "Deploy site"

**Netlify will:**
- ✅ Install dependencies
- ✅ Run `npm run build`
- ✅ Deploy to CDN
- ✅ Set up auto-deploys on git push

### Enable HTTPS & Custom Domain

1. Netlify → Site Settings → Domain Management
2. Click "Add custom domain"
3. Enter `hirequadrant.com`
4. Netlify auto-generates SSL certificate

---

## Step 6: Run Migrations & Tests

### Apply Database Migrations

```bash
# Via Supabase CLI
supabase db push

# Or manually in SQL Editor
supabase.db_execute(migration_sql)
```

### Test All Integrations

```bash
# Test database
curl https://[supabase-url]/rest/v1/jobs?limit=1 \
  -H "Authorization: Bearer [anon-key]"

# Test health check
curl https://hirequadrant.com/functions/v1/health-check

# Test email function
curl -X POST https://hirequadrant.com/functions/v1/send-email \
  -H "Authorization: Bearer [user-token]" \
  -d {...}

# Test form submission
curl -X POST https://hirequadrant.com/functions/v1/handle-form-submission \
  -d '{
    "type": "contact",
    "email": "test@example.com",
    "subject": "Test",
    "message": "This is a test message"
  }'

# Test 2FA
curl -X POST https://hirequadrant.com/functions/v1/enable-2fa \
  -H "Authorization: Bearer [user-token]"
```

### Run Lighthouse Audit

```bash
# In Chrome DevTools
1. Open https://hirequadrant.com
2. F12 → Lighthouse tab
3. Select "PWA" category
4. Click "Analyze page load"
5. Target score: 90+
```

---

## Step 7: Set Up Monitoring

### Sentry Error Tracking

1. Go to https://sentry.io
2. Create organization
3. Check dashboard for errors in real-time
4. Set up alerts:
   - Sentry → Alerts → Create Alert Rule
   - Trigger on errors in production

### Uptime Monitoring

1. Go to https://uptimerobot.com
2. Create monitor:
   - **URL:** `https://hirequadrant.com/functions/v1/health-check`
   - **Interval:** Every 5 minutes
   - **Alert email:** your-email@example.com
3. Get SMS alerts if site goes down

### Google Analytics Dashboard

1. Go to https://analytics.google.com
2. Create custom dashboard:
   - Users (today vs last 7 days)
   - Sessions per day
   - Top pages
   - Conversion rate (form submissions)
3. Share dashboard with team

---

## Step 8: Final Verification Checklist

### Frontend
- [ ] Site loads on mobile, tablet, desktop
- [ ] Forms work (contact, newsletter, search)
- [ ] Links work (internal navigation)
- [ ] Images load and resize properly
- [ ] Dark mode toggles
- [ ] PWA installs on mobile
- [ ] Service worker caches pages
- [ ] OAuth buttons visible

### Backend
- [ ] Database tables created
- [ ] Edge Functions deployed
- [ ] Health check returns 200
- [ ] Email sending works (test SendGrid)
- [ ] Stripe webhook configured
- [ ] Error tracking active (Sentry)
- [ ] Google Analytics recording events
- [ ] Newsletter signup works (Mailchimp)

### Security
- [ ] HTTPS enabled
- [ ] CSP headers set
- [ ] HSTS header set
- [ ] Rate limiting configured
- [ ] API keys in environment variables
- [ ] No secrets in git history
- [ ] RLS policies active on user tables

### Performance
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse Performance score ≥ 80
- [ ] Page load < 3 seconds (3G)
- [ ] Core Web Vitals passing
- [ ] Images optimized (lazy loading)
- [ ] Code splitting working

---

## Troubleshooting

### 502 Bad Gateway
- Check Supabase Edge Functions status
- Verify environment variables set
- Check function logs: Supabase → Edge Functions → View Logs

### Email Not Sending
- Verify SENDGRID_API_KEY is correct
- Check SendGrid sender verification
- Check SendGrid dashboard for bounced emails
- Verify `to` email is valid

### Forms Not Submitting
- Check browser console for errors
- Verify `handle-form-submission` function deployed
- Check CORS headers in Edge Function
- Test with `curl` from terminal

### Stripe Webhook Not Firing
- Verify webhook URL is correct
- Check `stripe-webhook` function deployed
- Verify signing secret is correct
- Test webhook in Stripe dashboard: Developers → Webhooks → Send test event

### PWA Not Installing
- Check manifest.json is valid: webmanifest.org
- Verify icons exist in public/
- Ensure HTTPS enabled
- Test in Chrome DevTools: Application → Manifest

---

## Post-Deployment

### Monitor Key Metrics

**Daily:**
- Check Sentry for new errors
- Review user signups (GA4)
- Monitor form submissions (email logs)
- Check Stripe for failed payments

**Weekly:**
- Review analytics dashboard
- Check job posting trends
- Monitor 2FA adoption rate
- Review support tickets

**Monthly:**
- Analyze user retention
- Review Stripe MRR (Monthly Recurring Revenue)
- Plan feature updates
- Audit security logs

### Keep Services Updated

- Supabase: Check for database updates monthly
- Stripe: Monitor API version deprecations
- SendGrid: Monitor IP reputation score
- Sentry: Review performance insights

---

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Stripe API Docs:** https://stripe.com/docs
- **SendGrid Docs:** https://sendgrid.com/docs
- **Netlify Docs:** https://docs.netlify.com

For questions, check the main [SETUP.md](../SETUP.md) and [REBUILD.md](../REBUILD.md) files.
