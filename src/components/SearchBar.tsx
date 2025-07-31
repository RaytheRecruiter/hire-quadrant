import React from 'react';
import { useJobs } from '../contexts/JobContext';
import { Search, MapPin, Filter } from 'lucide-react';

const SearchBar: React.FC = () => {
  const { 
    searchTerm, 
    locationFilter, 
    typeFilter, 
    setSearchTerm, 
    setLocationFilter, 
    setTypeFilter 
  } = useJobs();

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-8 mb-12 hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              value={searchTerm}
              onChange={(e) => {
                console.log('Search term changed to:', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="City, state, or remote"
              value={locationFilter}
              onChange={(e) => {
                console.log('Location filter changed to:', e.target.value);
                setLocationFilter(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all duration-300 bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                console.log('Type filter changed to:', e.target.value);
                setTypeFilter(e.target.value);
              }}
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
        </div>
      </div>
    </div>
  );
};

export default SearchBar;