// HaveIBeenPwned password breach check using k-anonymity.
// No API key or account required. Sends only the first 5 chars of the
// SHA-1 prefix; full hash is never transmitted.

async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export interface BreachResult {
  breached: boolean;
  count: number;
}

export async function checkPasswordBreach(password: string): Promise<BreachResult> {
  if (!password || password.length < 6) return { breached: false, count: 0 };
  const digest = await sha1Hex(password);
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return { breached: false, count: 0 };
    const body = await res.text();
    for (const line of body.split(/\r?\n/)) {
      const [rest, count] = line.split(':');
      if (rest?.trim().toUpperCase() === suffix) {
        const n = parseInt(count?.trim() ?? '0', 10);
        return { breached: n > 0, count: n };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0 };
  }
}
