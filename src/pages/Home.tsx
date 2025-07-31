import React from 'react';
import SearchBar from '../components/SearchBar';
import JobList from '../components/JobList';
import { Search, Users, Briefcase, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-400 via-primary-300 to-primary-500 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"></div>
          <div className="absolute top-32 right-20 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-white rounded-full blur-xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center relative z-10">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">New opportunities daily</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent leading-tight">
              Find Your Dream Job
              <span className="block text-4xl md:text-6xl mt-2">Today</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Connect with opportunities that match your career goals and unlock your potential
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm md:text-base">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Briefcase className="h-5 w-5 mr-2" />
                <span>5,000+ Jobs</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Users className="h-5 w-5 mr-2" />
                <span>1,000+ Companies</span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>500+ Hired</span>
              </div>
            </div>
            <div className="mt-10">
              <button className="group inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-full font-semibold hover:bg-white/95 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <span>Start Your Journey</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SearchBar />
        <JobList />
      </div>
    </div>
  );
};

export default Home;