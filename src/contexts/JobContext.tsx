import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient'; // Corrected import path
import { useAuth } from './AuthContext';
import { Job, JobApplication } from '../types';

// --- Job and Application Interfaces ---
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
    location?: string;
    type?: string;
    salary?: string;
}

export interface JobApplication {
    id: string;
    job_id: string;
    user_id: string;
    status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
    applied_at: string;
    source_company?: string;
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
    applyToJob: (jobId: string) => Promise<boolean>;
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
    const [jobsDisplayLimit, setJobsDisplayLimit] = useState(10);

    const { user } = useAuth();

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*');

                if (error) {
                    throw error;
                }

                if (data) {
                    setJobs(data as Job[]);
                }
            } catch (err: any) {
                console.error('Error fetching jobs:', err.message);
                setError('Failed to fetch jobs. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        const fetchApplications = async () => {
            if (!user) return;
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
            } catch (err: any) {
                console.error('Error fetching applications:', err.message);
            }
        };

        fetchJobs();
        fetchApplications();
    }, [user]);

    const allFilteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesLocation = locationFilter === '' || (job.location?.toLowerCase() || '').includes(locationFilter.toLowerCase());
            const matchesType = typeFilter === '' || job.type === typeFilter;
            return matchesSearch && matchesLocation && matchesType;
        });
    }, [jobs, searchTerm, locationFilter, typeFilter]);

    const filteredJobs = useMemo(() => {
        return allFilteredJobs.slice(0, jobsDisplayLimit);
    }, [allFilteredJobs, jobsDisplayLimit]);

    const hasMoreJobs = jobsDisplayLimit < allFilteredJobs.length;

    const loadMoreJobs = () => {
        setJobsDisplayLimit(prevLimit => prevLimit + 10);
    };

    const applyToJob = async (jobId: string) => {
        if (!user) {
            console.error('User not logged in.');
            return false;
        }

        try {
            const { data, error } = await supabase
                .from('job_applications')
                .insert([{
                    job_id: jobId,
                    user_id: user.id,
                    status: 'Applied'
                }]);

            if (error) {
                throw error;
            }

            const { data: updatedData, error: updatedError } = await supabase
                .from('job_applications')
                .select('*')
                .eq('user_id', user.id);

            if (updatedError) {
                throw updatedError;
            }

            if (updatedData) {
                setApplications(updatedData as JobApplication[]);
            }

            return true;
        } catch (error: any) {
            console.error('Error applying to job:', error.message);
            const newApplication: JobApplication = {
                id: `app-${Date.now()}`,
                job_id: jobId,
                user_id: user.id,
                status: 'Applied',
                applied_at: new Date().toISOString()
            };
            const updatedApplications = [...applications, newApplication];
            setApplications(updatedApplications);
            localStorage.setItem('applications', JSON.stringify(updatedApplications));
            return false;
        }
    };

    const getJobById = (id: string) => {
        return jobs.find(job => job.id === id);
    };

    const hasApplied = (jobId: string, userId: string) => {
        return applications.some(app => app.job_id === jobId && app.user_id === userId);
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
        getJobById,
        hasApplied
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};