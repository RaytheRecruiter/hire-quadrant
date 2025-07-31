import { Job } from '../contexts/JobContext';

/**
 * XML Generator utility for creating job XML files
 */
export class XMLJobFeeder {
  private jobs: Job[] = [];

  constructor(jobs: Job[] = []) {
    this.jobs = jobs;
  }

  /**
   * Add a single job to the feeder
   */
  addJob(job: Job): void {
    this.jobs.push(job);
  }

  /**
   * Add multiple jobs to the feeder
   */
  addJobs(jobs: Job[]): void {
    this.jobs.push(...jobs);
  }

  /**
   * Clear all jobs from the feeder
   */
  clearJobs(): void {
    this.jobs = [];
  }

  /**
   * Get all jobs in the feeder
   */
  getJobs(): Job[] {
    return [...this.jobs];
  }

  /**
   * Generate XML string from the jobs
   */
  generateXML(): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const rootOpen = '<jobs>\n';
    const rootClose = '</jobs>';

    const jobsXML = this.jobs.map(job => this.jobToXML(job)).join('\n');

    return xmlHeader + rootOpen + jobsXML + '\n' + rootClose;
  }

  /**
   * Convert a single job to XML format
   */
  private jobToXML(job: Job): string {
    const indent = '  ';
    const itemIndent = '    ';

    // Format requirements
    const requirementsXML = job.requirements.length > 0 
      ? `${indent}<requirements>\n${job.requirements.map(req => `${itemIndent}<item>${this.escapeXML(req)}</item>`).join('\n')}\n${indent}</requirements>`
      : `${indent}<requirements></requirements>`;

    // Format benefits
    const benefitsXML = job.benefits.length > 0
      ? `${indent}<benefits>\n${job.benefits.map(benefit => `${itemIndent}<item>${this.escapeXML(benefit)}</item>`).join('\n')}\n${indent}</benefits>`
      : `${indent}<benefits></benefits>`;

    // Format dates
    const postedDate = this.formatDate(job.postedDate);
    const applicationDeadline = this.formatDate(job.applicationDeadline);

    return `${indent}<job>
${indent}  <id>${this.escapeXML(job.id)}</id>
${indent}  <title>${this.escapeXML(job.title)}</title>
${indent}  <company>${this.escapeXML(job.company)}</company>
${indent}  <location>${this.escapeXML(job.location)}</location>
${indent}  <type>${job.type}</type>
${indent}  <salary>${this.escapeXML(job.salary)}</salary>
${indent}  <description>${this.escapeXML(job.description)}</description>
${requirementsXML}
${benefitsXML}
${indent}  <postedDate>${postedDate}</postedDate>
${indent}  <applicationDeadline>${applicationDeadline}</applicationDeadline>
${indent}  <views>${job.views}</views>
${indent}  <applications>${job.applications}</applications>
${indent}</job>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format date to YYYY-MM-DD format
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Download the generated XML as a file
   */
  downloadXML(filename: string = 'jobs.xml'): void {
    const xmlContent = this.generateXML();
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Save XML to localStorage for testing
   */
  saveToLocalStorage(key: string = 'generated-jobs-xml'): void {
    const xmlContent = this.generateXML();
    localStorage.setItem(key, xmlContent);
  }

  /**
   * Create a sample job for testing
   */
  static createSampleJob(overrides: Partial<Job> = {}): Job {
    const defaultJob: Job = {
      id: `job-${Date.now()}`,
      title: 'Sample Job Title',
      company: 'Sample Company',
      location: 'Sample City, ST',
      type: 'full-time',
      salary: '$50,000 - $70,000',
      description: 'This is a sample job description that demonstrates the XML structure.',
      requirements: [
        'Sample requirement 1',
        'Sample requirement 2',
        'Sample requirement 3'
      ],
      benefits: [
        'Sample benefit 1',
        'Sample benefit 2',
        'Sample benefit 3'
      ],
      postedDate: new Date(),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      views: 0,
      applications: 0
    };

    return { ...defaultJob, ...overrides };
  }
}

/**
 * Utility functions for XML generation
 */
export const xmlFeederUtils = {
  /**
   * Create XML feeder from existing jobs
   */
  fromJobs: (jobs: Job[]) => new XMLJobFeeder(jobs),

  /**
   * Create XML feeder with sample data
   */
  withSampleData: () => {
    const feeder = new XMLJobFeeder();
    
    // Add sample jobs
    feeder.addJob(XMLJobFeeder.createSampleJob({
      id: 'sample-1',
      title: 'Senior Software Engineer',
      company: 'Tech Innovations Inc',
      location: 'San Francisco, CA',
      type: 'full-time',
      salary: '$120,000 - $160,000',
      description: 'Join our team to build cutting-edge software solutions.',
      requirements: [
        '5+ years of software development experience',
        'Proficiency in JavaScript, React, and Node.js',
        'Experience with cloud platforms (AWS, Azure, or GCP)',
        'Strong problem-solving skills'
      ],
      benefits: [
        'Comprehensive health insurance',
        'Flexible work arrangements',
        'Professional development budget',
        'Stock options'
      ],
      views: 150,
      applications: 25
    }));

    feeder.addJob(XMLJobFeeder.createSampleJob({
      id: 'sample-2',
      title: 'UX Designer',
      company: 'Creative Solutions LLC',
      location: 'New York, NY',
      type: 'full-time',
      salary: '$80,000 - $110,000',
      description: 'Design beautiful and intuitive user experiences.',
      requirements: [
        '3+ years of UX/UI design experience',
        'Proficiency in Figma and Adobe Creative Suite',
        'Strong portfolio demonstrating design skills',
        'Understanding of user-centered design principles'
      ],
      benefits: [
        'Health and dental insurance',
        'Creative workspace',
        'Design conference attendance',
        'Flexible hours'
      ],
      views: 89,
      applications: 12
    }));

    feeder.addJob(XMLJobFeeder.createSampleJob({
      id: 'sample-3',
      title: 'Marketing Intern',
      company: 'StartupXYZ',
      location: 'Remote',
      type: 'internship',
      salary: '$20 - $25/hour',
      description: 'Gain hands-on experience in digital marketing.',
      requirements: [
        'Currently pursuing Marketing or related degree',
        'Basic understanding of social media platforms',
        'Strong written communication skills',
        'Eagerness to learn and grow'
      ],
      benefits: [
        'Mentorship from experienced marketers',
        'Real-world project experience',
        'Flexible remote work',
        'Potential for full-time offer'
      ],
      views: 234,
      applications: 45
    }));

    return feeder;
  },

  /**
   * Generate XML from job data
   */
  generateXMLFromJobs: (jobs: Job[]) => {
    const feeder = new XMLJobFeeder(jobs);
    return feeder.generateXML();
  }
};