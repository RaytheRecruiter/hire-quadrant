// Keyword-based category derivation. Mirrors the SQL backfill in
// supabase/migrations/20260423_add_job_category.sql so jobs inserted
// client-side or via the XML feed get the same category labels as the
// one-shot backfill that ran when the column was added.
//
// If you change the rules here, update the SQL case expression to match.

export type JobCategory =
  | 'Engineering'
  | 'Design'
  | 'Marketing'
  | 'Finance'
  | 'Sales'
  | 'Operations'
  | 'Data & Analytics'
  | 'Healthcare'
  | 'Other';

export const JOB_CATEGORIES: JobCategory[] = [
  'Engineering',
  'Design',
  'Marketing',
  'Finance',
  'Sales',
  'Operations',
  'Data & Analytics',
  'Healthcare',
  'Other',
];

// Patterns run top-down; first match wins.
const RULES: [RegExp, JobCategory][] = [
  [/\b(engineer|developer|devops|programmer|software|swe|sre|full[- ]?stack|back[- ]?end|front[- ]?end)\b/i, 'Engineering'],
  [/\b(designer|ux|ui|product design|graphic design|creative)\b/i, 'Design'],
  [/\b(marketing|seo|content|brand|growth|social media)\b/i, 'Marketing'],
  [/\b(finance|accountant|accounting|auditor|controller)\b/i, 'Finance'],
  [/\b(sales|account executive|bdr|sdr|account manager)\b/i, 'Sales'],
  [/\b(operations|logistics|supply chain|coordinator)\b/i, 'Operations'],
  [/\b(data|analytics|ml|bi)\b/i, 'Data & Analytics'],
  [/\b(nurse|doctor|medical|clinical|healthcare|rn|cna|therapist)\b/i, 'Healthcare'],
];

export function deriveJobCategory(title: string | null | undefined): JobCategory {
  if (!title) return 'Other';
  for (const [pattern, label] of RULES) {
    if (pattern.test(title)) return label;
  }
  return 'Other';
}
