import { authenticator } from 'otplib';
import { Page } from '@playwright/test';

export async function extractTotpSecret(page: Page): Promise<string> {
  const secretLocator = page.getByText(/[A-Z2-7]{16,}/).first();
  const text = await secretLocator.textContent();
  if (!text) throw new Error('TOTP secret not visible on page');
  const match = text.match(/[A-Z2-7]{16,}/);
  if (!match) throw new Error(`Could not parse TOTP secret from: ${text}`);
  return match[0];
}

export function generateTotp(secret: string): string {
  return authenticator.generate(secret);
}
