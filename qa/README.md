# HireQuadrant QA — Playwright suite

Automates the parts of `docs/HireQuadrant-QA-Walkthrough.docx` that don't need a human (visual judgment, real phone, email inbox).

## Coverage map

| Walkthrough section | Automated | File |
|---|---|---|
| Part B — Anonymous / Public | Yes | `tests/partB-anonymous.spec.ts` |
| Part C — Candidate flows | Smoke (login + page renders) | `tests/partC-candidate.spec.ts` |
| Part D — Employer dashboard | Smoke (login + tab list) | `tests/partD-employer.spec.ts` |
| Part E — Admin / Portal | Smoke (requires admin creds) | `tests/partE-admin.spec.ts` |
| Part F.1 dark mode | Yes (luminance check) | `tests/partF-darkmode-mobile.spec.ts` |
| Part F.2 mobile | Yes (viewport emulation) | `tests/partF-darkmode-mobile.spec.ts` |
| Part F.3 Lighthouse | Yes | `lighthouse-runner.mjs` |
| Part F.5 security headers | Yes | `tests/partF-security-seo.spec.ts` |
| Part F.6 anti-spam (HIBP, honeypot, mismatch) | Yes | `tests/partF-security-seo.spec.ts` |
| Part F.8 sitemap + JSON-LD | Yes | `tests/partF-security-seo.spec.ts` |
| Part F.10 cross-browser | Yes (chromium/firefox/webkit projects) | (any spec) |
| Part F.11 accessibility | Partial (Lighthouse a11y) | `lighthouse-runner.mjs` |

**Not covered (human only):** email verification clicks, real phone (F.10 #49–50), Supabase SQL (Part G), launch confirmations (Part H), drag-and-drop Kanban verification (D.3 #12 — automatable, not yet written), 2FA QR scan (helper exists at `helpers/totp.ts`, integrate when needed).

## One-time setup

```bash
cd qa
npm install
npx playwright install --with-deps chromium firefox webkit
```

## Environment variables

Set these before running tests that need login. Add to `.env.local` or export in your shell:

```bash
export QA_BASE_URL="https://hirequadrant.com"   # default, override for staging
export QA_ADMIN_EMAIL="rafael@..."              # required for Part E
export QA_ADMIN_PASSWORD="..."                  # required for Part E
```

Other accounts are hardcoded in `helpers/accounts.ts` (test-employer-1, seed-reviewer-1, etc.).

## Run

```bash
npm test                  # full suite, all browsers
npm run test:smoke        # only @smoke tests (~30s)
npm run test:b            # Part B only
npm run test:f            # Part F only
npm run test:headed       # watch it run
npm run ui                # Playwright UI mode
npm run lighthouse        # F.3 desktop + mobile audit
npm run report            # open HTML report after run
```

## Expected first-run failures

Several tests use guessed selectors (button names, form labels). When a test fails:

1. Open `playwright-report/index.html` — look at the trace.
2. Update the locator to match actual DOM (`getByRole` first, `getByLabel` second, `data-testid` last resort).
3. Re-run.

The selectors most likely to need adjustment:
- Dark mode toggle button name (currently `/dark mode|theme|toggle theme/i`)
- Avatar / user menu button name
- "Apply" button on job detail
- Filter sidebar inputs on `/jobs`

## Adding tests

Follow the playwright-pro golden rules:
- `getByRole()` over CSS/XPath
- Never `page.waitForTimeout()` — use web-first assertions
- Tag fast tests with `@smoke`
- One behavior per test

## Output artifacts

- `playwright-report/` — HTML report
- `results.json` — JSON results for CI parsing
- `lighthouse-results.json` — Lighthouse scores
- `test-results/` — traces, screenshots, video (failures only)
