import { Job } from '../contexts/JobContext';
import { JSDOM } from 'jsdom';

export interface XmlSource {
  path: string;
  company: string;
}

/**
 * Parses XML content and converts it to an array of Job objects
 * @param xmlContent - The XML string content to parse
 * @param sourceCompany - The company that provided this XML file
 * @param sourceXmlFile - The XML file path for tracking
 * @returns Array of Job objects
 */
export const parseJobsXml = (xmlContent: string, sourceCompany?: string, sourceXmlFile?: string): Job[] => {
  try {
     const dom = new JSDOM(xmlContent, { contentType: 'application/xml' });
     const parser = new dom.window.DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }
    
    const jobElements = xmlDoc.querySelectorAll('job');
    const jobs: Job[] = [];
    
    jobElements.forEach((jobElement) => {
      try {
        // Add detailed logging for each job element being processed
        console.log('--- Processing Job Element ---');
        console.log('Job Element Tag Name:', jobElement.tagName);
        console.log('Job Element Attributes:', Array.from(jobElement.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', '));
        console.log('Job Element Inner HTML (first 200 chars):', jobElement.innerHTML.substring(0, 200) + '...');

        // Extract basic job information - handle both formats
        const id = getTextContent(jobElement, 'id') || getTextContent(jobElement, 'ID') || getTextContent(jobElement, 'jobdivaid');
        const title = getTextContent(jobElement, 'title');
        const company = getTextContent(jobElement, 'company') || sourceCompany || 'Unknown Company';
        
        // Handle location - combine city and state if available
        let location = getTextContent(jobElement, 'location');
        if (!location) {
          const city = getTextContent(jobElement, 'city');
          const state = getTextContent(jobElement, 'state') || getTextContent(jobElement, 'state_abbr');
          if (city && state) {
            location = `${city}, ${state}`;
          } else if (city) {
            location = city;
          } else if (state) {
            location = state;
          }
        }
        
        // Handle job type mapping with improved logic
        let type = getTextContent(jobElement, 'type') as Job['type'];
        if (!type) {
          const positionType = getTextContent(jobElement, 'positiontype')?.trim();
          
          if (!positionType) {
            type = 'full-time'; // Default when no position type is specified
          } else {
            // First check for exact numeric codes (JobDiva format)
            switch (positionType) {
              case '1':
                type = 'full-time'; // Direct Placement
                break;
              case '2':
                type = 'contract';
                break;
              case '3':
                type = 'contract-to-hire'; // Contract to Hire
                break;
              case '4':
                type = 'internship';
                break;
              default:
                // Then check for exact string matches (case-insensitive)
                const lowerType = positionType.toLowerCase();
                if (lowerType === 'full time' || lowerType === 'full-time' || lowerType === 'fulltime') {
                  type = 'full-time';
                } else if (lowerType === 'part time' || lowerType === 'part-time' || lowerType === 'parttime') {
                  type = 'part-time';
                } else if (lowerType === 'contract' || lowerType === 'contractor' || lowerType === 'contract to hire' || lowerType === 'contract-to-hire') {
                  type = 'contract';
                } else if (lowerType === 'contract to hire' || lowerType === 'contract-to-hire') {
                  type = 'contract-to-hire';
                } else if (lowerType === 'internship' || lowerType === 'intern') {
                  type = 'internship';
                } else if (lowerType.includes('contract')) {
                  type = 'contract';
                } else if (lowerType.includes('intern')) {
                  type = 'internship';
                } else {
                  // Default to full-time for unrecognized types
                  type = 'full-time';
                  console.log(`Unknown position type "${positionType}" for job "${title}", defaulting to full-time`);
                }
                break;
            }
          }
        }
        
        // Handle salary - look in dedicated field first, then extract from description
        let salary = getTextContent(jobElement, 'salary');
        if (!salary) {
          // Check for rate fields (JobDiva format)
          const rateMin = getTextContent(jobElement, 'ratemin');
          const rateMax = getTextContent(jobElement, 'ratemax');
          const ratePer = getTextContent(jobElement, 'rateper');
          
          if (rateMin && rateMax) {
            const suffix = ratePer ? `/${ratePer}` : '';
            salary = `$${rateMin} - $${rateMax}${suffix}`;
          } else if (rateMin) {
            const suffix = ratePer ? `/${ratePer}` : '';
            salary = `From $${rateMin}${suffix}`;
          }
        }
        if (!salary) {
          const description = getTextContent(jobElement, 'description') || 
                             getTextContent(jobElement, 'jobdescription_400char') ||
                             getTextContent(jobElement, 'jobdescription');
          salary = extractSalaryFromText(description);
        }
        
        // Handle description - use jobdescription_400char if description is not available
        let description = getTextContent(jobElement, 'description');
        if (!description) {
          description = getTextContent(jobElement, 'jobdescription_400char') ||
                       getTextContent(jobElement, 'jobdescription');
        }
        
        // Clean HTML from description for display
        if (description) {
          description = stripHtmlTags(description);
          // Add proper line breaks and formatting
          description = formatJobDescription(description);
          // Limit description length for better display
          if (description.length > 500) {
            description = description.substring(0, 500) + '...';
          }
        }
        
        // Extract requirements array - try structured first, then parse from description
        const requirementsElement = jobElement.querySelector('requirements');
        let requirements: string[] = [];
        if (requirementsElement) {
          const requirementItems = requirementsElement.querySelectorAll('item');
          requirementItems.forEach((item) => {
            const text = item.textContent?.trim();
            if (text) requirements.push(text);
          });
        } else {
          // Try to extract requirements from description
          const fullDescription = getTextContent(jobElement, 'jobdescription') || 
                                 getTextContent(jobElement, 'jobdescription_400char') || 
                                 description || '';
          requirements = extractRequirementsFromText(fullDescription);
        }
        
        // Extract benefits array - try structured first, then parse from description
        const benefitsElement = jobElement.querySelector('benefits');
        let benefits: string[] = [];
        if (benefitsElement) {
          const benefitItems = benefitsElement.querySelectorAll('item');
          benefitItems.forEach((item) => {
            const text = item.textContent?.trim();
            if (text) benefits.push(text);
          });
        } else {
          // Try to extract benefits from description or provide defaults
          const fullDescription = getTextContent(jobElement, 'jobdescription') || 
                                 getTextContent(jobElement, 'jobdescription_400char') || 
                                 description || '';
          benefits = extractBenefitsFromText(fullDescription);
        }
        
        // Extract and parse dates
        let postedDateStr = getTextContent(jobElement, 'postedDate');
        if (!postedDateStr) {
          postedDateStr = getTextContent(jobElement, 'issuedate') || getTextContent(jobElement, 'startdate');
        }
        
        const applicationDeadlineStr = getTextContent(jobElement, 'applicationDeadline');
        let deadlineDate = applicationDeadlineStr;
        if (!deadlineDate) {
          deadlineDate = getTextContent(jobElement, 'enddate') || getTextContent(jobElement, 'endddate');
          // If no end date, set deadline to 30 days from posted date
          if (!deadlineDate && postedDateStr) {
            const posted = new Date(postedDateStr);
            const deadline = new Date(posted.getTime() + 30 * 24 * 60 * 60 * 1000);
            deadlineDate = deadline.toISOString();
          }
        }
        
        // Extract numeric values
        const viewsStr = getTextContent(jobElement, 'views');
        const applicationsStr = getTextContent(jobElement, 'applications');
        
        // --- START: Enhanced Logging and Type Coercion ---
        console.log('--- Extracted Values & Types ---');
        console.log(`ID: "${id}" (Type: ${typeof id})`);
        console.log(`Title: "${title}" (Type: ${typeof title})`);
        console.log(`Company: "${company}" (Type: ${typeof company})`);
        console.log(`Location: "${location}" (Type: ${typeof location})`);
        console.log(`Type: "${type}" (Type: ${typeof type})`);
        console.log(`Salary: "${salary}" (Type: ${typeof salary})`);
        console.log(`Description (length): ${description?.length || 0} (Type: ${typeof description})`);
        console.log(`Requirements (is array): ${Array.isArray(requirements)} (Length: ${requirements.length})`);
        console.log(`Benefits (is array): ${Array.isArray(benefits)} (Length: ${benefits.length})`);
        console.log(`Posted Date String: "${postedDateStr}" (Type: ${typeof postedDateStr})`);
        console.log(`Deadline Date String: "${deadlineDate}" (Type: ${typeof deadlineDate})`);
        console.log(`Views String: "${viewsStr}" (Type: ${typeof viewsStr})`);
        console.log(`Applications String: "${applicationsStr}" (Type: ${typeof applicationsStr})`);
        console.log(`JobDiva No: "${getTextContent(jobElement, 'jobdiva_no')}" (Type: ${typeof getTextContent(jobElement, 'jobdiva_no')})`);
        console.log(`Portal URL: "${getTextContent(jobElement, 'portal_url')}" (Type: ${typeof getTextContent(jobElement, 'portal_url')})`);
        console.log(`External URL: "${getTextContent(jobElement, 'externalUrl')}" (Type: ${typeof getTextContent(jobElement, 'externalUrl')})`);

        // Validate required fields
        if (!id || !title || !company || !location || !type) {
          console.warn('Skipping job with missing required fields:', { 
            id, 
            title, 
            company, 
            location, 
            type,
            salary: salary || 'missing',
            description: description || 'missing'
          });
          return;
        }
        
        // Create job object with explicit type casting
        const job: Job = {
          id: String(id),
          title: String(title),
          company: String(company),
          location: String(location || 'Location not specified'),
          type: type as Job['type'], // Type is already handled by switch, but ensure it's a valid Job['type']
          salary: String(salary || 'Salary not specified'),
          description: String(description || 'No description available'),
          requirements: Array.isArray(requirements) && requirements.length > 0 ? requirements.map(String) : ['Requirements not specified'],
          benefits: Array.isArray(benefits) && benefits.length > 0 ? benefits.map(String) : ['Benefits not specified'],
          postedDate: parseDate(postedDateStr),
          applicationDeadline: parseDate(deadlineDate),
          views: Number(viewsStr) || 0, // Explicitly cast to number
          applications: Number(applicationsStr) || 0, // Explicitly cast to number
          sourceCompany: String(sourceCompany || 'Quadrant, Inc.'),
          sourceXmlFile: String(sourceXmlFile || ''),
          externalJobId: String(getTextContent(jobElement, 'jobdiva_no') || id),
          externalUrl: (getTextContent(jobElement, 'portal_url') || getTextContent(jobElement, 'externalUrl')) || undefined // Keep as string | undefined
        };
        // --- END: Enhanced Logging and Type Coercion ---
        
        jobs.push(job);
      } catch (error) {
        console.error('Error parsing individual job:', error);
      }
    });
    
    return jobs;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
};

/**
 * Helper function to get text content from an XML element
 * @param parent - Parent XML element
 * @param tagName - Tag name to search for
 * @returns Text content or empty string
 */
const getTextContent = (parent: Element, tagName: string): string => {
  const element = parent.querySelector(tagName);
  if (!element) return '';
  
  // Ensure textContent is treated as a string, even if it's null/undefined
  const content = String(element.textContent || '').trim();
  
  // Handle CDATA sections by extracting the content
  if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
    return content.slice(9, -3).trim();
  }
  
  return content;
};

/**
 * Helper function to parse date strings
 * @param dateStr - Date string to parse
 * @returns Date object or current date if parsing fails
 */
const parseDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Extract salary information from text description
 * @param text - Text to search for salary information
 * @returns Extracted salary string or empty string
 */
const extractSalaryFromText = (text: string): string => {
  if (!text) return '';
  
  // Strip HTML tags for better text processing
  const cleanText = stripHtmlTags(text);
  
  // Common salary patterns
  const patterns = [
    /Pay From:\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:Annual\s+Salary|per\s+hour|\/hour|hourly|annually|\/year|per\s+year)?/i,
    /Pay:\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:-\s*\$?([\d,]+(?:\.\d{2})?))?(?:\s*Annual\s+Salary|per\s+hour|\/hour|hourly|annually|\/year|per\s+year)?/i,
    /Salary:\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:-\s*\$?([\d,]+(?:\.\d{2})?))?(?:\s*Annual\s+Salary|annually|\/year|per\s+year)?/i,
    /Rate:\s*\$?([\d,]+(?:\.\d{2})?)\s*(?:-\s*\$?([\d,]+(?:\.\d{2})?))?(?:\s*per\s+hour|\/hour|hourly)?/i,
    /\$?([\d,]+(?:\.\d{2})?)\s*(?:-\s*\$?([\d,]+(?:\.\d{2})?))?(?:\s*Annual\s+Salary|per\s+hour|\/hour|hourly)/i,
    /\$?([\d,]+(?:\.\d{2})?)\s*(?:-\s*\$?([\d,]+(?:\.\d{2})?))?(?:\s*annually|\/year|per\s+year)/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      if (match[2]) {
        // Range found
        const isHourly = /hour|hourly/i.test(match[0]) && !/annual/i.test(match[0]);
        const suffix = isHourly ? '/hour' : '';
        return `$${match[1]} - $${match[2]}${suffix}`;
      } else if (match[1]) {
        // Single value found
        const isHourly = /hour|hourly/i.test(match[0]) && !/annual/i.test(match[0]);
        const prefix = /from/i.test(match[0]) ? 'From ' : '';
        const suffix = isHourly ? '/hour' : '';
        return `${prefix}$${match[1]}${suffix}`;
      }
    }
  }
  
  return '';
};

/**
 * Extract requirements from text description
 * @param text - Text to search for requirements
 * @returns Array of requirement strings
 */
const extractRequirementsFromText = (text: string): string[] => {
  if (!text) return [];
  
  // Strip HTML tags for better text processing
  const cleanText = stripHtmlTags(text);
  
  const requirements: string[] = [];
  
  // Look for common requirement indicators
  const requirementSections = [
    /MUST:?\s*(.*?)(?=\n\n|\n[A-Z]+:|DUTIES:|$)/is,
    /Requirements?:?\s*(.*?)(?=\n\n|\n[A-Z]+:|DUTIES:|$)/is,
    /Qualifications?:?\s*(.*?)(?=\n\n|\n[A-Z]+:|DUTIES:|$)/is,
    /Experience?:?\s*(.*?)(?=\n\n|\n[A-Z]+:|DUTIES:|$)/is
  ];
  
  for (const pattern of requirementSections) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const sectionText = match[1].trim();
      
      // Split by bullet points, line breaks, or common separators
      const items = sectionText
        .split(/[•·▪▫◦‣⁃]\s*|^\s*[-*]\s*|\n\s*[-*•·▪▫◦‣⁃]\s*/gm)
        .map(item => item.trim())
        .filter(item => item.length > 0 && item.length < 200); // Filter out empty and overly long items
      
      if (items.length > 1) {
        requirements.push(...items);
        break; // Use the first matching section
      } else if (items.length === 1 && items[0].length > 20) {
        // If it's a single long requirement, try to split by sentences
        const sentences = items[0].split(/[.!?]\s+/).filter(s => s.trim().length > 10);
        if (sentences.length > 1) {
          requirements.push(...sentences.map(s => s.trim() + (s.endsWith('.') ? '' : '.')));
        } else {
          requirements.push(items[0]);
        }
        break;
      }
    }
  }
  
  return requirements.slice(0, 10); // Limit to 10 requirements max
};

/**
 * Extract benefits from text description or provide common defaults
 * @param text - Text to search for benefits
 * @returns Array of benefit strings
 */
const extractBenefitsFromText = (text: string): string[] => {
  if (!text) return getDefaultBenefits();
  
  // Strip HTML tags for better text processing
  const cleanText = stripHtmlTags(text);
  
  const benefits: string[] = [];
  
  // Look for common benefit indicators
  const benefitSections = [
    /Benefits?:?\s*(.*?)(?=\n\n|\n[A-Z]+:|$)/is,
    /Perks?:?\s*(.*?)(?=\n\n|\n[A-Z]+:|$)/is,
    /Offers?:?\s*(.*?)(?=\n\n|\n[A-Z]+:|$)/is
  ];
  
  for (const pattern of benefitSections) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const sectionText = match[1].trim();
      
      // Split by bullet points, line breaks, or common separators
      const items = sectionText
        .split(/[•·▪▫◦‣⁃]\s*|^\s*[-*]\s*|\n\s*[-*•·▪▫◦‣⁃]\s*|\n(?=\S)/gm)
        .map(item => item.trim())
        .filter(item => item.length > 5 && item.length < 200 && !item.match(/^(MUST|Requirements|Qualifications|Experience):?$/i));
      
      if (items.length > 0) {
        benefits.push(...items);
        break;
      }
    }
  }
  
  // If no benefits found, check for common benefit keywords in the text
  if (benefits.length === 0) {
    const benefitKeywords = [
      { pattern: /health\s+insurance|medical\s+coverage/i, benefit: 'Health insurance coverage' },
      { pattern: /dental\s+insurance/i, benefit: 'Dental insurance' },
      { pattern: /vision\s+insurance/i, benefit: 'Vision insurance' },
      { pattern: /401\s*k|retirement\s+plan/i, benefit: '401(k) retirement plan' },
      { pattern: /paid\s+time\s+off|PTO|vacation/i, benefit: 'Paid time off' },
      { pattern: /flexible\s+hours|flexible\s+schedule/i, benefit: 'Flexible work schedule' },
      { pattern: /remote\s+work|work\s+from\s+home/i, benefit: 'Remote work options' },
      { pattern: /professional\s+development|training/i, benefit: 'Professional development opportunities' }
    ];
    
    for (const { pattern, benefit } of benefitKeywords) {
      if (pattern.test(cleanText)) {
        benefits.push(benefit);
      }
    }
  }
  
  return benefits.length > 0 ? benefits.slice(0, 8) : getDefaultBenefits();
};

/**
 * Get default benefits when none can be extracted
 * @returns Array of default benefit strings
 */
const getDefaultBenefits = (): string[] => {
  return [
    'Competitive compensation package',
    'Professional development opportunities',
    'Collaborative work environment',
    'Growth and advancement potential'
  ];
};

/**
 * Fetches and parses multiple XML files with source company tracking
 * @param xmlSources - Array of XML sources with paths and company names
 * @returns Promise that resolves to combined array of Job objects
 */
export const fetchAndParseJobsXmlWithSources = async (xmlSources: XmlSource[]): Promise<Job[]> => {
  const allJobs: Job[] = [];
  
  for (const source of xmlSources) {
    try {
      console.log(`Fetching jobs from: ${source.path} (${source.company})`);
      const response = await fetch(source.path);
      
      if (!response.ok) {
        console.error(`Failed to fetch ${source.path}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const xmlContent = await response.text();
      console.log(`Raw XML content from ${source.path}:`, xmlContent.substring(0, 500) + '...');
      const jobs = parseJobsXml(xmlContent, source.company, source.path);
      
      console.log(`Loaded ${jobs.length} jobs from ${source.path} (${source.company})`);
      if (jobs.length > 0) {
        try {
          console.log(`First job from ${source.path}:`, JSON.stringify(jobs[0], null, 2));
        } catch (jsonError) {
          console.log(`First job from ${source.path} (could not stringify):`, jobs[0].id, jobs[0].title);
        }
      }
      
      allJobs.push(...jobs);
    } catch (error) {
      console.error(`Error fetching ${source.path}:`, error);
    }
  }
  
  console.log(`Total jobs from all XML files: ${allJobs.length}`);
  return allJobs;
};

/**
 * Strip HTML tags from text content
 * @param html - HTML string to clean
 * @returns Clean text without HTML tags
 */
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Replace HTML entities with their actual characters
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&') // Corrected: replace &amp; with &
    .replace(/&lt;/g, '<')   // Corrected: replace &lt; with <
    .replace(/&gt;/g, '>')   // Corrected: replace &gt; with >
    .replace(/&quot;/g, '"') // Corrected: replace &quot; with "
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Format job description for better readability
 * @param description - Raw description text
 * @returns Formatted description with proper line breaks
 */
const formatJobDescription = (description: string): string => {
  if (!description) return '';
  
  return description
    // Preserve existing line breaks and add strategic ones
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')   // Handle old Mac line endings
    
    // Add double line breaks before major sections
    .replace(/(Requirements?:?|Qualifications?:?|Experience?:?|MUST:?|Duties:?|Responsibilities?:?|Benefits?:?)/gi, '\n\n$1')
    
    // Add line breaks after sentences that clearly end paragraphs
    .replace(/([.!?])\s+([A-Z][^.!?]*[A-Z])/g, '$1\n\n$2') // After sentence before likely header
    .replace(/([.!?])\s+(Requirements?|Qualifications?|Experience?|MUST|Duties|Responsibilities|Benefits)/gi, '$1\n\n$2')
    
    // Ensure bullet points are on new lines
    .replace(/([.!?])\s*([•·▪▫◦‣⁃-]\s)/g, '$1\n$2')
    .replace(/([a-z])\s*([•·▪▫◦‣⁃-]\s)/g, '$1\n$2')
    
    // Ensure numbered lists are on new lines
    .replace(/([.!?])\s*(\d+\.?\s)/g, '$1\n$2')
    
    // Clean up excessive whitespace but preserve intentional breaks
    .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
    .replace(/\n[ \t]+/g, '\n') // Remove spaces after line breaks
    .replace(/[ \t]+\n/g, '\n') // Remove spaces before line breaks
    .replace(/\n{4,}/g, '\n\n\n') // Max 3 line breaks
    .trim();
};