import { APIResponse } from '@playwright/test';

export const REQUIRED_SECURITY_HEADERS = [
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'content-security-policy',
] as const;

export function missingHeaders(res: APIResponse): string[] {
  const headers = res.headers();
  return REQUIRED_SECURITY_HEADERS.filter(h => !headers[h]);
}
