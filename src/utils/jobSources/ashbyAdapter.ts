// Ashby public job board API — no auth, single call, no pagination.
// https://api.ashbyhq.com/posting-api/job-board/{boardName}
// boardName is the slug in the company's public URL: jobs.ashbyhq.com/{boardName}
//
// Like Lever, Ashby boards are single-tenant — company name comes from our
// own source config. publishedAt is the closest freshness signal exposed
// (no separate updatedAt on the public API).

import { stripHtmlTags, formatJobDescription } from '../xmlParser';
import { mapEmploymentType } from './typeMapping';
import { JobSourceAdapter, NormalizedJob } from './types';

interface AshbyJob {
  id: string;
  title: string;
  location?: string;
  employmentType?: string;
  publishedAt?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export function createAshbyAdapter(boardName: string, displayName: string): JobSourceAdapter {
  const sourceId = `ashby:${boardName}`;
  return {
    id: sourceId,
    platform: 'ashby',
    async fetchJobs(): Promise<NormalizedJob[]> {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${boardName}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Ashby fetch failed for board "${boardName}": ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as AshbyResponse;

      return (data.jobs || []).map((job) => {
        let description = job.descriptionHtml ? stripHtmlTags(job.descriptionHtml) : '';
        if (description) description = formatJobDescription(description);
        return {
          externalJobId: job.id,
          title: job.title,
          description: description || 'No description available',
          company: displayName,
          location: job.location || undefined,
          type: mapEmploymentType(job.employmentType),
          externalUrl: job.jobUrl || job.applyUrl,
          postedDate: job.publishedAt || new Date().toISOString(),
          sourceCompany: `Ashby: ${displayName}`,
          sourceXmlFile: sourceId,
        };
      });
    },
  };
}
