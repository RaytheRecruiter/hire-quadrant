// Greenhouse public job board API — no auth, single call, no pagination.
// https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs?content=true
// boardToken is the slug in the company's public URL: boards.greenhouse.io/{token}
//
// Unlike Lever/Ashby (which return literal HTML in their description
// fields), Greenhouse's `content` field comes back HTML-entity-encoded —
// e.g. "&lt;h2&gt;&lt;strong&gt;..." instead of "<h2><strong>...". Confirmed
// live 2026-09-21 by inspecting the stripe board's raw response.
// stripHtmlTags() strips real tags first and decodes entities afterward, so
// feeding it Greenhouse's double-escaped content directly leaves the tags
// undetected and then un-escapes them into literal HTML in the output. One
// entity-decode pass up front turns the escaped tags into real ones before
// stripHtmlTags ever sees them.

import { stripHtmlTags, formatJobDescription } from '../xmlParser';
import { mapEmploymentType } from './typeMapping';
import { JobSourceAdapter, NormalizedJob } from './types';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  location?: { name?: string };
  content?: string;
  company_name?: string;
  metadata?: Array<{ name: string; value: unknown }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export function createGreenhouseAdapter(boardToken: string, displayName: string): JobSourceAdapter {
  const sourceId = `greenhouse:${boardToken}`;
  return {
    id: sourceId,
    platform: 'greenhouse',
    async fetchJobs(): Promise<NormalizedJob[]> {
      const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Greenhouse fetch failed for board "${boardToken}": ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as GreenhouseResponse;

      return (data.jobs || []).map((job) => {
        let description = job.content ? stripHtmlTags(decodeHtmlEntities(job.content)) : '';
        if (description) description = formatJobDescription(description);
        return {
          externalJobId: String(job.id),
          title: job.title,
          description: description || 'No description available',
          company: job.company_name || displayName,
          location: job.location?.name || undefined,
          type: mapEmploymentType(undefined), // Greenhouse doesn't expose a normalized employment-type field on the public board API
          externalUrl: job.absolute_url,
          postedDate: job.updated_at,
          sourceCompany: `Greenhouse: ${displayName}`,
          sourceXmlFile: sourceId,
        };
      });
    },
  };
}
