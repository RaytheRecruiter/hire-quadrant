// Job relevance scoring: ranks jobs by how well they match a candidate's profile.
// Sponsored jobs always appear first regardless of score.

export interface CandidateProfile {
  skills: string[];
  experienceYears: number | null;
  preferredLocations: string[];
  preferredJobTypes: string[];
  parsedTitle: string | null;
  location: string | null;
}

export interface ScoreableJob {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  type?: string;
  salary?: string;
  requirements?: string[];
  posted_date?: string;
  postedDate?: string;
  is_sponsored?: boolean;
  sponsor_tier?: number;
  sponsor_start_date?: string;
  sponsor_end_date?: string;
  [key: string]: any;
}

export interface ScoredJob extends ScoreableJob {
  relevanceScore: number;
  matchBreakdown: {
    skillMatch: number;
    locationMatch: number;
    typeMatch: number;
    titleMatch: number;
    recencyBonus: number;
  };
  isActiveSponsored: boolean;
}

const WEIGHTS = {
  skillMatch: 0.40,
  locationMatch: 0.25,
  typeMatch: 0.15,
  titleMatch: 0.15,
  recencyBonus: 0.05,
};

/**
 * Check if a job's sponsorship is currently active
 */
function isSponsoredActive(job: ScoreableJob): boolean {
  if (!job.is_sponsored) return false;
  const now = new Date();
  if (job.sponsor_start_date && new Date(job.sponsor_start_date) > now) return false;
  if (job.sponsor_end_date && new Date(job.sponsor_end_date) < now) return false;
  return true;
}

/**
 * Calculate skill match score using Jaccard similarity
 */
function calcSkillMatch(candidateSkills: string[], jobText: string): number {
  if (candidateSkills.length === 0) return 0;

  const jobLower = jobText.toLowerCase();
  let matchCount = 0;

  for (const skill of candidateSkills) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(jobLower)) {
      matchCount++;
    }
  }

  // Jaccard-like: matches / candidate skills (we care about what % of the candidate's skills are relevant)
  return matchCount / candidateSkills.length;
}

/**
 * Calculate location match score
 */
function calcLocationMatch(candidateLocations: string[], candidateLocation: string | null, jobLocation: string | undefined): number {
  if (!jobLocation) return 0.5; // Unknown location gets neutral score

  const jobLoc = jobLocation.toLowerCase();

  // Remote jobs match well for everyone
  if (/remote/i.test(jobLoc)) return 0.8;

  // Check candidate's preferred locations
  for (const loc of candidateLocations) {
    if (loc.toLowerCase() === 'remote') continue;
    const parts = loc.toLowerCase().split(',').map(s => s.trim());
    // City match
    if (parts[0] && jobLoc.includes(parts[0])) return 1.0;
    // State match
    if (parts[1] && jobLoc.includes(parts[1])) return 0.5;
  }

  // Check candidate's profile location
  if (candidateLocation) {
    const candLoc = candidateLocation.toLowerCase();
    if (jobLoc.includes(candLoc) || candLoc.includes(jobLoc.split(',')[0])) return 0.8;
    // Same state check
    const candState = candLoc.split(',').pop()?.trim();
    const jobState = jobLoc.split(',').pop()?.trim();
    if (candState && jobState && candState === jobState) return 0.5;
  }

  return 0.0;
}

/**
 * Calculate job type match score
 */
function calcTypeMatch(preferredTypes: string[], jobType: string | undefined): number {
  if (!jobType || preferredTypes.length === 0) return 0.5; // Neutral if no preference
  return preferredTypes.includes(jobType.toLowerCase()) ? 1.0 : 0.2;
}

/**
 * Calculate title/seniority match score
 */
function calcTitleMatch(candidateTitle: string | null, jobTitle: string): number {
  if (!candidateTitle) return 0.5; // Neutral if no parsed title

  const candWords = candidateTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const jobWords = jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (candWords.length === 0 || jobWords.length === 0) return 0.5;

  let matchCount = 0;
  for (const word of candWords) {
    if (jobWords.some(jw => jw.includes(word) || word.includes(jw))) {
      matchCount++;
    }
  }

  return matchCount / candWords.length;
}

/**
 * Calculate recency bonus (jobs posted in last 7 days get a boost)
 */
function calcRecencyBonus(postedDate: string | undefined): number {
  if (!postedDate) return 0;
  const posted = new Date(postedDate);
  const daysSincePosted = (Date.now() - posted.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePosted <= 3) return 1.0;
  if (daysSincePosted <= 7) return 0.7;
  if (daysSincePosted <= 14) return 0.4;
  if (daysSincePosted <= 30) return 0.2;
  return 0;
}

/**
 * Score and sort jobs based on candidate profile.
 * Sponsored jobs always appear first, sorted by tier.
 * Non-sponsored jobs are sorted by relevance score.
 */
export function scoreJobs(jobs: ScoreableJob[], candidate: CandidateProfile): ScoredJob[] {
  const scored: ScoredJob[] = jobs.map(job => {
    const jobText = [job.title, job.description, ...(job.requirements || [])].join(' ');
    const postedDate = job.posted_date || job.postedDate;

    const skillMatch = calcSkillMatch(candidate.skills, jobText);
    const locationMatch = calcLocationMatch(
      candidate.preferredLocations,
      candidate.location,
      job.location
    );
    const typeMatch = calcTypeMatch(candidate.preferredJobTypes, job.type);
    const titleMatch = calcTitleMatch(candidate.parsedTitle, job.title);
    const recencyBonus = calcRecencyBonus(postedDate);

    const relevanceScore = Math.round(
      (skillMatch * WEIGHTS.skillMatch +
       locationMatch * WEIGHTS.locationMatch +
       typeMatch * WEIGHTS.typeMatch +
       titleMatch * WEIGHTS.titleMatch +
       recencyBonus * WEIGHTS.recencyBonus) * 100
    );

    return {
      ...job,
      relevanceScore,
      matchBreakdown: { skillMatch, locationMatch, typeMatch, titleMatch, recencyBonus },
      isActiveSponsored: isSponsoredActive(job),
    };
  });

  // Sort: sponsored first (by tier DESC), then by relevance score DESC
  scored.sort((a, b) => {
    // Sponsored always first
    if (a.isActiveSponsored && !b.isActiveSponsored) return -1;
    if (!a.isActiveSponsored && b.isActiveSponsored) return 1;

    // Among sponsored: sort by tier
    if (a.isActiveSponsored && b.isActiveSponsored) {
      return (b.sponsor_tier || 0) - (a.sponsor_tier || 0);
    }

    // Among non-sponsored: sort by relevance score
    return b.relevanceScore - a.relevanceScore;
  });

  return scored;
}
