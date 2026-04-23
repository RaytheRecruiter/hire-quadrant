import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';
import { Job, JobApplication } from '../types';

// Utility for debouncing function calls to prevent excessive API calls
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

// --- Job and Application Interfaces ---
// Fields below match what the Supabase `jobs` row returns. Optional fields
// are present when the job row has them populated (min_salary/max_salary,
// company_logo_url, screening_questions). Keep this type in sync with the
// select() lists in JobContext and anywhere jobs are loaded from Supabase.
export interface ScreeningQuestion {
    id?: string;
    prompt: string;
    required?: boolean;
    type?: 'text' | 'yes_no' | 'choice';
    options?: string[];
}

export interface Job {
    id: string;
    title: string;
    description: string;
    externalJobId: string;
    externalUrl?: string;
    postedDate: string;
    sourceCompany: string;
    sourceXmlFile?: string;
    company?: string;
    company_logo_url?: string | null;
    location?: string;
    type?: string;
    salary?: string;
    min_salary?: number | null;
    max_salary?: number | null;
    screening_questions?: ScreeningQuestion[] | null;
}

export interface JobApplication {
    id: string;
    job_id: string;
    user_id: string;
    status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
    applied_at: string;
    source_company?: string;
}

export interface ApplicationEEO {
    race_ethnicity?: string;
    gender?: string;
    disability?: string;
    veteran?: string;
}

export interface ApplicationDetails {
    coverLetter?: string;
    applicantName?: string;
    applicantEmail?: string;
    applicantPhone?: string;
    applicantFirstName?: string;
    applicantLastName?: string;
    applicantZip?: string;
    resumeUrl?: string;
    eeo?: ApplicationEEO;
    privacyAcceptedAt?: string;
}

interface JobContextType {
    jobs: Job[];
    applications: JobApplication[];
    loading: boolean;
    error: string | null;
    searchTerm: string;
    locationFilter: string;
    typeFilter: string;
    categoryFilter: string;
    minSalary: number;
    setSearchTerm: (term: string) => void;
    setLocationFilter: (location: string) => void;
    setTypeFilter: (type: string) => void;
    setCategoryFilter: (category: string) => void;
    setMinSalary: (value: number) => void;
    filteredJobs: Job[];
    allFilteredJobs: Job[];
    currentPage: number;
    totalPages: number;
    totalJobsCount: number;
    goToPage: (page: number) => void;
    loadMoreJobs: () => void;
    hasMoreJobs: boolean;
    applyToJob: (jobId: string, screeningAnswers?: any[], details?: ApplicationDetails) => Promise<boolean>;
    getJobById: (id: string) => Job | undefined;
    hasApplied: (jobId: string, userId: string) => boolean;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

// The missing useJobs hook
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
    const [categoryFilter, setCategoryFilter] = useState('');
    const [minSalary, setMinSalary] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
    const jobsPerPage = 10;

    const { user } = useAuth();

    // Debounce the search term to avoid excessive API calls on every keystroke
    const debouncedSetSearchTerm = useMemo(() => debounce((term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);
    }, 500), []);

    const handleSetLocationFilter = useCallback((location: string) => {
        setLocationFilter(location);
        setCurrentPage(1);
    }, []);

    const handleSetTypeFilter = useCallback((type: string) => {
        setTypeFilter(type);
        setCurrentPage(1);
    }, []);

    const handleSetCategoryFilter = useCallback((category: string) => {
        setCategoryFilter(category);
        setCurrentPage(1);
    }, []);

    const handleSetMinSalary = useCallback((value: number) => {
        setMinSalary(value);
        setCurrentPage(1);
    }, []);

    // Main effect to fetch jobs with server-side filtering and pagination
    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            setError(null);

            try {
                let query = supabase
                    .from('jobs')
                    .select('id, title, company, location, type, salary, posted_date, external_job_id, external_url, source_company, source_xml_file', { count: 'exact' });

                // Add filters to the query for server-side processing
                if (searchTerm) {
                    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
                }
                if (locationFilter) {
                    query = query.ilike('location', `%${locationFilter}%`);
                }
                if (typeFilter) {
                    query = query.eq('type', typeFilter);
                }
                if (categoryFilter) {
                    query = query.eq('category', categoryFilter);
                }
                if (minSalary > 0) {
                    query = query.gte('min_salary', minSalary);
                }

                // Add pagination
                const from = (currentPage - 1) * jobsPerPage;
                const to = from + jobsPerPage - 1;
                const { data, error, count } = await query.range(from, to);

                if (error) {
                    throw error;
                }

                if (data) {
                    setJobs(data as Job[]);
                    // Use exact count from Supabase
                    if (count !== null) {
                        setTotalJobsCount(count);
                    }
                }
            } catch (err) {
                console.error('Error fetching jobs:', err);
                setError('Failed to fetch jobs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [searchTerm, locationFilter, typeFilter, categoryFilter, minSalary, currentPage]); // Rerun when filters or page change

    // Fetch applications whenever the user state changes
    useEffect(() => {
        const fetchApplications = async () => {
            if (!user) {
                setApplications([]);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('job_applications')
                    .select('*')
                    .eq('user_id', user.id);
                if (error) {
                    throw error;
                }
                if (data) {
                    setApplications(data as JobApplication[]);
                }
            } catch (err) {
                console.error('Error fetching applications:', err.message);
            }
        };

        fetchApplications();
    }, [user]);

    // This is now redundant since filtering is done on the server, but kept for compatibility
    const allFilteredJobs = useMemo(() => jobs, [jobs]);
    const filteredJobs = useMemo(() => jobs, [jobs]);

    const totalPages = Math.max(1, Math.ceil(totalJobsCount / jobsPerPage));
    const hasMoreJobs = currentPage < totalPages;

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const loadMoreJobs = useCallback(() => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    }, [currentPage, totalPages]);

    const applyToJob = useCallback(async (jobId: string, screeningAnswers?: any[], details?: ApplicationDetails) => {
        if (!user) {
            console.error('User not logged in.');
            return false;
        }

        try {
            const job = jobs.find(j => j.id === jobId);
            const newApplication: JobApplication = {
                id: `app-${user.id}-${jobId}-${Date.now()}`,
                job_id: jobId,
                user_id: user.id,
                status: 'Applied',
                applied_at: new Date().toISOString(),
                source_company: job?.sourceCompany
            };

            const eeoHasAny = details?.eeo && Object.values(details.eeo).some((v) => v && v.trim());
            const { data, error } = await supabase
                .from('job_applications')
                .insert([{
                    ...newApplication,
                    user_name: details?.applicantName?.trim() || user.name,
                    user_email: details?.applicantEmail?.trim() || user.email,
                    applicant_first_name: details?.applicantFirstName?.trim() || null,
                    applicant_last_name: details?.applicantLastName?.trim() || null,
                    applicant_phone: details?.applicantPhone?.trim() || null,
                    applicant_zip: details?.applicantZip?.trim() || null,
                    resume_url: details?.resumeUrl || null,
                    cover_letter: details?.coverLetter?.trim() || null,
                    eeo_responses: eeoHasAny ? details!.eeo : null,
                    privacy_accepted_at: details?.privacyAcceptedAt || null,
                    screening_answers: screeningAnswers || [],
                }])
                .select()
                .single();

            if (error) {
                throw error;
            }
            
            if (data) {
                // Update local state directly for immediate UI feedback
                setApplications(prevApplications => [...prevApplications, data as JobApplication]);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error applying to job:', error.message);
            const fallbackApplication: JobApplication = {
                id: `app-${Date.now()}`,
                job_id: jobId,
                user_id: user.id,
                status: 'Applied',
                applied_at: new Date().toISOString()
            };
            const updatedApplications = [...applications, fallbackApplication];
            setApplications(updatedApplications);
            localStorage.setItem('applications', JSON.stringify(updatedApplications));
            return false;
        }
    }, [user, jobs, applications]);

    const getJobById = useCallback((id: string) => {
        return jobs.find(job => job.id === id);
    }, [jobs]);

    const hasApplied = useCallback((jobId: string, userId: string) => {
        return applications.some(app => app.job_id === jobId && app.user_id === userId);
    }, [applications]);

    const value = useMemo<JobContextType>(() => ({
        jobs,
        applications,
        loading,
        error,
        searchTerm,
        locationFilter,
        typeFilter,
        categoryFilter,
        minSalary,
        setSearchTerm: debouncedSetSearchTerm,
        setLocationFilter: handleSetLocationFilter,
        setTypeFilter: handleSetTypeFilter,
        setCategoryFilter: handleSetCategoryFilter,
        setMinSalary: handleSetMinSalary,
        filteredJobs,
        allFilteredJobs,
        currentPage,
        totalPages,
        totalJobsCount,
        goToPage,
        loadMoreJobs,
        hasMoreJobs,
        applyToJob,
        getJobById,
        hasApplied
    }), [
        jobs, applications, loading, error,
        searchTerm, locationFilter, typeFilter, categoryFilter, minSalary,
        filteredJobs, allFilteredJobs,
        currentPage, totalPages, totalJobsCount, hasMoreJobs,
        debouncedSetSearchTerm, handleSetLocationFilter, handleSetTypeFilter, handleSetCategoryFilter, handleSetMinSalary,
        goToPage, loadMoreJobs, applyToJob, getJobById, hasApplied,
    ]);

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
