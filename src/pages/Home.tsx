import React, { useEffect, useState } from 'react';
import { Search, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { useJobs } from '../contexts/JobContext';
import { supabase } from '../utils/supabaseClient';
import { useSearchParams } from 'react-router-dom';
import JobList from '../components/JobList';
import TrendingSection from '../components/TrendingSection';
import { useSEO } from '../hooks/useSEO';

const Home: React.FC = () => {
  const { helmet } = useSEO({ canonical: '/' });
  const { setSearchTerm, setLocationFilter, setTypeFilter, setMinSalary } = useJobs();
  const [searchParams] = useSearchParams();
  const [heroSearch, setHeroSearch] = useState('');
  const [heroLocation, setHeroLocation] = useState('');
  const [stats, setStats] = useState<{ jobs: number; companies: number; postedThisWeek: number }>({
    jobs: 0,
    companies: 0,
    postedThisWeek: 0,
  });

  useEffect(() => {
    const title = searchParams.get('title');
    const location = searchParams.get('location');
    const type = searchParams.get('type');
    const salary = searchParams.get('salary');
    const keyword = searchParams.get('keyword');
    const company = searchParams.get('company');

    if (title) setHeroSearch(title);
    if (location) setHeroLocation(location);

    if (title || company || keyword) {
      setSearchTerm(title || company || keyword || '');
    }
    if (location) {
      setLocationFilter(location);
    }
    if (type) {
      setTypeFilter(type);
    }
    if (salary) {
      setMinSalary(parseInt(salary, 10));
    }
  }, [searchParams, setSearchTerm, setLocationFilter, setTypeFilter, setMinSalary]);

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

  useEffect(() => {
    const organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'HireQuadrant',
      url: 'https://hirequadrant.com',
      description: 'Job board where every application is screened, tracked, and acknowledged. We work for you, not the algorithm.',
      logo: 'https://hirequadrant.com/logo.png',
      sameAs: [
        'https://www.linkedin.com/company/hirequadrant',
        'https://twitter.com/hirequadrant',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'support@hirequadrant.com',
      },
    };

    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'HireQuadrant',
      url: 'https://hirequadrant.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://hirequadrant.com/?q={search_term_string}',
        },
        query_input: 'required name=search_term_string',
      },
    };

    const prior = document.getElementById('organization-schema');
    if (prior) prior.remove();
    const priorWeb = document.getElementById('website-schema');
    if (priorWeb) priorWeb.remove();

    const orgScript = document.createElement('script');
    orgScript.type = 'application/ld+json';
    orgScript.id = 'organization-schema';
    orgScript.text = JSON.stringify(organization);
    document.head.appendChild(orgScript);

    const webScript = document.createElement('script');
    webScript.type = 'application/ld+json';
    webScript.id = 'website-schema';
    webScript.text = JSON.stringify(website);
    document.head.appendChild(webScript);

    return () => {
      document.getElementById('organization-schema')?.remove();
      document.getElementById('website-schema')?.remove();
    };
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

      {/* Value Props */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Why candidates choose HireQuadrant
            </h2>
            <p className="text-lg text-secondary-600 dark:text-slate-400 max-w-2xl mx-auto">
              A job board that respects your time and keeps you informed every step of the way
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-slate-900/20 rounded-2xl border border-primary-100/20 dark:border-primary-900/20">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold">✓</span>
              </div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">No Black Hole</h3>
              <p className="text-secondary-600 dark:text-slate-400">
                Every application is reviewed. Get real feedback, not silence.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-slate-900/20 rounded-2xl border border-amber-100/20 dark:border-amber-900/20">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold">📊</span>
              </div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">Track Progress</h3>
              <p className="text-secondary-600 dark:text-slate-400">
                See your application status in real-time. Know exactly where you stand.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-900/20 dark:to-slate-900/20 rounded-2xl border border-emerald-100/20 dark:border-emerald-900/20">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold">🎯</span>
              </div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">Better Matches</h3>
              <p className="text-secondary-600 dark:text-slate-400">
                Smart filtering helps you find roles that actually fit your skills and goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-lg text-secondary-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get started in minutes and find your next opportunity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '1', title: 'Browse Openings', desc: 'Search thousands of open positions filtered by role, location, and salary.' },
              { num: '2', title: 'Apply in Seconds', desc: 'Submit your application with a single click. Screening questions optional.' },
              { num: '3', title: 'Track Status', desc: 'Watch your application progress through every stage of hiring.' },
              { num: '4', title: 'Get Hired', desc: 'Receive real feedback and land your dream role.' },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 h-full border border-gray-100 dark:border-slate-700 hover:shadow-card-hover transition-all">
                  <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold mb-4 flex-shrink-0">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-secondary-600 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-gray-300 dark:text-slate-700 text-2xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Job seekers love HireQuadrant
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: 'Finally, a job board that actually keeps me in the loop. No more wondering if my application went to the void.', author: 'Sarah M.', role: 'Product Manager' },
              { quote: 'The filtering tools here are incredible. Found a perfect fit within minutes instead of hours.', author: 'James K.', role: 'Software Engineer' },
              { quote: 'I appreciated the transparency. Every company was responsive and professional throughout the process.', author: 'Maria L.', role: 'Data Analyst' },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-secondary-600 dark:text-slate-300 mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-secondary-900 dark:text-white">{testimonial.author}</div>
                  <div className="text-sm text-secondary-500 dark:text-slate-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
