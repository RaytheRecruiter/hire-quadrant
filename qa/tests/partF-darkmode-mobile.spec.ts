import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/', '/jobs', '/companies', '/blog', '/help-center',
  '/about', '/contact', '/pricing', '/privacy', '/terms', '/compare',
];

test.describe('F.1 Dark mode coverage', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} renders cleanly in dark mode`, async ({ page }) => {
      await page.goto(path);
      const toggle = page.getByRole('button', { name: /dark mode|theme|toggle theme/i }).first();
      await toggle.click();
      await expect(page.locator('html')).toHaveAttribute('class', /dark/);
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      const m = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        expect(luminance, `${path} body bg luminance=${luminance}`).toBeLessThan(0.4);
      }
    });
  }
});

test.describe('F.2 Mobile rendering @smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // FINDING: hamburger button has no aria-label (src/components/Header.tsx:222–228).
  // Fall back to class+visible-on-mobile selector. Add aria-label="Open menu"
  // for a11y and easier testing.
  test('hamburger menu visible on mobile homepage', async ({ page }) => {
    await page.goto('/');
    const burger = page.locator('button.lg\\:hidden').first();
    await expect(burger).toBeVisible();
    await burger.click();
    await expect(page.getByRole('link', { name: /^jobs$/i }).first()).toBeVisible();
  });

  test('mobile jobs page renders', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});
