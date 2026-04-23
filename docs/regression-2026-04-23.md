# HireQuadrant Regression Pass — 2026-04-23

Context: reports of general slowness + whitepage after Phase 3 (AI match scores) shipped.
Run through each flow below with Chrome DevTools (Console + Network + Performance) open.

**Legend**: ✅ ok · ⚠️ slow or minor issue · ❌ broken

## Baseline
- Site origin: https://hirequadrant.com
- Commit tested: _fill in `git rev-parse HEAD`_
- Browser: _Chrome version_
- Connection: _Fast 3G / No throttle_

## B.1 — Anonymous (logged out)

| Flow | Result | TTI (ms) | Console errors | Notes |
|---|---|---|---|---|
| `/` home | | | | |
| `/jobs` listing (scroll 20+ cards) | | | | Expect: zero `job_match_scores` requests |
| `/job/[slug]` detail | | | | |
| `/login` render | | | | |
| `/signup` render | | | | |
| `/companies` listing | | | | |
| `/pricing` render | | | | |

## B.2 — Candidate (logged in)

| Flow | Result | TTI (ms) | Console errors | Notes |
|---|---|---|---|---|
| `/` with ProfileNudge banner | | | | Expect: 1 `candidates` query, not N |
| `/jobs` listing | | | | Expect: 1 bulk `job_match_scores` query, per-card only on miss |
| Match pill renders on cards | | | | |
| `/job/[slug]` detail | | | | |
| Save a job | | | | |
| One-click apply | | | | |
| Apply with screening questions | | | | |
| `/profile` edit + save | | | | Banner hides after save |
| Upload resume | | | | Banner updates |
| `/saved-jobs` | | | | |
| `/applications` | | | | |
| `/settings` | | | | |
| Back/forward navigation | | | | No query re-fire per step |

## B.3 — Employer (company account)

| Flow | Result | TTI (ms) | Console errors | Notes |
|---|---|---|---|---|
| `/employer/dashboard` | | | | |
| Post a new job | | | | |
| View applicants | | | | |
| Stripe checkout (test card) | | | | |

## B.4 — Admin

| Flow | Result | TTI (ms) | Console errors | Notes |
|---|---|---|---|---|
| `/admin` | | | | |

## B.5 — Cross-cutting

| Check | Result | Notes |
|---|---|---|
| Dark mode toggle | | |
| Mobile viewport (jobs list) | | |
| Mobile filters sheet | | |
| 401/403 redirect (logged-out on gated page) | | |
| Unknown route shows 404 page | | |
| React ErrorBoundary catches throws | | |

## Open issues to follow up
- _Paste observed ❌ / ⚠️ items here with one-line repro steps._
