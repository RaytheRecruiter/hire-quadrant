// Normalizes free-text salary strings for display. JobDiva feeds often send
// a bare `ratemin` with no `rateper`, which the ingest stored as "From $130"
// (reads as $130/year). Strings with no unit and only small amounts are
// hourly rates; large bare amounts get thousands separators.
const HAS_UNIT = /\/|\bper\b|hour|\bhr\b|year|annual|month|week|\d\s*[kK]\b/i;
const AMOUNT = /\$(\d[\d,]*(?:\.\d+)?)/g;

export function formatSalaryText(salary: string | null | undefined): string | null | undefined {
  if (!salary || HAS_UNIT.test(salary)) return salary;
  const amounts = [...salary.matchAll(AMOUNT)].map(m => Number(m[1].replace(/,/g, '')));
  if (amounts.length === 0 || amounts.some(a => !Number.isFinite(a))) return salary;
  if (amounts.every(a => a < 1000)) return `${salary.trim()}/hr`;
  return salary.replace(AMOUNT, (_m, raw: string) =>
    `$${Math.round(Number(raw.replace(/,/g, ''))).toLocaleString('en-US')}`);
}
