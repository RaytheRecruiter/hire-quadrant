import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, DollarSign, Briefcase, Filter } from 'lucide-react';

const AdvancedSearch: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    type: '',
    salary: '0',
    remote: false,
    keyword: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.location) params.append('location', filters.location);
    if (filters.type) params.append('type', filters.type);
    if (filters.salary && filters.salary !== '0') params.append('salary', filters.salary);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.remote) params.append('remote', 'true');

    navigate(`/?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Advanced Job Search — HireQuadrant</title>
        <meta name="description" content="Search jobs by title, location, type, salary, and more. Find your perfect role." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Advanced Job Search
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              Refine your search with detailed filters to find your perfect role
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-white/20 dark:border-slate-700 p-8 space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                Job Title
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Job Type & Salary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  Job Type
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white appearance-none"
                  >
                    <option value="">All types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="contract-to-hire">Contract-to-Hire</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  Minimum Salary
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filters.salary}
                    onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white appearance-none"
                  >
                    <option value="0">Any salary</option>
                    <option value="40000">$40k+</option>
                    <option value="60000">$60k+</option>
                    <option value="80000">$80k+</option>
                    <option value="100000">$100k+</option>
                    <option value="120000">$120k+</option>
                    <option value="150000">$150k+</option>
                    <option value="200000">$200k+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                Keywords (e.g., skills, company)
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="e.g., React, AWS, Python"
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
              />
            </div>

            {/* Remote Toggle */}
            <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <input
                type="checkbox"
                id="remote"
                checked={filters.remote}
                onChange={(e) => setFilters({ ...filters, remote: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <label htmlFor="remote" className="text-sm font-medium text-secondary-700 dark:text-primary-300">
                Remote only
              </label>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-soft hover:shadow-card-hover flex items-center justify-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Search Jobs
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdvancedSearch;
