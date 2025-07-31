import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAndParseJobsXmlWithSources } from '../utils/xmlParser';
import { TrackingService } from '../utils/trackingService';
import { useCompanies } from './CompanyContext';
import { getSupabaseClient } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'contract-to-hire' | 'internship';
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: Date;
  applicationDeadline: Date;
  views: number;
  applications: number;
  sourceCompany?: string; // The company that provided this job listing
  sourceXmlFile?: string; // The XML file this job came from
  externalJobId?: string; // Original job ID from the source company
  externalUrl?: string; // Link back to the original job posting
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  userEmail: string;
  appliedAt: Date;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  sourceCompany?: string; // Track which company this application is for
  notifiedSourceCompany?: boolean; // Track if source company was notified
}

interface JobContextType {
  jobs: Job[];
  applications: JobApplication[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  locationFilter: string;
  typeFilter: string;
  setSearchTerm: (term: string) => void;
  setLocationFilter: (location: string) => void;
  setTypeFilter: (type: string) => void;
  filteredJobs: Job[];
  allFilteredJobs: Job[];
  jobsDisplayLimit: number;
  loadMoreJobs: () => void;
  hasMoreJobs: boolean;
  applyToJob: (jobId: string, userId: string, userName: string, userEmail: string) => void;
  incrementJobViews: (jobId: string) => void;
  resetAllStats: () => void;
  getJobById: (id: string) => Job | undefined;
  hasApplied: (jobId: string, userId: string) => boolean;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};

interface JobProviderProps {
  children: ReactNode;
}

export const JobProvider: React.FC<JobProviderProps> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [jobsDisplayLimit, setJobsDisplayLimit] = useState(20);
  const { user } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing TrackingService...');
        // Initialize tracking service
        await TrackingService.initialize();
        
        // Add callback for real-time updates
        const updateCallback = () => {
          console.log('TrackingService update callback triggered');
          // Update jobs with latest tracking data
          setJobs(prevJobs => 
            prevJobs.map(job => ({
              ...job,
              views: TrackingService.getJobViews(job.id),
              applications: TrackingService.getJobApplications(job.id)
            }))
          );
        };
        
        TrackingService.addUpdateCallback(updateCallback);
        console.log('TrackingService initialized successfully');
        
        // Cleanup callback on unmount
        return () => {
          TrackingService.removeUpdateCallback(updateCallback);
        };
      } catch (error) {
        console.warn('Error initializing tracking service:', error);
        // Don't show error to user for tracking issues
      }
    };
    
    const loadJobs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load applications from Supabase if available, otherwise fallback to localStorage
        const supabase = getSupabaseClient();
        if (supabase && user) {
          try {
            const { data: supabaseApplications, error: appsError } = await supabase
              .from('job_applications')
              .select('*')
              .eq('user_id', user.id);

            if (!appsError && supabaseApplications) {
              const formattedApplications: JobApplication[] = supabaseApplications.map(app => ({
                id: app.id,
                jobId: app.job_id,
                userId: app.user_id,
                userName: app.user_name,
                userEmail: app.user_email,
                appliedAt: new Date(app.applied_at),
                status: app.status,
                sourceCompany: app.source_company,
                notifiedSourceCompany: app.notified_source_company
              }));
              setApplications(formattedApplications);
            }
          } catch (error) {
            console.warn('Error loading applications from Supabase, falling back to localStorage:', error);
            const storedApplications = localStorage.getItem('applications');
            if (storedApplications) {
              setApplications(JSON.parse(storedApplications));
            }
          }
        } else {
          // Fallback to localStorage
          const storedApplications = localStorage.getItem('applications');
          if (storedApplications) {
            setApplications(JSON.parse(storedApplications));
          }
        }
        
        // Load fresh data from XML files
        const xmlSources = [
          { path: 'https://www2.jobdiva.com/candidates/myjobs/getportaljobs.jsp?a=t4jdnwtrvhrp7whbngaxrc4vr24k9x01b8hjdt9a1o9wgnbvpbmubd0bvi6lblsl', company: 'Quadrant, Inc.' },
        ];
        
        console.log('Attempting to load XML files:', xmlSources);
        const xmlJobs = await fetchAndParseJobsXmlWithSources(xmlSources);
        console.log('Total jobs loaded from XML files:', xmlJobs.length);
        
        if (xmlJobs.length > 0) {
          // Auto-generate company profiles for XML feed companies
          await autoGenerateCompanyProfiles(xmlSources, xmlJobs);
          
          console.log(`Successfully loaded ${xmlJobs.length} jobs from XML files`);
          
          // Wait for TrackingService to be initialized
          await TrackingService.initialize();
          
          // Apply tracking data to jobs
          const jobsWithTracking = xmlJobs.map(job => ({
            ...job,
            views: TrackingService.getJobViews(job.id),
            applications: TrackingService.getJobApplications(job.id)
          }));
          
          setJobs(jobsWithTracking);
          console.log('Jobs loaded with tracking data:', jobsWithTracking.length);
        } else {
          console.warn('No jobs could be loaded from XML files or localStorage');
          setError('No jobs could be loaded. Please check that the XML files are available.');
        }
      } catch (err) {
        console.error('Error loading jobs:', err);
        setError('Failed to load jobs. Please check your connection and try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initializeApp();
    loadJobs();
    
    // Cleanup on unmount
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
      TrackingService.cleanup();
    };
  }, []);

  // Auto-generate company profiles for companies with XML feeds
  const autoGenerateCompanyProfiles = async (xmlSources: any[], jobs: Job[]) => {
    try {
      const existingProfiles = JSON.parse(localStorage.getItem('company_profiles') || '[]');
      const existingCompanyNames = existingProfiles.map((profile: any) => profile.name.toLowerCase());
      
      const newProfiles = [];
      
      // Process each XML source
      for (const source of xmlSources) {
        const companyName = source.company;
        const companyJobs = jobs.filter(job => 
          job.sourceCompany === companyName || 
          job.company === companyName
        );
        
        // Skip if company profile already exists
        if (existingCompanyNames.includes(companyName.toLowerCase())) {
          continue;
        }
        
        // Generate company profile based on job data
        const profile = generateCompanyProfileFromJobs(companyName, source.path, companyJobs);
        newProfiles.push(profile);
      }
      
      // Save new profiles if any were created
      if (newProfiles.length > 0) {
        const updatedProfiles = [...existingProfiles, ...newProfiles];
        localStorage.setItem('company_profiles', JSON.stringify(updatedProfiles));
        console.log(`Auto-generated ${newProfiles.length} company profiles`);
      }
    } catch (error) {
      console.error('Error auto-generating company profiles:', error);
    }
  };

  // Generate a company profile based on job data
  const generateCompanyProfileFromJobs = (companyName: string, xmlPath: string, jobs: Job[]) => {
    // Analyze jobs to extract company information
    const locations = [...new Set(jobs.map(job => job.location))];
    const industries = [...new Set(jobs.map(job => {
      // Infer industry from job titles
      const title = job.title.toLowerCase();
      if (title.includes('software') || title.includes('developer') || title.includes('engineer')) return 'Technology';
      if (title.includes('nurse') || title.includes('medical') || title.includes('clinical')) return 'Healthcare';
      if (title.includes('marketing') || title.includes('sales')) return 'Marketing & Sales';
      if (title.includes('manager') || title.includes('project')) return 'Management';
      return 'Professional Services';
    }))];
    
    const jobTypes = [...new Set(jobs.map(job => job.type))];
    const primaryLocation = locations[0] || 'Multiple Locations';
    const primaryIndustry = industries[0] || 'Professional Services';
    
    // Generate specialties based on job titles
    const specialties = [...new Set(jobs.map(job => {
      const title = job.title.toLowerCase();
      if (title.includes('software') || title.includes('developer')) return 'Software Development';
      if (title.includes('nurse') || title.includes('nursing')) return 'Nursing Services';
      if (title.includes('clinical')) return 'Clinical Services';
      if (title.includes('project') && title.includes('manager')) return 'Project Management';
      if (title.includes('marketing')) return 'Marketing';
      if (title.includes('sales')) return 'Sales';
      if (title.includes('engineer')) return 'Engineering';
      return 'Professional Staffing';
    }))].slice(0, 5);
    
    // Generate description based on company data
    const description = generateCompanyDescription(companyName, primaryIndustry, specialties, locations.length);
    
    return {
      id: `auto-${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: companyName,
      displayName: companyName,
      description,
      website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      logo: getCompanyLogo(companyName),
      industry: primaryIndustry,
      size: jobs.length > 20 ? '200+ employees' : jobs.length > 10 ? '50-200 employees' : '10-50 employees',
      location: primaryLocation,
      founded: new Date().getFullYear() - Math.floor(Math.random() * 20 + 5).toString(), // Random founding year
      specialties,
      benefits: generateCompanyBenefits(primaryIndustry),
      culture: generateCompanyCulture(companyName, primaryIndustry),
      xmlFeedPath: xmlPath,
      contactEmail: `careers@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  // Generate company description
  const generateCompanyDescription = (companyName: string, industry: string, specialties: string[], locationCount: number) => {
    const locationText = locationCount > 1 ? 'multiple locations' : 'our location';
    const specialtyText = specialties.length > 0 ? specialties.slice(0, 3).join(', ') : 'various professional services';
    
    return `${companyName} is a leading ${industry.toLowerCase()} company specializing in ${specialtyText}. We connect top talent with innovative organizations across ${locationText}, providing personalized recruitment solutions and building long-term partnerships. Our team is dedicated to matching the right candidates with the right opportunities, ensuring success for both job seekers and employers.`;
  };

  // Get company logo based on company name
  const getCompanyLogo = (companyName: string) => {
    // Use a professional stock photo that represents the company
    const logoOptions = [
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
      'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=400'
    ];
    
    // Use company name to consistently select the same logo
    const index = companyName.length % logoOptions.length;
    return logoOptions[index];
  };

  // Generate company benefits based on industry
  const generateCompanyBenefits = (industry: string) => {
    const baseBenefits = [
      'Competitive compensation packages',
      'Comprehensive health benefits',
      'Professional development opportunities',
      'Flexible work arrangements'
    ];
    
    const industryBenefits = {
      'Technology': ['Stock options', 'Remote work options', 'Tech conference attendance'],
      'Healthcare': ['Medical coverage', 'Continuing education support', 'Certification reimbursement'],
      'Marketing & Sales': ['Performance bonuses', 'Client entertainment budget', 'Creative project opportunities'],
      'Management': ['Leadership training', 'Executive coaching', 'Strategic planning involvement']
    };
    
    return [...baseBenefits, ...(industryBenefits[industry] || ['Career advancement support', 'Team building activities'])];
  };

  // Generate company culture description
  const generateCompanyCulture = (companyName: string, industry: string) => {
    const cultureTemplates = {
      'Technology': 'We foster an innovative environment where creativity and technical excellence thrive. Our culture emphasizes continuous learning, collaboration, and pushing the boundaries of what\'s possible.',
      'Healthcare': 'We are committed to making a positive impact in healthcare by connecting skilled professionals with meaningful opportunities. Our culture values compassion, excellence, and dedication to improving patient outcomes.',
      'Marketing & Sales': 'We believe in the power of creative thinking and strategic execution. Our culture encourages bold ideas, data-driven decisions, and building lasting relationships with clients and candidates.',
      'Management': 'We cultivate leadership at every level and believe in empowering our team members to make impactful decisions. Our culture emphasizes strategic thinking, mentorship, and driving organizational success.'
    };
    
    return cultureTemplates[industry] || `At ${companyName}, we foster a collaborative environment where innovation thrives and every team member is valued. Our culture emphasizes work-life balance, continuous learning, and making a positive impact in the communities we serve.`;
  };

  // Reset display limit when filters change
  React.useEffect(() => {
    setJobsDisplayLimit(20);
  }, [searchTerm, locationFilter, typeFilter]);

  const allFilteredJobs = React.useMemo(() => {
    console.log('Computing filtered jobs with filters:', { searchTerm, locationFilter, typeFilter });
    
    const filtered = jobs.filter(job => {
      console.log('Filtering job:', job.title, 'with filters:', { searchTerm, locationFilter, typeFilter });
      
      const matchesSearch = !searchTerm || (() => {
        const trimmedSearchTerm = searchTerm.toLowerCase().trim();
        
        // Check if search term contains spaces (multi-word query) 
        if (trimmedSearchTerm.includes(' ')) {
          // For multi-word queries, prioritize exact phrase match in job title
          return job.title.toLowerCase().includes(trimmedSearchTerm);
        } else {
          // For single word queries, search across all job fields
          const searchableText = [
            job.title,
            job.company,
            job.description,
            job.location,
            job.type,
            job.salary,
            job.sourceCompany || '',
            ...job.requirements,
            ...job.benefits
          ].join(' ').toLowerCase();
          
          return searchableText.includes(trimmedSearchTerm);
        }
      })();
      
      const matchesLocation = !locationFilter || 
                             job.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesType = !typeFilter || job.type === typeFilter;

      const matches = matchesSearch && matchesLocation && matchesType;
      console.log('Job matches:', matches, { matchesSearch, matchesLocation, matchesType });
      
      return matches;
    });

    console.log('Filter results:', {
      searchTerm,
      locationFilter,
      typeFilter,
      totalJobs: jobs.length,
      filteredJobs: filtered.length
    });
    
    return filtered;
  }, [jobs, searchTerm, locationFilter, typeFilter]);

  const filteredJobs = React.useMemo(() => {
    return allFilteredJobs.slice(0, jobsDisplayLimit);
  }, [allFilteredJobs, jobsDisplayLimit]);

  const loadMoreJobs = () => {
    setJobsDisplayLimit(prev => prev + 20);
  };

  const hasMoreJobs = allFilteredJobs.length > jobsDisplayLimit;
  const applyToJob = (jobId: string, userId: string, userName: string, userEmail: string) => {
    const job = jobs.find(j => j.id === jobId);
    const newApplication: JobApplication = {
      id: Date.now().toString(),
      jobId,
      userId,
      userName,
      userEmail,
      appliedAt: new Date(),
      status: 'pending',
      sourceCompany: job?.sourceCompany,
      notifiedSourceCompany: false
    };

    // Save to Supabase if available, otherwise fallback to localStorage
    const supabase = getSupabaseClient();
    if (supabase && user) {
      supabase
        .from('job_applications')
        .insert({
          id: newApplication.id,
          job_id: newApplication.jobId,
          user_id: newApplication.userId,
          user_name: newApplication.userName,
          user_email: newApplication.userEmail,
          applied_at: newApplication.appliedAt.toISOString(),
          status: newApplication.status,
          source_company: newApplication.sourceCompany,
          notified_source_company: newApplication.notifiedSourceCompany
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error saving application to Supabase:', error);
            // Fallback to localStorage
            const updatedApplications = [...applications, newApplication];
            setApplications(updatedApplications);
            localStorage.setItem('applications', JSON.stringify(updatedApplications));
          } else {
            const updatedApplications = [...applications, newApplication];
            setApplications(updatedApplications);
          }
        });
    } else {
      // Fallback to localStorage
      const updatedApplications = [...applications, newApplication];
      setApplications(updatedApplications);
      localStorage.setItem('applications', JSON.stringify(updatedApplications));
    }

    // Update tracking service (async)
    TrackingService.incrementJobApplications(jobId).catch(error => {
      console.error('Error updating application tracking:', error);
    });
    
    // Update local job state
    const updatedJobs = jobs.map(job => 
      job.id === jobId 
        ? { ...job, applications: TrackingService.getJobApplications(jobId) }
        : job
    );
    setJobs(updatedJobs);
  };

  const incrementJobViews = (jobId: string) => {
    console.log(`Incrementing views for job ${jobId} from JobContext`);
    // Update tracking service (async)
    TrackingService.incrementJobViews(jobId).catch(error => {
      console.error('Error updating view tracking:', error);
    });
    
    // Update local job state
    const updatedJobs = jobs.map(job => 
      job.id === jobId 
        ? { ...job, views: TrackingService.getJobViews(jobId) }
        : job
    );
    setJobs(updatedJobs);
  };

  const resetAllStats = () => {
    // Reset tracking service (async)
    TrackingService.resetAllStats().catch(error => {
      console.error('Error resetting tracking stats:', error);
    });
    
    // Reset applications
    setApplications([]);
    localStorage.removeItem('applications');
    
    // Update jobs with reset stats
    const updatedJobs = jobs.map(job => ({
      ...job,
      views: 0,
      applications: 0
    }));
    setJobs(updatedJobs);
  };

  const getJobById = (id: string) => {
    return jobs.find(job => job.id === id);
  };

  const hasApplied = (jobId: string, userId: string) => {
    return applications.some(app => app.jobId === jobId && app.userId === userId);
  };

  const value: JobContextType = {
    jobs,
    applications,
    loading,
    error,
    searchTerm,
    locationFilter,
    typeFilter,
    setSearchTerm,
    setLocationFilter,
    setTypeFilter,
    filteredJobs,
    allFilteredJobs,
    jobsDisplayLimit,
    loadMoreJobs,
    hasMoreJobs,
    applyToJob,
    incrementJobViews,
    resetAllStats,
    getJobById,
    hasApplied
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};