// Lightweight skill + perk extractor — scans a job title + description for
// common skill/tech/benefit keywords so we can render pill badges on cards.

const SKILLS = [
  // languages
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin', 'Swift', 'C++', 'C#', 'Ruby', 'PHP', 'Scala',
  // frontend
  'React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Tailwind',
  // backend / infra
  'Node', 'Node.js', 'Django', 'Rails', 'Laravel', 'Spring', 'FastAPI', 'Express', 'GraphQL', 'REST',
  // cloud
  'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Terraform',
  // data
  'Postgres', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Snowflake', 'BigQuery', 'Elasticsearch',
  // ml / ai
  'PyTorch', 'TensorFlow', 'LLM', 'AI', 'ML', 'NLP',
];

const PERKS = [
  { re: /\bremote\b/i, label: 'Remote' },
  { re: /\bhybrid\b/i, label: 'Hybrid' },
  { re: /\bon[- ]site\b/i, label: 'On-site' },
  { re: /\b401k|401\(k\)\b/i, label: '401(k)' },
  { re: /\bequity\b/i, label: 'Equity' },
  { re: /\bhealth (?:insurance|benefits|care)\b/i, label: 'Health benefits' },
  { re: /\bunlimited pto\b/i, label: 'Unlimited PTO' },
  { re: /\bvisa sponsor/i, label: 'Visa sponsor' },
  { re: /\brelocation\b/i, label: 'Relocation' },
];

const LEVELS = [
  { re: /\bsenior\b/i, label: 'Senior' },
  { re: /\bstaff\b/i, label: 'Staff' },
  { re: /\bprincipal\b/i, label: 'Principal' },
  { re: /\blead\b/i, label: 'Lead' },
  { re: /\bjunior\b/i, label: 'Junior' },
  { re: /\bintern\b/i, label: 'Intern' },
];

export function extractTags(title = '', description = ''): string[] {
  const haystack = `${title} ${description}`;
  const found = new Set<string>();

  // Skills: case-insensitive match on whole words
  for (const s of SKILLS) {
    const re = new RegExp(`\\b${s.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (re.test(haystack)) found.add(s);
    if (found.size >= 4) break;
  }

  // Add level if found
  for (const l of LEVELS) {
    if (l.re.test(title)) { found.add(l.label); break; }
  }

  // Add perks
  for (const p of PERKS) {
    if (p.re.test(haystack)) {
      found.add(p.label);
      if (found.size >= 5) break;
    }
  }

  return Array.from(found).slice(0, 5);
}
