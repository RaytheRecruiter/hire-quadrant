import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// REMOVE: import { fetchAndParseJobsXmlWithSources } from '../utils/xmlParser'; // <-- REMOVE THIS LINE
// REMOVE: import { TrackingService } from '../utils/trackingService'; // <-- Remove this unless you are truly using a browser-compatible tracking service
import { useCompanies } from './CompanyContext'; // Keep if used for other company data
import { supabase } from '../utils/supabaseClient'; // Make sure this path is correct: src/utils/supabaseClient.ts
import { useAuth } from './AuthContext'; // Keep if you use user info for applications

// --- Job and Application Interfaces ---
// Ensure this matches your Supabase 'jobs' table column names and types
export interface Job {
    id: string; // This is the UUID from Supabase
    title: string;
    description: string;
    externalJobId: string; // Original ID from the source XML (now from Supabase)
    externalUrl?: string; // Link to the original posting
    postedDate: string; // Supabase stores timestamps as strings
    sourceCompany: string; // Company that provided the job
    sourceXmlFile?: string; // Original XML file (now from Supabase)
    // Add other fields from your Supabase 'jobs' table if they exist
    company?: string; // If you have a separate 'company' field in Supabase for the company name
    location?: string;
    type?: string; // e.g., 'full-time'
    salary?: string;
    // Remove if not directly stored in Supabase 'jobs' table
    // requirements?: string[];
    // benefits?: string[];
    // views?: number; // These will be tracked separately, not direct DB columns for 'jobs'
    // applications?: number; // Same as views
    // applicationDeadline?: string; // If this is a direct column
}

// Ensure this matches your Supabase 'job_applications' table column names and types
export interface JobApplication {
    id: string; // UUID from Supabase
    job_id: string; // Matches Job.id (or externalJobId, check your schema)
    user_id: string; // User ID from AuthContext
    user_name: string;
    user_email: string;
    applied_at: string; // Supabase stores timestamps as strings
    status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
    source_company?: string;
    notified_source_company?: boolean;
}


// --- Job Context Type ---
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
    applyToJob: (jobId: string, userId: string, userName: string, userEmail: string) => Promise<void>; // Make async
    // REMOVE: incrementJobViews: (jobId: string) => void; // Tracking should be external or removed if not implemented
    // REMOVE: resetAllStats: () => void; // Tracking should be external or removed if not implemented
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
    const { user } = useAuth(); // Assuming useAuth provides the current user

    // --- Main Job Data Fetching Effect ---
    useEffect(() => {
        const fetchAllJobsAndApplications = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch Jobs from Supabase
                console.log('Fetching jobs from Supabase...');
                const { data: supabaseJobs, error: jobsError } = await supabase
                    .from('jobs')
                    .select('*') // Select all columns
                    .order('postedDate', { ascending: false });

                if (jobsError) {
                    setError(jobsError.message);
                    console.error('Error fetching jobs from Supabase:', jobsError);
                    return; // Stop if jobs cannot be fetched
                }

                if (supabaseJobs) {
                    // Map fetched data to your Job interface, if needed
                    const formattedJobs: Job[] = supabaseJobs.map((job: any) => ({
                        id: job.id,
                        title: job.title,
                        description: job.description,
                        externalJobId: job.externalJobId,
                        externalUrl: job.externalUrl,
                        postedDate: job.postedDate, // Keep as string
                        sourceCompany: job.sourceCompany,
                        sourceXmlFile: job.sourceXmlFile,
                        company: job.company, // Assuming these exist in your Supabase table
                        location: job.location,
                        type: job.type,
                        salary: job.salary,
                        // views and applications should come from your tracking solution or separate tables if needed
                    }));
                    setJobs(formattedJobs);
                    console.log(`Successfully loaded ${formattedJobs.length} jobs from Supabase.`);
                } else {
                    setJobs([]); // No jobs found
                    console.log('No jobs found in Supabase.');
                }

                // 2. Fetch Applications from Supabase (if user is logged in)
                if (user) {
                    console.log('Fetching user applications from Supabase...');
                    const { data: supabaseApplications, error: appsError } = await supabase
                        .from('job_applications')
                        .select('*')
                        .eq('user_id', user.id); // Filter by current user's ID

                    if (appsError) {
                        console.warn('Error loading applications from Supabase:', appsError.message);
                        // Fallback to localStorage if Supabase fails for applications
                        const storedApplications = localStorage.getItem('applications');
                        if (storedApplications) {
                            setApplications(JSON.parse(storedApplications));
                            console.log('Loaded applications from localStorage (Supabase fallback).');
                        }
                    } else if (supabaseApplications) {
                        const formattedApplications: JobApplication[] = supabaseApplications.map((app: any) => ({
                            id: app.id,
                            job_id: app.job_id,
                            user_id: app.user_id,
                            user_name: app.user_name,
                            user_email: app.user_email,
                            applied_at: app.applied_at,
                            status: app.status,
                            source_company: app.source_company,
                            notified_source_company: app.notified_source_company
                        }));
                        setApplications(formattedApplications);
                        console.log(`Loaded ${formattedApplications.length} applications from Supabase.`);
                    }
                } else {
                    // If no user, load applications from localStorage (for anonymous tracking)
                    const storedApplications = localStorage.getItem('applications');
                    if (storedApplications) {
                        setApplications(JSON.parse(storedApplications));
                        console.log('Loaded applications from localStorage (no user).');
                    }
                }

            } catch (err: any) {
                console.error('An unexpected error occurred during job/application loading:', err);
                setError('Failed to load jobs and applications. Please try refreshing the page.');
            } finally {
                setLoading(false);
            }
        };

        // Execute the main fetching function
        fetchAllJobsAndApplications();

        // No cleanup return needed for simple data fetching unless you add real-time subscriptions

    }, [user]); // Re-run when user changes (e.g., login/logout)

    // --- Filter and Pagination Logic (kept mostly as is) ---
    // Reset display limit when filters change
    React.useEffect(() => {
        setJobsDisplayLimit(20);
    }, [searchTerm, locationFilter, typeFilter]);

    const allFilteredJobs = React.useMemo(() => {
        // console.log('Computing filtered jobs with filters:', { searchTerm, locationFilter, typeFilter }); // Debugging logs
        const filtered = jobs.filter(job => {
            const matchesSearch = !searchTerm || (() => {
                const trimmedSearchTerm = searchTerm.toLowerCase().trim();
                if (trimmedSearchTerm.includes(' ')) {
                    return job.title.toLowerCase().includes(trimmedSearchTerm);
                } else {
                    const searchableText = [
                        job.title,
                        job.company || '', // Handle optional
                        job.description,
                        job.location || '', // Handle optional
                        job.type || '',     // Handle optional
                        job.salary || '',   // Handle optional
                        job.sourceCompany || '',
                        // Removed requirements/benefits as they might not be direct DB columns
                    ].join(' ').toLowerCase();
                    return searchableText.includes(trimmedSearchTerm);
                }
            })();

            const matchesLocation = !locationFilter || (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
            const matchesType = !typeFilter || (job.type && job.type.toLowerCase() === typeFilter.toLowerCase()); // Ensure type comparison is case-insensitive if needed

            return matchesSearch && matchesLocation && matchesType;
        });
        // console.log('Filter results:', { filteredJobs: filtered.length }); // Debugging logs
        return filtered;
    }, [jobs, searchTerm, locationFilter, typeFilter]);

    const filteredJobs = React.useMemo(() => {
        return allFilteredJobs.slice(0, jobsDisplayLimit);
    }, [allFilteredJobs, jobsDisplayLimit]);

    const loadMoreJobs = () => {
        setJobsDisplayLimit(prev => prev + 20);
    };

    const hasMoreJobs = allFilteredJobs.length > jobsDisplayLimit;

    // --- Job Application Logic ---
    const applyToJob = async (jobId: string, userId: string, userName: string, userEmail: string) => {
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            console.error(`Job with ID ${jobId} not found.`);
            return;
        }

        const newApplication: JobApplication = {
            id: crypto.randomUUID(), // Use crypto.randomUUID() for unique ID
            job_id: jobId,
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            applied_at: new Date().toISOString(), // Store as ISO string
            status: 'pending',
            source_company: job?.sourceCompany,
            notified_source_company: false
        };

        try {
            const { error: insertError } = await supabase
                .from('job_applications')
                .insert({
                    id: newApplication.id,
                    job_id: newApplication.job_id,
                    user_id: newApplication.user_id,
                    user_name: newApplication.user_name,
                    user_email: newApplication.user_email,
                    applied_at: newApplication.applied_at,
                    status: newApplication.status,
                    source_company: newApplication.source_company,
                    notified_source_company: newApplication.notified_source_company
                });

            if (insertError) {
                console.error('Error saving application to Supabase:', insertError);
                // Fallback to localStorage if Supabase insertion fails
                const updatedApplications = [...applications, newApplication];
                setApplications(updatedApplications);
                localStorage.setItem('applications', JSON.stringify(updatedApplications));
            } else {
                // If Supabase insert is successful, update local state
                setApplications(prevApps => [...prevApps, newApplication]);
                console.log('Application saved to Supabase successfully.');
            }
        } catch (error) {
            console.error('Unexpected error during application submission:', error);
            // Fallback to localStorage if unexpected error
            const updatedApplications = [...applications, newApplication];
            setApplications(updatedApplications);
            localStorage.setItem('applications', JSON.stringify(updatedApplications));
        }
    };

    // Removed TrackingService calls and related functions for simplicity and to prevent Node.js dependency issues
    // If you need tracking (views, applications count), you'll need to implement a separate, browser-compatible tracking system
    // that might write to a different Supabase table or use a dedicated analytics service.

    const getJobById = (id: string) => {
        return jobs.find(job => job.id === id);
    };

    const hasApplied = (jobId: string, userId: string) => {
        return applications.some(app => app.job_id === jobId && app.user_id === userId); // Changed jobId to job_id to match interface
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
        // Removed incrementJobViews and resetAllStats
        getJobById,
        hasApplied
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};