import React from 'react';
import { useJobs } from '../contexts/JobContext';
import JobCard from './JobCard';
import { Briefcase, Loader2, AlertCircle } from 'lucide-react';

const JobList: React.FC = () => {
  const { filteredJobs, allFilteredJobs, loading, error, hasMoreJobs, loadMoreJobs } = useJobs();

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="bg-primary-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-12 w-12 text-primary-400 animate-spin" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading jobs...</h3>
        <p className="text-gray-600 text-lg">Fetching the latest job opportunities</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-12 w-12 text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Error loading jobs</h3>
        <p className="text-gray-600 text-lg mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors duration-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <Briefcase className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs found</h3>
        <p className="text-gray-600 text-lg">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-secondary-900">
          Showing {filteredJobs.length} of {allFilteredJobs.length} job{allFilteredJobs.length !== 1 ? 's' : ''}
        </h2>
      </div>
      
      {filteredJobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      
      {hasMoreJobs && (
        <div className="text-center py-8">
          <button
            onClick={loadMoreJobs}
            className="bg-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Load More Jobs ({allFilteredJobs.length - filteredJobs.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default JobList;