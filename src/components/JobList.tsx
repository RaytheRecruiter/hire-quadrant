import React from 'react';
import { useJobs } from '../contexts/JobContext';
import JobCard from './JobCard';
import { Briefcase, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const JobList: React.FC = () => {
  const { filteredJobs, loading, error, currentPage, totalPages, totalJobsCount, goToPage } = useJobs();

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

  // Build page numbers to display (show up to 5 pages around current)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);

    // Ensure we always show 5 pages when possible
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-secondary-900">
          {totalJobsCount} job{totalJobsCount !== 1 ? 's' : ''} found
        </h2>
        {totalPages > 1 && (
          <p className="text-gray-500 text-sm">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {filteredJobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {getPageNumbers()[0] > 1 && (
            <>
              <button
                onClick={() => goToPage(1)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                1
              </button>
              {getPageNumbers()[0] > 2 && (
                <span className="px-2 text-gray-400">...</span>
              )}
            </>
          )}

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <button
                onClick={() => goToPage(totalPages)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobList;
