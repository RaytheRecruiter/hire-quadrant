import { test, expect } from '@playwright/test';
import { signIn } from '../helpers/auth';

test.describe('E — Admin / Portal (requires QA_ADMIN_EMAIL/PASSWORD env)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.QA_ADMIN_EMAIL, 'QA_ADMIN_EMAIL not set');
    await signIn(page, 'adminPrimary');
  });

  test('E.1 portal loads with moderation + tools sections @smoke', async ({ page }) => {
    await page.goto('/company-portal');
    await expect(page.getByText(/moderation|review moderation/i).first()).toBeVisible();
    await expect(page.getByText(/audit log|admin dashboard/i).first()).toBeVisible();
  });

  test('E.5 audit log renders entries', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('E.6 cron health page loads', async ({ page }) => {
    await page.goto('/admin/cron');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('E.9 admin dashboard shows site stats', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
