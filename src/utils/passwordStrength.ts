// Lightweight password strength scorer (0-4) + label + color.
// Intentionally zero-dependency — we don't want to ship zxcvbn (~500 kB).

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string; // Tailwind class for the bar fill
  hints: string[];
}

export function scorePassword(pw: string): Strength {
  const hints: string[] = [];
  if (!pw) return { score: 0, label: '', color: 'bg-gray-200', hints: [] };

  let score = 0;
  if (pw.length >= 8) score++; else hints.push('Use at least 8 characters');
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  else hints.push('Mix upper and lower case');
  if (/\d/.test(pw)) score++;
  else hints.push('Add a number');
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  else if (pw.length < 14) hints.push('Add a symbol');

  // Common-password penalty
  const lowered = pw.toLowerCase();
  const common = ['password', '12345678', 'qwerty', 'letmein', 'welcome', 'admin'];
  if (common.some((c) => lowered.includes(c))) {
    score = Math.min(score, 1);
    hints.unshift('Avoid common words');
  }

  const final = Math.min(4, score) as Strength['score'];
  const meta: Array<{ label: string; color: string }> = [
    { label: 'Very weak', color: 'bg-rose-500' },
    { label: 'Weak', color: 'bg-rose-400' },
    { label: 'Okay', color: 'bg-amber-400' },
    { label: 'Strong', color: 'bg-emerald-400' },
    { label: 'Very strong', color: 'bg-emerald-500' },
  ];
  return { score: final, label: meta[final].label, color: meta[final].color, hints: hints.slice(0, 3) };
}
