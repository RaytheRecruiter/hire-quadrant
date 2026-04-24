import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Building2, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useJobs } from '../contexts/JobContext';

interface TrendingCompany {
  company: string;
  job_count: number;
  total_views: number;
}

interface TrendingLocation {
  location: string;
  job_count: number;
}

const TrendingSection: React.FC = () => {
  const { setLocationFilter, setSearchTerm } = useJobs();
  const [companies, setCompanies] = useState<TrendingCompany[]>([]);
  const [locations, setLocations] = useState<TrendingLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      const [compRes, locRes] = await Promise.all([
        supabase.from('trending_companies').select('*').limit(20),
        supabase.from('trending_locations').select('*').limit(20),
      ]);
      if (compRes.error) {
        console.error('Error fetching trending companies:', compRes.error);
      } else if (compRes.data) {
        setCompanies(compRes.data);
      }
      if (locRes.error) {
        console.error('Error fetching trending locations:', locRes.error);
      } else if (locRes.data) {
        setLocations(locRes.data);
      }
      setLoading(false);
    };
    fetchTrending();
  }, []);

  if (loading || (companies.length === 0 && locations.length === 0)) return null;

  return (
    <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {companies.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            Trending Companies
          </h3>
          <div className="flex flex-wrap gap-2">
            {companies.slice(0, 8).map(c => (
              <button
                key={c.company}
                onClick={() => setSearchTerm(c.company)}
                className="group flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 hover:bg-primary-50 px-3 py-2 rounded-full text-sm text-gray-700 dark:text-slate-300 hover:text-primary-700 transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 group-hover:text-primary-500" />
                <span className="font-medium">{c.company}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{c.job_count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-500" />
            Trending Locations
          </h3>
          <div className="flex flex-wrap gap-2">
            {locations.slice(0, 8).map(l => (
              <button
                key={l.location}
                onClick={() => setLocationFilter(l.location)}
                className="group flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 hover:bg-primary-50 px-3 py-2 rounded-full text-sm text-gray-700 dark:text-slate-300 hover:text-primary-700 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500 group-hover:text-primary-500" />
                <span className="font-medium">{l.location}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{l.job_count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingSection;
