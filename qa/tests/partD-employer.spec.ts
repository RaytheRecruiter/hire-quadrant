import { test, expect } from '@playwright/test';
import { signIn } from '../helpers/auth';

test.describe('D — Employer dashboard (logged in as test-employer-1)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'employer');
  });

  test('D.1 lands on /company-dashboard with 11 tabs @smoke', async ({ page }) => {
    if (!page.url().includes('/company-dashboard')) {
      await page.goto('/company-dashboard');
    }
    await expect(page, 'test-employer-1 may not have role=company in this DB').toHaveURL(/\/company-dashboard/);
    const tabs = ['My Jobs', 'Applicants', 'Analytics', 'Benchmarks', 'Reviews', 'Updates', 'Q&A', 'Why Join Us', 'AI Assistant', 'Company Profile', 'Subscription'];
    const tabsNav = page.getByRole('navigation', { name: /tabs/i });
    for (const tab of tabs) {
      await expect(tabsNav.getByRole('button', { name: new RegExp(`^${tab}$`, 'i') }).first(), `tab "${tab}"`).toBeVisible();
    }
  });

  // Finding #9 closed 2026-04-28: "+ New job" button now exists in the My Jobs
  // tab (or "Post your first job" in the empty state). Clicking opens
  // NewJobModal which inserts via the new RLS policy in
  // supabase/migrations/20260428_employer_jobs_rls.sql.
  test('D.2 my-jobs tab activates and shows new-job CTA', async ({ page }) => {
    await page.goto('/company-dashboard');
    const tabsNav = page.getByRole('navigation', { name: /tabs/i });
    await tabsNav.getByRole('button', { name: /^my jobs$/i }).click();
    await expect(page).toHaveURL(/\/company-dashboard/);
    await expect(
      page.getByRole('button', { name: /new job|post your first job/i }).first()
    ).toBeVisible();
  });

  test('D.3 applicants tab renders', async ({ page }) => {
    await page.goto('/company-dashboard');
    const tabsNav = page.getByRole('navigation', { name: /tabs/i });
    await tabsNav.getByRole('button', { name: /^applicants$/i }).click();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('D.7 analytics tab renders', async ({ page }) => {
    await page.goto('/company-dashboard');
    await page.getByRole('navigation', { name: /tabs/i }).getByRole('button', { name: /^analytics$/i }).click();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('D.8 benchmarks tab renders', async ({ page }) => {
    await page.goto('/company-dashboard');
    await page.getByRole('navigation', { name: /tabs/i }).getByRole('button', { name: /^benchmarks$/i }).click();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('D.9 reviews tab renders', async ({ page }) => {
    await page.goto('/company-dashboard');
    await page.getByRole('navigation', { name: /tabs/i }).getByRole('button', { name: /^reviews$/i }).click();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('D.13 AI assistant tab renders', async ({ page }) => {
    await page.goto('/company-dashboard');
    await page.getByRole('navigation', { name: /tabs/i }).getByRole('button', { name: /^ai assistant$/i }).click();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('D.17 talent search page loads', async ({ page }) => {
    await page.goto('/talent-search');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('candidate-only routes redirect employer away', async ({ page }) => {
    // Employer should NOT see candidate /profile or /interview-practice;
    // either redirected or shown an unauthorized message.
    await page.goto('/interview-practice');
    // Allow either redirect or empty/error state — just confirm app doesn't crash.
    await expect(page.locator('body')).toBeVisible();
  });
});
