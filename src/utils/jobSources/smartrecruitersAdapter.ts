// SmartRecruiters public postings API — no auth, but two-phase and paginated:
// 1) GET .../companies/{companyId}/postings?offset=&limit=100 — list, no full description
// 2) GET .../postings/{id} — detail call per posting for the real description (jobAd.sections)
//
// A 200 on the list endpoint isn't proof of a real/active board — guessed
// company IDs can come back with totalFound: 0 — so an empty result here is
// treated as "no jobs," not an error; the caller/sourceConfig is responsible
// for only listing companyIds already confirmed to have postings.
//
// A small delay between detail calls since SmartRecruiters documents no
// explicit rate limit but this is N+1 against a real public API.

import { stripHtmlTags, formatJobDescription } from '../xmlParser';
import { mapEmploymentType } from './typeMapping';
import { JobSourceAdapter, NormalizedJob } from './types';

const PAGE_LIMIT = 100;
const MAX_PAGES = 50; // hard ceiling against runaway pagination (5000 postings)
const DETAIL_DELAY_MS = 150;

interface SmartRecruitersPostingSummary {
  id: string;
  name: string;
  releasedDate?: string;
  location?: { city?: string; region?: string; country?: string };
}

interface SmartRecruitersListResponse {
  totalFound: number;
  content: SmartRecruitersPostingSummary[];
}

interface SmartRecruitersDetail {
  id: string;
  name: string;
  releasedDate?: string;
  location?: { city?: string; region?: string; country?: string };
  typeOfEmployment?: { label?: string };
  industry?: { label?: string };
  jobAd?: {
    sections?: Record<string, { title?: string; text?: string }>;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatLocation(location?: { city?: string; region?: string; country?: string }): string | undefined {
  if (!location) return undefined;
  const parts = [location.city, location.region, location.country].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

function extractDescription(detail: SmartRecruitersDetail): string {
  const sections = detail.jobAd?.sections;
  if (!sections) return '';
  return Object.values(sections)
    .map((section) => section?.text || '')
    .filter(Boolean)
    .join('\n\n');
}

export function createSmartRecruitersAdapter(companyId: string, displayName: string): JobSourceAdapter {
  const sourceId = `smartrecruiters:${companyId}`;
  return {
    id: sourceId,
    platform: 'smartrecruiters',
    async fetchJobs(): Promise<NormalizedJob[]> {
      const summaries: SmartRecruitersPostingSummary[] = [];
      let offset = 0;
      let totalFound = 0;

      for (let page = 0; page < MAX_PAGES; page++) {
        const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?offset=${offset}&limit=${PAGE_LIMIT}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`SmartRecruiters list fetch failed for company "${companyId}": ${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as SmartRecruitersListResponse;
        totalFound = data.totalFound || 0;
        summaries.push(...(data.content || []));

        offset += PAGE_LIMIT;
        if (offset >= totalFound || (data.content || []).length === 0) break;
      }

      if (totalFound === 0 || summaries.length === 0) {
        return [];
      }

      const jobs: NormalizedJob[] = [];
      for (const summary of summaries) {
        const detailUrl = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings/${summary.id}`;
        const res = await fetch(detailUrl);
        if (!res.ok) {
          console.warn(`SmartRecruiters detail fetch failed for posting "${summary.id}": ${res.status} ${res.statusText}`);
          continue;
        }
        const detail = (await res.json()) as SmartRecruitersDetail;

        let description = extractDescription(detail);
        if (description) {
          description = formatJobDescription(stripHtmlTags(description));
        }

        jobs.push({
          externalJobId: detail.id,
          title: detail.name,
          description: description || 'No description available',
          company: displayName,
          location: formatLocation(detail.location),
          type: mapEmploymentType(detail.typeOfEmployment?.label),
          externalUrl: `https://jobs.smartrecruiters.com/${companyId}/${detail.id}`,
          postedDate: detail.releasedDate || new Date().toISOString(),
          sourceCompany: `SmartRecruiters: ${displayName}`,
          sourceXmlFile: sourceId,
        });

        await sleep(DETAIL_DELAY_MS);
      }

      return jobs;
    },
  };
}
