import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Bookmark, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { supabase } from '../utils/supabaseClient';
import { Job } from '../contexts/JobContext';
import JobCard from '../components/JobCard';
import RecommendedJobs from '../components/RecommendedJobs';

const SavedJobs: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { savedJobIds, loading: savedLoading } = useSavedJobs();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      if (savedJobIds.size === 0) {
        setJobs([]);
        setJobsLoading(false);
        return;
      }
      setJobsLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .in('id', Array.from(savedJobIds));
      if (!error && data) {
        setJobs(data as Job[]);
      }
      setJobsLoading(false);
    };
    if (!savedLoading) {
      fetchJobs();
    }
  }, [savedJobIds, savedLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Saved Jobs
          </h1>
          <p className="mt-2 text-gray-600">
            {jobs.length === 0
              ? 'Bookmark jobs to come back to them later.'
              : `You have ${jobs.length} saved job${jobs.length === 1 ? '' : 's'}.`}
          </p>
        </div>

        {jobsLoading || savedLoading ? (
          <div className="text-center py-20">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-12 text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Bookmark className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No saved jobs yet</h3>
            <p className="text-gray-600 mb-6">
              Click the bookmark icon on any job to save it here.
            </p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-primary-400 to-primary-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Your Saved Jobs</h2>
              <div className="space-y-3">
                {jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
            <RecommendedJobs />
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
