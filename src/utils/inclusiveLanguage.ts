// Flags biased / exclusionary terms in job descriptions. Regex-only, no AI.
// Goal isn't to block — it's to surface swaps a recruiter can consider before
// publishing. Sources: Harvard Business Review, Textio research, US EEOC.

export interface Flag {
  match: string;
  start: number;
  end: number;
  reason: string;
  suggestion?: string;
  category: 'gendered' | 'age' | 'ableist' | 'culture-fit' | 'exclusionary' | 'jargon';
}

const RULES: Array<{
  pattern: RegExp;
  reason: string;
  suggestion?: string;
  category: Flag['category'];
}> = [
  // Gender-coded masculine
  { pattern: /\b(rockstar|ninja|guru|wizard)\b/gi, reason: 'Masculine-coded term that deters women candidates', suggestion: 'expert / specialist', category: 'gendered' },
  { pattern: /\b(manpower|manmade|chairman|salesman|policeman|foreman)\b/gi, reason: 'Gendered term', suggestion: 'workforce / staffed / chair / salesperson / officer / supervisor', category: 'gendered' },
  { pattern: /\b(aggressive|competitive|dominant|ambitious)\b/gi, reason: 'Masculine-coded language — balance with collaborative terms', category: 'gendered' },
  { pattern: /\b(he|him|his)\b(?= will| is| should| must)/gi, reason: 'Use gender-neutral pronouns (they / the candidate)', suggestion: 'they / the candidate', category: 'gendered' },
  // Age
  { pattern: /\b(young|youthful|energetic|digital native)\b/gi, reason: 'Age-coded — can violate ADEA', suggestion: 'motivated / adaptable', category: 'age' },
  { pattern: /\b(recent grad|new grad|fresh out of (school|college))\b/gi, reason: 'Favors younger candidates', suggestion: 'early career', category: 'age' },
  { pattern: /\b(seasoned|mature)\b/gi, reason: 'Can skew older — ensure pairing with skill-based criteria', category: 'age' },
  // Ableist
  { pattern: /\b(crazy|insane|lame|tone-deaf|blind (eye|spot)|dumb)\b/gi, reason: 'Ableist metaphor', suggestion: 'wild / unexpected / dismissive / unaware / unwise', category: 'ableist' },
  { pattern: /\b(stand(-| )up|walk around|must be able to stand)\b/gi, reason: 'Physical requirement — only include if truly essential for the role', category: 'ableist' },
  // Culture fit
  { pattern: /\b(culture fit|culture-fit)\b/gi, reason: 'Vague and exclusionary — specify which values', suggestion: 'values alignment: <list>', category: 'culture-fit' },
  { pattern: /\b(work hard, play hard|family(-| )like|drinking (?=culture|together))\b/gi, reason: 'Signals in-group bias', category: 'culture-fit' },
  // Exclusionary credentialism
  { pattern: /\b(ivy(-| )?league|top(-| )?tier (school|university))\b/gi, reason: 'School-tier preference narrows the pool without improving outcomes', category: 'exclusionary' },
  { pattern: /\b(native (english )?speaker)\b/gi, reason: 'National origin discrimination risk', suggestion: 'professional English proficiency', category: 'exclusionary' },
];

export function scanInclusive(text: string): Flag[] {
  if (!text) return [];
  const flags: Flag[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      flags.push({
        match: m[0],
        start: m.index,
        end: m.index + m[0].length,
        reason: rule.reason,
        suggestion: rule.suggestion,
        category: rule.category,
      });
      // Guard against zero-width infinite loop
      if (m.index === rule.pattern.lastIndex) rule.pattern.lastIndex++;
    }
  }
  // Dedupe by (match + start)
  const seen = new Set<string>();
  return flags.filter((f) => {
    const k = `${f.start}:${f.match.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
