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

// Greenhouse's public board API exposes no structured country field at
// all -- location.name is free text ("US-San Francisco, US-Seattle",
// "Dublin or Germany (Berlin or Remote)", "Chicago, IL", "Toronto, Canada",
// bare "Chicago"), confirmed by sampling 289 distinct values on the Stripe
// board 2026-10-09. A perfect classifier isn't realistic; this is a
// pragmatic heuristic for the Browse Jobs "US-only by default" filter --
// if a location string contains ANY recognizable US marker, treat it as US
// (a posting listing a US option among others is legitimately relevant to
// a US-only view). Only fall through to the non-US list when no US marker
// matched at all. Anything matching neither list is left undefined
// (unfiltered by country) rather than guessed.
const US_STATE_ABBR = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];
const US_STATE_RE = new RegExp(`\\b(${US_STATE_ABBR.join('|')})\\b`);
const US_CITY_RE =
  /\b(san francisco|new york|seattle|chicago|atlanta|boston|austin|los angeles|denver|miami|dallas|houston|phoenix|philadelphia|san diego|portland|minneapolis|detroit|sf|nyc|sea|chi|dc)\b/i;

const NON_US_MARKER_RE =
  /\b(dublin|london|singapore|sydney|melbourne|tokyo|toronto|vancouver|paris|berlin|munich|milan|madrid|barcelona|mexico city|amsterdam|warsaw|bucharest|stockholm|zurich|geneva|bangalore|mumbai|delhi|hong kong|shanghai|beijing|ireland|united kingdom|\buk\b|england|germany|france|italy|spain|poland|romania|sweden|japan|israel|canada|australia|india|china|mexico|brazil|netherlands|switzerland)\b/i;

// Confirmed live 2026-10-09 (audit N13): Stripe's own Greenhouse postings
// sometimes have location.name literally set to "LOCATION" or "N/A" --
// placeholder text in a form field that was never filled in on their end,
// not a bug in our parsing. 31 live jobs had this verbatim. Treat these as
// no location at all rather than displaying the placeholder.
const PLACEHOLDER_LOCATIONS = new Set(['location', 'n/a', 'na', 'tbd', 'unknown']);

function normalizeGreenhouseLocation(locationName: string | undefined): string | undefined {
  if (!locationName) return undefined;
  const trimmed = locationName.trim();
  if (!trimmed || PLACEHOLDER_LOCATIONS.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}

function guessGreenhouseCountry(locationName: string | undefined): string | undefined {
  if (!locationName) return undefined;
  const text = locationName.toLowerCase();
  const hasUSMarker =
    /\bus-/i.test(locationName) ||
    /united states|\busa\b|remote from the us/i.test(text) ||
    US_STATE_RE.test(locationName) ||
    US_CITY_RE.test(text);
  if (hasUSMarker) return 'US';
  if (NON_US_MARKER_RE.test(text)) return undefined; // known non-US -- leave undefined, not 'US'
  return undefined;
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
          location: normalizeGreenhouseLocation(job.location?.name),
          type: mapEmploymentType(undefined), // Greenhouse doesn't expose a normalized employment-type field on the public board API
          externalUrl: job.absolute_url,
          postedDate: job.updated_at,
          sourceCompany: `Greenhouse: ${displayName}`,
          sourceXmlFile: sourceId,
          country: guessGreenhouseCountry(normalizeGreenhouseLocation(job.location?.name)),
        };
      });
    },
  };
}
