import { Page, expect } from '@playwright/test';
import { accounts, Persona } from './accounts';

/**
 * Dismiss the cookie consent banner if present. The banner is a focus-trapping
 * dialog that swallows keyboard events (Cmd+K, Esc) intended for the app.
 * Most tests should call this right after the first goto.
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: /^necessary only$/i })
    .or(page.getByRole('button', { name: /^accept all$/i }));
  if (await accept.first().isVisible().catch(() => false)) {
    await accept.first().click();
  }
}

export async function signIn(page: Page, persona: Persona): Promise<void> {
  const { email, password } = accounts[persona];
  if (!email || !password) {
    throw new Error(`Missing credentials for persona "${persona}". Set QA_ADMIN_EMAIL/QA_ADMIN_PASSWORD env vars.`);
  }
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  // Wait for either a successful redirect off /login or an error toast.
  await Promise.race([
    expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 }),
    expect(page.getByText(/invalid|incorrect|wrong|not found/i)).toBeVisible({ timeout: 15_000 }),
  ]);
  if (page.url().includes('/login')) {
    const errText = await page.getByText(/invalid|incorrect|wrong|not found/i).first().textContent().catch(() => '');
    throw new Error(`Sign-in for "${persona}" (${email}) failed: ${errText ?? 'unknown error'}`);
  }
}

export async function signOut(page: Page): Promise<void> {
  const avatar = page.getByRole('button', { name: /account|profile|avatar|user menu/i }).first();
  if (await avatar.isVisible().catch(() => false)) {
    await avatar.click();
    await page.getByRole('menuitem', { name: /sign out|log out/i }).click();
  }
}
