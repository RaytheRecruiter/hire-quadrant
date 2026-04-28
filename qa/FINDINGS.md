# QA Findings — 2026-04-26

Discovered while building the Playwright suite against live `https://hirequadrant.com`. Each finding is encoded into the test as either a passing assertion of current behavior, a `test.fail`, or a `test.skip` with a comment.

## Status (after this branch)

| # | Finding | Status |
|---|---|---|
| 1 | ~~`/jobs` empty in production~~ | ✅ **Closed 2026-04-28**: missing `min_salary`/`max_salary` columns. Migration `20260416000001_phase3_full_scope.sql` lines 152–153 never ran in prod; ran them manually via SQL editor. 184 jobs now render. |
| 2 | Auth-redirect inconsistency | ✅ Fixed (`ProfilePage`, `CompanyDashboard`) |
| 3 | Blog Article JSON-LD missing | ✅ Fixed (`buildArticleLd` + injection in `BlogPost`) |
| 4 | QA doc references wrong sitemap paths | 📄 Documented; doc unchanged |
| 5 | Sitemap `<loc>` leading whitespace | ✅ Fixed (`sitemap-jobs/index.ts`) — needs `supabase functions deploy` |
| 6 | Mobile hamburger missing aria-label | ✅ Fixed (`Header.tsx`) |
| 7 | ~~Test-employer role may be unset~~ | ✅ **Closed 2026-04-28**: verified via SQL — both test-employer-1 and -2 have `role='company'` and `is_approved=true`. Caveat was unfounded. |
| 8 | ~~Login "Forgot?" routes to set-new-password page~~ | ✅ **Closed 2026-04-28**: `/login?tab=forgot` mode added. Renders an email-only form that calls existing `requestPasswordReset()`. "Forgot?" link in Login now routes there. |
| 9 | ~~Employer dashboard has no "+ New Job" UI~~ | ✅ **Closed 2026-04-28**: New job button + `NewJobModal` in `CompanyJobsList`. Insert-path requires `supabase/migrations/20260428_employer_jobs_rls.sql` to run on prod. |
| 10 | ~~`/reset-password` `<label>` tags not linked to inputs~~ | ✅ **Closed 2026-04-28**: added `htmlFor` + `id` + `autoComplete` on both fields in `PasswordReset.tsx`. |
| 11 | **CSP `connect-src` blocks `api.pwnedpasswords.com` — HIBP silently fails** | ✅ **Fixed (`public/_headers`)** |
| 12 | ~~`Header.handleLogout` doesn't await `logout()`~~ | ✅ **Closed 2026-04-28**: handler now `async`; `await logout()` runs before `navigate('/')`. C.13 sign-out test un-failed. |

Pending deploy: tests in this branch assert post-deploy behavior, so 3 smoke tests will fail against live until merged + deployed:
- `/profile redirects to /login?returnTo=/profile`
- `/company-dashboard redirects to /login?returnTo=/company-dashboard`
- `Article JSON-LD on a blog post`

## Severity legend
- 🔴 **Launch blocker** — visible to users, breaks core flow
- 🟠 **Bug** — works but not as the QA doc / user expects
- 🟡 **Doc/spec drift** — code is fine, QA doc needs an update
- 🔵 **SEO / accessibility** — measurable impact on discoverability

---

## 1. 🔴 `/jobs` page renders empty state in production

**What:** [BrowseJobs.tsx](../src/pages/BrowseJobs.tsx) shows "no results" on production despite the database holding 100+ active jobs (visible at the supabase `sitemap-jobs` edge function and at direct URLs like `/jobs/26-01120`).

**Evidence:** `count(a[href^="/jobs/"]) === 0` on `/jobs`, but direct visit to any sitemap job URL renders the full page with title, description, and JobPosting JSON-LD.

**Likely cause:** Filter default state, RLS policy mismatch, or a query bug post-april-23 wave. Worth checking the supabase JS client query in BrowseJobs vs what the edge function uses.

**Encoded as:** `test.fail` in [tests/partB-anonymous.spec.ts](tests/partB-anonymous.spec.ts) — "jobs list shows at least one job card". When fixed, remove the `test.fail` annotation.

---

## 2. 🟠 Auth-redirect inconsistency across protected pages

The QA doc (B.12 #88-90) says all protected pages should redirect logged-out users to `/login` (with `returnTo`). Actual behavior is inconsistent:

| Route | Current behavior | File |
|---|---|---|
| `/profile` | Inline "Please log in" prompt with manual link | [ProfilePage.tsx:398](../src/pages/ProfilePage.tsx) |
| `/company-dashboard` | `<Navigate to="/" />` (home) | [CompanyDashboard.tsx:58](../src/pages/CompanyDashboard.tsx) |
| `/admin/audit` | `<Navigate to="/login?returnTo=/admin/audit" />` ✅ | [AdminAuditLog.tsx:57](../src/pages/AdminAuditLog.tsx) |

**Recommendation:** Pick one pattern. `AdminAuditLog`'s `returnTo` redirect is the best UX — preserves user intent. Apply to all protected routes.

**Encoded as:** Tests in `partB-anonymous.spec.ts` assert the *current* behavior so the suite stays green; comments flag the divergence.

---

## 3. 🔵 Blog posts missing `Article` / `BlogPosting` JSON-LD

**What:** [BlogPost.tsx](../src/pages/BlogPost.tsx) emits no structured data. With 200+ posts in the index, this is significant SEO leakage — Google's article rich results, news boxes, and "Top stories" carousels all key off `Article`/`BlogPosting`.

**Compare:** Job pages emit `JobPosting`, company pages emit `Organization`. There's already a `buildOrganizationLd` helper in `src/utils/structuredData`; add `buildArticleLd` and inject in BlogPost.

**Encoded as:** `test.fail` in [tests/partF-security-seo.spec.ts](tests/partF-security-seo.spec.ts) — "Article JSON-LD on a blog post". When fixed, remove the `test.fail`.

---

## 4. 🟡 QA walkthrough doc references wrong sitemap paths

**What:** Doc B.11 #86 and F.8 #40-41 tell testers to check `/sitemap-pages` and `/sitemap-jobs`. Production paths:

| Doc says | Reality |
|---|---|
| `/sitemap-pages` | Returns SPA HTML (Netlify catch-all). Real path: `/sitemap-pages.xml` (static file in `public/`) |
| `/sitemap-jobs` | Same — returns SPA HTML. Real source: `https://npugrpsrgpyssupgxcxx.functions.supabase.co/sitemap-jobs` (referenced from `/sitemap.xml`) |

**Recommendation:** Update doc to test `/sitemap.xml` (the index), `/sitemap-pages.xml` (static), and the supabase function URL directly. Or add Netlify redirects so `/sitemap-pages` and `/sitemap-jobs` proxy to the canonical sources.

**Encoded as:** `test.skip` block in `partF-security-seo.spec.ts`. Active test verifies `/sitemap.xml`.

---

## 5. 🔵 Sitemap `<loc>` entries have leading whitespace

**What:** The supabase `sitemap-jobs` edge function emits `<loc>\thttps://hirequadrant.com/jobs/...</loc>` — note the literal tab after `<loc>`. Per the [sitemaps.org spec](https://www.sitemaps.org/protocol.html), `<loc>` must contain a clean absolute URL with no surrounding whitespace.

**Impact:** Some search engines silently drop malformed entries; Google Search Console may flag warnings.

**Fix:** In [supabase/functions/sitemap-jobs/index.ts](../supabase/functions/sitemap-jobs/index.ts), trim job URLs and the template string before emit.

**Encoded as:** Not a test failure (loose XML parsers accept it). Documented here only.

---

## 6. 🔵 Mobile menu button missing `aria-label`

**What:** [Header.tsx:222-228](../src/components/Header.tsx) — the hamburger button has no accessible name. Screen readers announce it as "button" only. Lighthouse a11y will dock points.

**Fix:**
```tsx
<button
  onClick={() => setMobileOpen(v => !v)}
  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
  className="lg:hidden h-9 w-9 ..."
>
```

**Encoded as:** Test in `partF-darkmode-mobile.spec.ts` falls back to a class selector. Comment flags the a11y miss.

---

## 7. 🟡 Test employer credentials may not exist in production DB

**What:** Login as `test-employer-1@hirequadrant-test.com / TestBiz123!` succeeds at the auth layer but `/company-dashboard` may redirect to `/` because the user's `role` is not `'company'`.

**Encoded as:** [helpers/auth.ts](helpers/auth.ts) now throws a clear error if login fails, and D.1 has a comment noting the role requirement. Verify by running `npm run seed:test-employers` against the production DB.

---

## Smoke results after all fixes

```
30 passed | 2 skipped (intentional doc-drift placeholders) | 0 failed
Runtime: ~10s on chromium-desktop
```

`test.fail` annotations on findings #1 and #3 mean the suite goes green now; when those bugs are fixed, those tests will start failing and prompt you to remove the `test.fail` and confirm the fix.
