import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/auth';

// Mirrors HireQuadrant-QA-Walkthrough.docx Part B: Anonymous / Public.
// Run on chromium-desktop only by default; use --project=mobile-chrome for Part F.2.

test.describe('B.1 Homepage and navigation', () => {
  test('homepage loads with hero headline @smoke', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: /work for you, not the algorithm/i })).toBeVisible();
  });

  test('top nav links present', async ({ page }) => {
    await page.goto('/');
    // Real link names (verified against live DOM): Jobs, Career Paths,
    // Companies, Blog, Pricing, Sign in, Sign up. "Search" is a button, not a link.
    for (const label of ['Jobs', 'Career Paths', 'Companies', 'Blog', 'Pricing']) {
      await expect(page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') }).first()).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open search/i }).first()).toBeVisible();
  });

  test('logo returns home', async ({ page }) => {
    await page.goto('/jobs');
    await page.getByRole('link', { name: /hire ?quadrant/i }).first().click();
    await expect(page).toHaveURL(/\/$|\/#/);
  });

  test('footer has legal links', async ({ page }) => {
    await page.goto('/');
    for (const label of ['About', 'Contact', 'Privacy', 'Terms']) {
      await expect(page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })).toBeVisible();
    }
  });

  test('dark mode toggle persists across reload', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /dark mode|theme|toggle theme/i }).first();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('class', /dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('class', /dark/);
  });
});

test.describe('B.3 Global search (Cmd+K)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await dismissCookieBanner(page);
  });

  test('Cmd+K opens search modal', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.getByRole('dialog', { name: /global search/i })).toBeVisible();
  });

  test('Escape closes search modal', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    const searchModal = page.getByRole('dialog', { name: /global search/i });
    await expect(searchModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible({ timeout: 5_000 });
  });

  test('search button in header opens same modal', async ({ page }) => {
    await page.getByRole('button', { name: /open search/i }).first().click();
    await expect(page.getByRole('dialog', { name: /global search/i })).toBeVisible();
  });
});

test.describe('B.4 Browse jobs', () => {
  test('jobs list page loads @smoke', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page).toHaveURL(/\/jobs/);
    await expect(page.getByRole('heading', { name: /browse jobs/i })).toBeVisible();
  });

  // Finding #1 closed 2026-04-28: BrowseJobs selected min_salary/max_salary
  // columns that hadn't been added in prod (migration 20260416000001 line 152
  // never ran). `alter table jobs add column if not exists min_salary int;`
  // (and max_salary) restored the page. 184 jobs now render.
  test('jobs list shows at least one job card', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('a[href^="/jobs/"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('keyword filter narrows list', async ({ page }) => {
    await page.goto('/jobs');
    const keyword = page.getByPlaceholder(/keyword|title|search jobs/i).first();
    await keyword.fill('manager');
    await keyword.press('Enter');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/manager|q=/i);
  });

  // Finding #1 was blocking this — now unblocked.
  test('job detail apply prompts login when logged out', async ({ page }) => {
    await page.goto('/jobs');
    await page.locator('a[href^="/jobs/"]').first().click();
    await expect(page).toHaveURL(/\/jobs\/.+/);
    // Real button label is "Apply now" (or "Apply for this role" further down).
    await page.getByRole('button', { name: /apply now|apply for this role/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('B.5 Companies directory', () => {
  test('companies index loads @smoke', async ({ page }) => {
    await page.goto('/companies');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('B.6 Compare', () => {
  test('compare page renders search input @smoke', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByPlaceholder(/company|search/i).first()).toBeVisible();
  });
});

test.describe('B.7 Programmatic SEO pages', () => {
  const seoPaths = [
    '/companies/industry/technology',
    '/jobs/location/new-york-ny',
    '/salaries/software-engineer',
    '/best/technology',
    '/guide/technology',
    '/interview-prep/software-engineer',
    '/career/from/data-analyst/to/product-manager',
  ];
  for (const path of seoPaths) {
    test(`${path} renders 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path} returned ${res?.status()}`).toBeLessThan(400);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });
  }
});

test.describe('B.8 Blog', () => {
  test('blog index loads @smoke', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('blog filter pills work', async ({ page }) => {
    await page.goto('/blog');
    const pill = page.getByRole('button', { name: /^career$/i }).first();
    if (await pill.isVisible().catch(() => false)) await pill.click();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('B.9 Help / Support', () => {
  test('help center loads @smoke', async ({ page }) => {
    await page.goto('/help-center');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('support page loads', async ({ page }) => {
    const res = await page.goto('/support');
    expect(res?.status()).toBeLessThan(400);
  });
});

test.describe('B.10 Auth pages (logged out)', () => {
  test('/login renders email + password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('/register renders name + email + password', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  // FINDING #8: QA doc says /reset-password should show an email input to
  // request a reset link. In production the page only shows "New Password" /
  // "Confirm Password" — the request-email UI doesn't exist (Login's "Forgot?"
  // link routes here directly). requestPasswordReset() exists in
  // src/utils/passwordReset.ts but isn't wired to a UI page.
  test.fail('/reset-password has email input (request flow)', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByLabel(/^email/i)).toBeVisible();
  });

  // FINDING #10: <label>New Password</label> and <label>Confirm Password</label>
  // exist in src/pages/PasswordReset.tsx but lack `htmlFor` linking them to the
  // inputs. Screen readers can't associate them; getByLabel() can't find them.
  // Tested via input[type=password] count instead.
  test('/reset-password renders two password fields (confirm flow)', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    // .first() — "New Password" and the heading "Create New Password" both
    // match (strict mode would otherwise reject the multi-element match).
    await expect(page.getByText(/new password/i).first()).toBeVisible();
    await expect(page.getByText(/confirm password/i).first()).toBeVisible();
  });
});

test.describe('B.11 Static pages @smoke', () => {
  const staticPaths = ['/privacy', '/terms', '/content-policy', '/cookies', '/about', '/contact', '/pricing'];
  for (const path of staticPaths) {
    test(`${path} returns 200 with content`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `${path}`).toBeLessThan(400);
      const body = await page.locator('body').textContent();
      expect(body?.length ?? 0).toBeGreaterThan(200);
    });
  }
});

test.describe('B.12 Anonymous edge cases @smoke', () => {
  test('404 page for unknown route', async ({ page }) => {
    await page.goto('/this-does-not-exist-12345');
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });

  test('/profile redirects to /login?returnTo=/profile', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login.*returnTo=.*profile/);
  });

  test('/company-dashboard redirects to /login?returnTo=/company-dashboard', async ({ page }) => {
    await page.goto('/company-dashboard');
    await expect(page).toHaveURL(/\/login.*returnTo=.*company-dashboard/);
  });

  test('/admin/audit redirects to /login with returnTo', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/\/login.*returnTo/);
  });
});
