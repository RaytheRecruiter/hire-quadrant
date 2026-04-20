import React, { useEffect, useState } from 'react';
import { Search, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useJobs } from '../contexts/JobContext';
import { supabase } from '../utils/supabaseClient';
import JobList from '../components/JobList';
import TrendingSection from '../components/TrendingSection';
import { useSEO } from '../hooks/useSEO';

const Home: React.FC = () => {
  const { helmet } = useSEO({ canonical: '/' });
  const { setSearchTerm, setLocationFilter } = useJobs();
  const [heroSearch, setHeroSearch] = useState('');
  const [heroLocation, setHeroLocation] = useState('');
  const [stats, setStats] = useState<{ jobs: number; companies: number; postedThisWeek: number }>({
    jobs: 0,
    companies: 0,
    postedThisWeek: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [jobsResult, companiesResult, recentResult] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('company').not('company', 'is', null),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('posted_date', weekAgo),
      ]);
      const uniqueCompanies = new Set((companiesResult.data || []).map((j: any) => j.company).filter(Boolean));
      setStats({
        jobs: jobsResult.count || 0,
        companies: uniqueCompanies.size,
        postedThisWeek: recentResult.count || 0,
      });
    };
    fetchStats();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(heroSearch);
    setLocationFilter(heroLocation);
    // Smooth scroll to job list
    const list = document.getElementById('jobs-section');
    if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {helmet}
      <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,53,148,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(61,107,175,0.18),transparent_60%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700/30 text-amber-700 dark:text-amber-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered job matching
            </span>
            <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold text-secondary-900 dark:text-white leading-[1.02] tracking-tight text-balance">
              We work for you,
              <span className="block bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent pb-2">
                not the algorithm.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-secondary-600 dark:text-slate-300 max-w-xl mx-auto text-balance leading-relaxed">
              See who's interested. Get real feedback. Know where you stand at every step.
            </p>

            {/* Hero search */}
            <form onSubmit={handleHeroSearch} className="mt-10 bg-white dark:bg-slate-800 rounded-2xl shadow-card-hover border border-gray-100 dark:border-slate-700 p-2 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-2 md:border-r md:border-gray-100 dark:md:border-slate-700">
                  <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Role, skill, or company"
                    className="w-full py-2 focus:outline-none text-secondary-900 dark:text-white bg-transparent placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 px-4 py-2">
                  <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={heroLocation}
                    onChange={(e) => setHeroLocation(e.target.value)}
                    placeholder="City, state, or remote"
                    className="w-full py-2 focus:outline-none text-secondary-900 dark:text-white bg-transparent placeholder-gray-400 dark:placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl shadow-soft hover:shadow-card-hover transition-all flex items-center justify-center gap-2"
                >
                  Search
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Real stats */}
            {stats.jobs > 0 && (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-secondary-500 dark:text-slate-400">
                <span>
                  <strong className="text-secondary-900 dark:text-white font-display font-bold text-xl mr-1">
                    {stats.jobs.toLocaleString()}
                  </strong>
                  open jobs
                </span>
                <span className="hidden sm:inline text-gray-300">·</span>
                <span>
                  <strong className="text-secondary-900 dark:text-white font-display font-bold text-xl mr-1">
                    {stats.companies.toLocaleString()}
                  </strong>
                  companies hiring
                </span>
                <span className="hidden sm:inline text-gray-300">·</span>
                <span>
                  <strong className="text-secondary-900 dark:text-white font-display font-bold text-xl mr-1">
                    {stats.postedThisWeek.toLocaleString()}
                  </strong>
                  posted this week
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div id="jobs-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TrendingSection />
        <JobList />
      </div>
    </div>
    </>
  );
};

export default Home;
