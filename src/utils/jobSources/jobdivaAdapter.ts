// Thin wrapper around the existing, unchanged XML parsing pipeline
// (src/utils/xmlParser.ts). id/sourceXmlFile stays exactly 'hirequadrant.xml'
// — the same value it has always had — so existing job IDs and any
// external links/bookmarks into the site keep working unchanged.

import { fetchAndParseJobsXmlWithSources, XmlSource } from '../xmlParser';
import { JobSourceAdapter, NormalizedJob } from './types';

const JOBDIVA_SOURCE: XmlSource = {
  url: 'https://www2.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=ecjdnwoxsqkabbr23rp3rqscjzk6vq01b8i9xsuraltku3dg8lqd5euflfugmd70',
  name: 'hirequadrant.xml',
};

export function createJobDivaAdapter(): JobSourceAdapter {
  return {
    id: JOBDIVA_SOURCE.name,
    platform: 'jobdiva',
    async fetchJobs(): Promise<NormalizedJob[]> {
      const jobs = await fetchAndParseJobsXmlWithSources([JOBDIVA_SOURCE]);
      return jobs.map((job) => ({
        externalJobId: job.externalJobId,
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        externalUrl: job.externalUrl,
        postedDate: (job.postedDate instanceof Date ? job.postedDate : new Date(job.postedDate)).toISOString(),
        // job.sourceCompany (from xmlParser.ts) holds the raw feed filename
        // ("hirequadrant.xml"), not a real label -- admin tooling
        // (CompanySourceManager.tsx) displays this value directly as the
        // source's name, so it was literally showing "hirequadrant.xml" as
        // if it were an employer/source label. Confirmed live 2026-10-09
        // via audit N13. Override here to match the "Platform: Company"
        // convention the 4 ATS adapters already use, rather than touching
        // xmlParser.ts's parseJobsXml (used nowhere else).
        sourceCompany: `JobDiva: ${job.company}`,
        sourceXmlFile: job.sourceXmlFile || JOBDIVA_SOURCE.name,
        // Every JobDiva job is a Quadrant, Inc. US agency placement --
        // location is always a US state ("VA - Alexandria" etc).
        country: 'US',
      }));
    },
  };
}
