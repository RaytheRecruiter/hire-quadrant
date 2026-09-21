// Lever public postings API — no auth, single call.
// https://api.lever.co/v0/postings/{site}?mode=json
// site is the slug in the company's public URL: jobs.lever.co/{site}
//
// Lever boards are single-tenant (one site = one company), so the payload
// has no per-job company field — company name comes from our own source
// config (displayName). There's also no update timestamp, only createdAt
// (job creation time) — used as postedDate since it's the closest signal
// Lever's public API exposes.

import { stripHtmlTags, formatJobDescription } from '../xmlParser';
import { mapEmploymentType } from './typeMapping';
import { JobSourceAdapter, NormalizedJob } from './types';

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt: number; // unix ms
  categories?: { commitment?: string; location?: string; team?: string };
  country?: string;
  description?: string;
  descriptionPlain?: string;
}

export function createLeverAdapter(site: string, displayName: string): JobSourceAdapter {
  const sourceId = `lever:${site}`;
  return {
    id: sourceId,
    platform: 'lever',
    async fetchJobs(): Promise<NormalizedJob[]> {
      const url = `https://api.lever.co/v0/postings/${site}?mode=json`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Lever fetch failed for site "${site}": ${res.status} ${res.statusText}`);
      }
      const postings = (await res.json()) as LeverPosting[];

      return postings.map((posting) => {
        let description = posting.description ? stripHtmlTags(posting.description) : (posting.descriptionPlain || '');
        if (description) description = formatJobDescription(description);
        return {
          externalJobId: posting.id,
          title: posting.text,
          description: description || 'No description available',
          company: displayName,
          location: posting.categories?.location || posting.country || undefined,
          type: mapEmploymentType(posting.categories?.commitment),
          externalUrl: posting.hostedUrl,
          postedDate: new Date(posting.createdAt).toISOString(),
          sourceCompany: `Lever: ${displayName}`,
          sourceXmlFile: sourceId,
        };
      });
    },
  };
}
