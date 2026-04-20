import React, { useState } from 'react';
import { useJobs } from '../contexts/JobContext';
import JobCard from './JobCard';
import JobCardSkeleton from './JobCardSkeleton';
import EmptyState from './EmptyState';
import SearchBar from './SearchBar';
import { AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

const JobList: React.FC = () => {
  const {
    filteredJobs,
    loading,
    error,
    currentPage,
    totalPages,
    totalJobsCount,
    goToPage,
    setSearchTerm,
    setLocationFilter,
    setTypeFilter,
    setMinSalary,
  } = useJobs();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  if (loading) {
    return (
      <div>
        <div className="hidden md:block"><SearchBar /></div>
        <div className="space-y-3 mt-6">
          {[0, 1, 2, 3, 4].map(i => <JobCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-20 w-20" />}
        title="Something went wrong"
        description={error}
        primaryAction={{ label: 'Try Again', onClick: () => window.location.reload() }}
      />
    );
  }

  const clearAll = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setMinSalary(0);
  };

  if (filteredJobs.length === 0) {
    return (
      <div>
        <div className="hidden md:block mb-6"><SearchBar /></div>
        <EmptyState
          illustration={
            <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="30" y="40" width="100" height="90" rx="12" fill="#dcf2e1" />
              <rect x="45" y="30" width="70" height="20" rx="6" fill="#8cc59e" />
              <rect x="50" y="62" width="60" height="6" rx="3" fill="#6bb382" />
              <rect x="50" y="76" width="40" height="6" rx="3" fill="#bce5c7" />
              <rect x="50" y="90" width="45" height="6" rx="3" fill="#bce5c7" />
              <circle cx="125" cy="30" r="18" fill="#4a9960" />
              <path d="M118 30 l5 5 l10 -10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          }
          title="No jobs match your filters"
          description="Try broadening your search or clear the filters to see more opportunities."
          primaryAction={{ label: 'Clear filters', onClick: clearAll }}
        />
      </div>
    );
  }

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="hidden md:block"><SearchBar /></div>

      {/* Mobile filter toggle */}
      <div className="md:hidden flex items-center justify-between">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-secondary-800 shadow-soft"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        <p className="text-sm text-gray-500">{totalJobsCount} jobs</p>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto pb-safe animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="font-display text-xl font-bold mb-4">Filters</h3>
            <SearchBar />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl"
            >
              Show {totalJobsCount} jobs
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-secondary-900">
          {totalJobsCount} open {totalJobsCount === 1 ? 'role' : 'roles'}
        </h2>
        {totalPages > 1 && (
          <p className="text-gray-500 text-sm">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {getPageNumbers()[0] > 1 && (
            <>
              <button
                onClick={() => goToPage(1)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                1
              </button>
              {getPageNumbers()[0] > 2 && <span className="px-2 text-gray-400">…</span>}
            </>
          )}

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-400">…</span>
              )}
              <button
                onClick={() => goToPage(totalPages)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobList;
