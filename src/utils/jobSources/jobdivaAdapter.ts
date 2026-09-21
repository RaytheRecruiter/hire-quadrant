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
        sourceCompany: job.sourceCompany,
        sourceXmlFile: job.sourceXmlFile || JOBDIVA_SOURCE.name,
      }));
    },
  };
}
