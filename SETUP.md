# HireQuadrant Setup Guide

## Quick Start

1. **Clone and install:**
   ```bash
   npm install
   cp .env.example .env
   ```

2. **Fill in `.env` with your credentials** (see below)

3. **Run dev server:**
   ```bash
   npm run dev
   ```

4. **Deploy to Netlify:**
   - Connect repo to Netlify
   - Set environment variables in Netlify dashboard
   - Auto-deploys on push to main

---

## Integration Setup

### 1. Supabase (Database + Auth)
- URL: https://supabase.com
- Create project → get VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Database schema auto-created on first deploy (Edge Function: `supabase/functions/init-db`)

### 2. Google Analytics 4
- Setup: https://analytics.google.com
- Create property → get VITE_GA4_MEASUREMENT_ID (starts with `G-`)
- Tracks: page views, user engagement, job applications

### 3. Sentry Error Tracking (FREE TIER)
- Setup: https://sentry.io (free plan: 5,000 errors/month)
- Create project → get VITE_SENTRY_DSN
- Captures: JavaScript errors, API failures, critical issues
- Dashboard: Reports real-time errors to team

### 4. Mailchimp Newsletter
- Setup: https://mailchimp.com
- Create audience → Create form → Copy **form action URL**
- Paste into VITE_MAILCHIMP_ACTION_URL
- Users can subscribe on home page

### 5. Formspree Contact Form (FREE TIER)
- Setup: https://formspree.io
- Create form → get form ID (looks like `f/xxxxxx`)
- Paste as VITE_FORMSPREE_ID
- Contact form auto-emails team + user

### 6. OAuth (Optional - Phase 2)
**Google:**
- https://console.cloud.google.com → Create project → OAuth 2.0 credentials
- Authorized redirect: `https://yourdomain.com/auth/callback`
- Get VITE_GOOGLE_OAUTH_CLIENT_ID

**GitHub:**
- https://github.com/settings/developers → OAuth Apps → New OAuth App
- Authorization callback: `https://yourdomain.com/auth/github/callback`
- Get VITE_GITHUB_OAUTH_CLIENT_ID

**LinkedIn:**
- https://www.linkedin.com/developers/apps → Create app
- Authorized redirect: `https://yourdomain.com/auth/linkedin/callback`
- Get VITE_LINKEDIN_OAUTH_CLIENT_ID

### 7. Stripe Subscriptions (Optional - Phase 2)
- https://dashboard.stripe.com → Create account → Get VITE_STRIPE_PUBLIC_KEY
- Setup product plans for "Basic", "Pro", "Enterprise"
- Wire into pricing page + checkout

---

## Email Notifications (Phase 2)

### SendGrid
- https://sendgrid.com (free: 100 emails/day)
- Create API key → add to SENDGRID_API_KEY
- Use for: job application confirmations, status updates, password resets

### Postmark
- https://postmark.com (free: 100 emails/month)
- Alternative to SendGrid with better deliverability

---

## Live Chat Widget (Phase 2)

### Intercom
- https://intercom.com → Create account
- Copy embed code → add to public/index.html
- Costs: ~$40/mo for chat + help desk

### Drift
- https://drift.com → Similar setup, ~$50/mo

---

## Deployment

### Netlify (Recommended)
- Connect repo → https://app.netlify.com
- Set all env vars in **Site settings → Build & deploy → Environment**
- Auto-deploys on `git push origin main`
- Free tier: 100GB bandwidth/month

### Vercel
- Alternative: https://vercel.com
- Same setup process

---

## Monitoring & Maintenance

- **Sentry Dashboard:** Monitor errors in real-time
- **Google Analytics:** Weekly traffic reports
- **Supabase Dashboard:** Monitor database usage
- **Netlify Dashboard:** Check deploy status, logs

---

## Testing

```bash
# Test forms locally
npm run dev
# Visit http://localhost:5173
# Try: Contact form, Newsletter signup, Chat

# Run type check
npm run build

# Deploy to staging
git push origin main
```

---

## Support

- Sentry errors → Fix in code, push, redeploy
- Form issues → Check .env, verify API keys in service dashboards
- Database issues → Check Supabase RLS policies, Edge Functions logs
