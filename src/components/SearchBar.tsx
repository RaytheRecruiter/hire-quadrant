import React from 'react';
import { useJobs } from '../contexts/JobContext';
import { Search, MapPin, Filter, DollarSign } from 'lucide-react';

const SearchBar: React.FC = () => {
  const {
    searchTerm,
    locationFilter,
    typeFilter,
    minSalary,
    setSearchTerm,
    setLocationFilter,
    setTypeFilter,
    setMinSalary,
  } = useJobs();

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-8 mb-12 hover:shadow-2xl transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Job title, keywords, or company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="City, state, or remote"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-300 appearance-none bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900"
          >
            <option value="">All job types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="contract-to-hire">Contract to Hire</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={minSalary}
            onChange={(e) => setMinSalary(Number(e.target.value))}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-300 appearance-none bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900"
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
  );
};

export default SearchBar;
