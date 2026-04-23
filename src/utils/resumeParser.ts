// Resume text → structured candidate profile data
// Uses keyword matching against a skills taxonomy.
// Can be enhanced with AI (Haiku) via the edge function endpoint.

const SKILLS_TAXONOMY: string[] = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'ruby', 'go', 'rust', 'php',
  'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'lua', 'dart', 'elixir', 'haskell',
  // Frontend
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'html', 'css', 'sass', 'tailwind',
  'bootstrap', 'jquery', 'redux', 'graphql', 'webpack', 'vite',
  // Backend
  'node.js', 'express', 'django', 'flask', 'spring', 'rails', 'fastapi', 'nestjs', '.net',
  'asp.net', 'laravel', 'symfony',
  // Databases
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
  'sqlite', 'oracle', 'sql server', 'firebase', 'supabase',
  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd',
  'github actions', 'gitlab ci', 'cloudformation', 'serverless', 'linux', 'nginx',
  // Data & AI/ML
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
  'nlp', 'computer vision', 'data science', 'data engineering', 'spark', 'hadoop', 'airflow',
  'tableau', 'power bi', 'looker',
  // Security
  'cybersecurity', 'penetration testing', 'siem', 'soc', 'incident response', 'compliance',
  'iso 27001', 'nist', 'encryption', 'oauth', 'saml', 'zero trust',
  // Project & Business
  'agile', 'scrum', 'jira', 'confluence', 'project management', 'product management',
  'business analysis', 'stakeholder management', 'requirements gathering',
  // Design
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux', 'wireframing',
  'prototyping', 'user research',
  // Other Tech
  'rest api', 'microservices', 'git', 'api design', 'system design', 'distributed systems',
  'blockchain', 'iot', 'mobile development', 'react native', 'flutter',
  // Soft Skills & Certifications
  'leadership', 'communication', 'problem solving', 'teamwork', 'mentoring',
  'aws certified', 'azure certified', 'pmp', 'cissp', 'ceh', 'comptia', 'ccna',
  'six sigma', 'itil',
];

// Common title patterns to extract from resume
const TITLE_PATTERNS = [
  /(?:^|\n)\s*((?:senior|junior|lead|principal|staff|chief|head|vp|director|manager)\s+)?(?:of\s+)?([\w\s/&]+(?:engineer|developer|architect|analyst|scientist|designer|manager|administrator|consultant|specialist|coordinator|officer|director|lead))/im,
];

// Experience patterns to extract years
const EXPERIENCE_PATTERNS = [
  /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|expertise|work)/i,
  /(?:experience|expertise|work)(?:\s+of)?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/i,
  /over\s+(\d{1,2})\s*(?:years?|yrs?)/i,
];

export interface ParsedResumeData {
  skills: string[];
  experienceYears: number | null;
  parsedTitle: string | null;
  preferredLocations: string[];
  preferredJobTypes: string[];
}

/**
 * Extract structured data from resume text using keyword matching.
 */
export function parseResumeText(text: string): ParsedResumeData {
  const lowerText = text.toLowerCase();

  // Extract skills
  const skills = SKILLS_TAXONOMY.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(lowerText);
  });

  // Extract experience years
  let experienceYears: number | null = null;
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      experienceYears = parseInt(match[1], 10);
      break;
    }
  }

  // If no explicit years mentioned, try to estimate from date ranges
  if (experienceYears === null) {
    const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map(Number).sort();
      const range = years[years.length - 1] - years[0];
      if (range > 0 && range < 50) {
        experienceYears = range;
      }
    }
  }

  // Extract title
  let parsedTitle: string | null = null;
  for (const pattern of TITLE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      parsedTitle = match[0].trim();
      break;
    }
  }

  // Extract locations (common US city patterns)
  const locationPatterns = /(?:^|\n|,|\|)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g;
  const preferredLocations: string[] = [];
  let locMatch;
  while ((locMatch = locationPatterns.exec(text)) !== null) {
    const loc = locMatch[1].trim();
    if (!preferredLocations.includes(loc) && preferredLocations.length < 5) {
      preferredLocations.push(loc);
    }
  }

  // Infer preferred job types from resume content
  const preferredJobTypes: string[] = [];
  if (/\b(?:full[- ]time|permanent|direct\s+hire)\b/i.test(text)) {
    preferredJobTypes.push('full-time');
  }
  if (/\b(?:contract(?:or)?|freelance|consulting|1099)\b/i.test(text)) {
    preferredJobTypes.push('contract');
  }
  if (/\b(?:contract[- ]to[- ]hire|temp[- ]to[- ]perm)\b/i.test(text)) {
    preferredJobTypes.push('contract-to-hire');
  }
  if (/\b(?:remote|work\s+from\s+home|wfh|telecommut)/i.test(text)) {
    // Not a job type but useful info - add to locations
    if (!preferredLocations.includes('Remote')) {
      preferredLocations.push('Remote');
    }
  }

  return {
    skills: [...new Set(skills)],
    experienceYears,
    parsedTitle,
    preferredLocations,
    preferredJobTypes,
  };
}
