import { Page, expect } from '@playwright/test';
import { accounts, Persona } from './accounts';

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
