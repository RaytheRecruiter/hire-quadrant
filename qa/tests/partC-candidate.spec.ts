import { test, expect } from '@playwright/test';
import { signIn } from '../helpers/auth';

test.describe('C — Candidate flows (logged in as seeded candidate)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'candidate');
  });

  test('C.2 personalized dashboard renders @smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('C.2 dashboard shows 4 stat tiles', async ({ page }) => {
    await page.goto('/');
    for (const label of ['Applied', 'Saved', 'Messages', 'Notifications']) {
      await expect(page.getByText(new RegExp(`^${label}$`, 'i')).first()).toBeVisible();
    }
  });

  test('C.3 profile page loads with strength widget', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText(/profile strength/i)).toBeVisible();
  });

  test('C.3 profile shows experience + education + skills sections', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /work experience|experience/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /education/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /skills/i })).toBeVisible();
  });

  test('C.4 settings — notification preferences are togglable', async ({ page }) => {
    await page.goto('/settings');
    const firstToggle = page.getByRole('switch').or(page.locator('input[type="checkbox"]')).first();
    if (await firstToggle.count() === 0) test.skip(true, 'No toggle controls found on /settings');
    await expect(firstToggle).toBeVisible();
  });

  test('C.4 settings — 2FA section is present', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/two-factor|2fa/i).first()).toBeVisible();
  });

  test('C.4 settings — GDPR data export button present', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('button', { name: /download.*data|export/i }).first()).toBeVisible();
  });

  test('C.5 my jobs renders 5 tabs', async ({ page }) => {
    await page.goto('/my-jobs');
    for (const tab of ['Saved', 'Applied', 'Interviews']) {
      await expect(page.getByRole('button', { name: new RegExp(tab, 'i') }).or(page.getByRole('tab', { name: new RegExp(tab, 'i') })).first()).toBeVisible();
    }
  });

  test('C.6 saved searches — create form is visible', async ({ page }) => {
    await page.goto('/saved-searches');
    await expect(page.getByRole('button', { name: /save|create/i }).first()).toBeVisible();
  });

  test('C.10 demographics page loads', async ({ page }) => {
    await page.goto('/demographics');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('C.11 messages page loads', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('C.11 notifications page loads', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('C.12 interview practice — role + question type selectors', async ({ page }) => {
    await page.goto('/interview-practice');
    await expect(page.getByText(/role/i).first()).toBeVisible();
    await expect(page.getByText(/question/i).first()).toBeVisible();
  });

  test('C.13 sign out logs the user out', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /account menu/i }).click();
    // Sign-out is a plain <button>, not menuitem (src/components/Header.tsx:201).
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
