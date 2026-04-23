import React, { useEffect, useState } from 'react';
import { Search, MapPin, Sparkles, ArrowRight, Users, Building2, CheckCircle2, Briefcase } from 'lucide-react';
import { useJobs } from '../contexts/JobContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import TrendingSection from '../components/TrendingSection';
import NewsletterSignup from '../components/NewsletterSignup';
import RecommendedJobs from '../components/RecommendedJobs';
import { useSEO } from '../hooks/useSEO';
import CompanyLogo from '../components/CompanyLogo';

interface FeaturedCompany {
  name: string;
  logo_url: string | null;
}

const STATS_CACHE_KEY = 'hq-home-stats-v1';
const STATS_TTL_MS = 5 * 60 * 1000;
const FEATURED_CACHE_KEY = 'hq-home-featured-v1';
const FEATURED_TTL_MS = 30 * 60 * 1000;

interface StatsShape {
  jobs: number;
  companies: number;
  postedThisWeek: number;
}

function readCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { value, storedAt } = JSON.parse(raw) as { value: T; storedAt: number };
    if (Date.now() - storedAt > ttlMs) return null;
    return value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ value, storedAt: Date.now() }));
  } catch {
    /* sessionStorage unavailable — ignore */
  }
}

const CATEGORIES = [
  { label: 'Engineering', icon: '⚙️' },
  { label: 'Design', icon: '🎨' },
  { label: 'Marketing', icon: '📣' },
  { label: 'Finance', icon: '💰' },
  { label: 'Sales', icon: '📈' },
  { label: 'Operations', icon: '🏗️' },
  { label: 'Data & Analytics', icon: '📊' },
  { label: 'Healthcare', icon: '🏥' },
] as const;

const Home: React.FC = () => {
  const { helmet } = useSEO({ canonical: '/' });
  const { user } = useAuth();
  const { setSearchTerm, setLocationFilter, setTypeFilter, setMinSalary, jobs, loading } = useJobs();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [heroSearch, setHeroSearch] = useState('');
  const [heroLocation, setHeroLocation] = useState('');
  const [stats, setStats] = useState<StatsShape>(
    () => readCache<StatsShape>(STATS_CACHE_KEY, STATS_TTL_MS) ?? { jobs: 0, companies: 0, postedThisWeek: 0 }
  );
  const [featuredCompanies, setFeaturedCompanies] = useState<FeaturedCompany[]>(
    () => readCache<FeaturedCompany[]>(FEATURED_CACHE_KEY, FEATURED_TTL_MS) ?? []
  );

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

    // Auto-scroll to jobs section if searching
    if (keyword || title) {
      setTimeout(() => {
        document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [searchParams, setSearchTerm, setLocationFilter, setTypeFilter, setMinSalary]);

  useEffect(() => {
    if (readCache<StatsShape>(STATS_CACHE_KEY, STATS_TTL_MS)) return;

    let cancelled = false;
    const fetchStats = async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [jobsRes, companiesRes, recentRes] = await Promise.all([
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('company', { count: 'exact', head: true }).not('company', 'is', null),
          supabase.from('jobs').select('*', { count: 'exact', head: true }).gte('posted_date', weekAgo),
        ]);
        if (cancelled) return;
        const next: StatsShape = {
          jobs: jobsRes.count ?? 0,
          companies: companiesRes.count ?? 0,
          postedThisWeek: recentRes.count ?? 0,
        };
        setStats(next);
        writeCache(STATS_CACHE_KEY, next);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (readCache<FeaturedCompany[]>(FEATURED_CACHE_KEY, FEATURED_TTL_MS)) return;

    let cancelled = false;
    const fetchFeaturedCompanies = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('company')
        .not('company', 'is', null)
        .limit(16);

      if (cancelled || !data) return;
      const seen = new Set<string>();
      const unique: FeaturedCompany[] = [];
      for (const row of data) {
        if (row.company && !seen.has(row.company) && unique.length < 8) {
          seen.add(row.company);
          unique.push({ name: row.company, logo_url: null });
        }
      }
      setFeaturedCompanies(unique);
      writeCache(FEATURED_CACHE_KEY, unique);
    };
    fetchFeaturedCompanies();
    return () => {
      cancelled = true;
    };
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

  const handleBrowseAllJobs = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      e.preventDefault();
      document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {helmet}
      <div className="min-h-screen">
      {/* DIAG: temporary debug link for routing test — remove after fix */}
      <div style={{ background: '#fbbf24', color: 'black', padding: '12px', textAlign: 'center', fontWeight: 700 }}>
        🧪 ROUTING DIAG: <Link to="/profile" style={{ textDecoration: 'underline', color: 'black' }}>click here to test /profile navigation</Link> — if you see a lime-green banner, routing works
      </div>
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
              Skip the black hole. Every application is screened, tracked, and acknowledged.
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

            {/* Dual CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3.5 rounded-xl shadow-soft transition-all flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Search Jobs
              </button>
            </div>

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

      {/* Dual Pathway Cards */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Seeker Card */}
            <div className="group relative bg-gradient-to-br from-primary-50 to-primary-100/40 dark:from-primary-900/20 dark:to-slate-900 rounded-3xl p-8 border border-primary-100 dark:border-primary-900/30 hover:shadow-card-hover transition-all">
              <Users className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="font-display text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                Find Your Next Role
              </h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-secondary-600 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>Search thousands of positions</span>
                </li>
                <li className="flex items-start gap-2 text-secondary-600 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>Track every application</span>
                </li>
                <li className="flex items-start gap-2 text-secondary-600 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>Get real feedback</span>
                </li>
              </ul>
              <button
                onClick={() => {
                  document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Browse Jobs
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Employer Card */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-900/20 dark:to-slate-900 rounded-3xl p-8 border border-amber-200 dark:border-amber-900/30 hover:shadow-card-hover transition-all">
              <Building2 className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="font-display text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                Find Your Next Hire
              </h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-secondary-600 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Post in minutes</span>
                </li>
                <li className="flex items-start gap-2 text-secondary-600 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>AI-powered screening</span>
                </li>
                <li className="flex items-start gap-2 text-secondary-600 dark:text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Track candidates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Employers */}
      {featuredCompanies.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold text-secondary-500 dark:text-slate-400 uppercase tracking-widest mb-10">
              Trusted by companies of all sizes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
              {featuredCompanies.map((company) => (
                <div
                  key={company.name}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-center border border-gray-100 dark:border-slate-700 h-20"
                >
                  <CompanyLogo company={company.name} logoUrl={company.logo_url} size="md" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Category */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white text-center mb-10">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={`/?keyword=${encodeURIComponent(cat.label)}`}
                className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 rounded-xl p-4 transition-all group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold text-secondary-700 dark:text-slate-300 group-hover:text-primary-700 dark:group-hover:text-primary-300 text-sm">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              How it works for job seekers
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
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-b from-white to-primary-50/30 dark:from-slate-950 dark:to-primary-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
                About HireQuadrant
              </h2>
              <p className="text-lg text-secondary-600 dark:text-slate-300 mb-4 leading-relaxed">
                We believe job seekers deserve better than the black hole. Every application matters. Every candidate deserves feedback.
              </p>
              <p className="text-lg text-secondary-600 dark:text-slate-300 mb-6 leading-relaxed">
                HireQuadrant is built on transparency. We work for candidates, not algorithms. We help employers find their best people and give candidates the clarity they deserve.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-all"
              >
                Learn Our Story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-primary-100 dark:border-primary-900/30 shadow-card">
              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">100%</div>
                  <p className="text-secondary-600 dark:text-slate-300">Transparent Screening</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">24hr</div>
                  <p className="text-secondary-600 dark:text-slate-300">Average Response Time</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">10K+</div>
                  <p className="text-secondary-600 dark:text-slate-300">Jobs & Counting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Preview */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Common Questions
            </h2>
            <p className="text-lg text-secondary-600 dark:text-slate-400 max-w-2xl mx-auto">
              Get answers to questions about how HireQuadrant works
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: 'How do I apply for jobs?', a: 'Search for jobs, click "Apply", and submit your application. We keep track of your status for you.' },
              { q: 'Is my data safe?', a: 'Yes. We use SSL encryption, secure databases, and never share your data without permission.' },
              { q: 'How do I track my applications?', a: 'Go to your profile to see all applications with real-time status updates.' },
              { q: 'Can I receive job recommendations?', a: 'Yes! Subscribe to our newsletter for weekly jobs matched to your skills.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-2">{item.q}</h3>
                <p className="text-secondary-600 dark:text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/support"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              View Full FAQ & Support
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Your Privacy & Security Matter
            </h2>
            <p className="text-lg text-secondary-600 dark:text-slate-400 max-w-2xl mx-auto">
              We're committed to protecting your information with industry-leading security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">Encrypted Data</h3>
              <p className="text-secondary-600 dark:text-slate-400 text-sm">
                All data transmitted over HTTPS with end-to-end encryption
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">Privacy First</h3>
              <p className="text-secondary-600 dark:text-slate-400 text-sm">
                We never sell your data. Full control over your privacy settings.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚖️</span>
              </div>
              <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2">Compliant</h3>
              <p className="text-secondary-600 dark:text-slate-400 text-sm">
                GDPR, CCPA, and all data protection regulations complied
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link to="/privacy" className="text-primary-600 hover:text-primary-800 font-semibold">
              Privacy Policy
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/terms" className="text-primary-600 hover:text-primary-800 font-semibold">
              Terms of Service
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/support" className="text-primary-600 hover:text-primary-800 font-semibold">
              Security & Support
            </Link>
          </div>
        </div>
      </section>

      {/* Legal & Support Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Company & Resources
            </h2>
            <p className="text-lg text-secondary-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to know about HireQuadrant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '📖',
                title: 'About Us',
                description: 'Learn our story, mission, and values',
                link: '/about',
              },
              {
                icon: '🛟',
                title: 'Support',
                description: 'Get help with your account and questions',
                link: '/support',
              },
              {
                icon: '🔐',
                title: 'Privacy Policy',
                description: 'How we protect your personal data',
                link: '/privacy',
              },
              {
                icon: '⚖️',
                title: 'Terms of Service',
                description: 'Our terms and conditions',
                link: '/terms',
              },
            ].map((item, idx) => (
              <Link
                key={idx}
                to={item.link}
                className="group bg-gray-50 dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-card-hover transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-lg text-secondary-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-secondary-600 dark:text-slate-400 text-sm">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-r from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
            Stay ahead in your job search
          </h2>
          <p className="text-lg text-secondary-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Get weekly job recommendations and career tips delivered to your inbox.
          </p>
          <NewsletterSignup variant="card" title="" description="" />
        </div>
      </section>

      {/* Personalized Recommendations (Phase 2) */}
      {user && <RecommendedJobs />}

      {/* Featured Jobs */}
      <div id="jobs-section" className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-secondary-900 dark:text-white">
              Trending Now
            </h2>
            <Link
              to="/"
              onClick={handleBrowseAllJobs}
              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-semibold flex items-center gap-1 text-sm"
            >
              Browse all jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <Briefcase className="h-8 w-8 text-primary-500" />
              </div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.slice(0, 9).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-card-hover transition-all hover:border-primary-300"
                >
                  <h3 className="font-bold text-lg text-secondary-900 dark:text-white group-hover:text-primary-600 mb-2 line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-slate-400 mb-3 font-medium">
                    {job.company || job.sourceCompany}
                  </p>
                  <div className="flex flex-col gap-2">
                    {job.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{job.location}</span>
                      </div>
                    )}
                    {job.type && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-500">
                        <Briefcase className="h-3 w-3 flex-shrink-0" />
                        <span>{job.type}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600 dark:text-slate-400">
              <p>No jobs available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default Home;
