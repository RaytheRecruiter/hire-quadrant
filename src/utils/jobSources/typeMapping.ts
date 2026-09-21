// Shared employment-type vocabulary mapper for the 4 new ATS adapters.
// Each platform has its own strings for the same underlying concepts;
// this normalizes them to the same vocabulary xmlParser.ts already uses
// for JobDiva ('full-time' | 'part-time' | 'contract' | 'contract-to-hire'
// | 'internship'), so downstream code (job cards, filters) doesn't need
// to know which source a job came from.

export function mapEmploymentType(raw: string | undefined | null): string {
  if (!raw) return 'full-time';
  const lower = raw.trim().toLowerCase();

  if (lower.includes('intern')) return 'internship';
  if (lower.includes('contract-to-hire') || lower.includes('contract to hire')) return 'contract-to-hire';
  if (lower.includes('contract') || lower.includes('temporary') || lower.includes('temp')) return 'contract';
  if (lower.includes('part')) return 'part-time';
  if (lower.includes('full')) return 'full-time';

  // Greenhouse/Ashby/SmartRecruiters-specific literal values seen in the wild
  switch (lower) {
    case 'fulltime':
    case 'employee_full_time':
      return 'full-time';
    case 'parttime':
    case 'employee_part_time':
      return 'part-time';
    case 'intern':
    case 'employee_intern':
      return 'internship';
    case 'contractor':
    case 'employee_contract':
      return 'contract';
    default:
      return 'full-time';
  }
}
