import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../utils/supabaseClient';
import { Building2, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import CompanyLogo from '../components/CompanyLogo';

interface Company {
  id: string;
  name: string;
  location?: string;
  logo_url?: string;
  job_count: number;
}

const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await supabase
          .from('jobs')
          .select('company, location')
          .neq('company', null);

        const companyMap = new Map<string, { location?: string; logo?: string; count: number }>();
        (data || []).forEach((job: any) => {
          if (job.company) {
            const existing = companyMap.get(job.company) || { count: 0 };
            companyMap.set(job.company, {
              location: job.location || existing.location,
              logo: undefined,
              count: existing.count + 1,
            });
          }
        });

        const companies: Company[] = Array.from(companyMap.entries()).map(([name, data]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          location: data.location,
          logo_url: data.logo,
          job_count: data.count,
        }));

        setCompanies(companies.sort((a, b) => b.job_count - a.job_count));
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Browse Companies Hiring — HireQuadrant</title>
        <meta name="description" content="Discover companies actively hiring. See open roles by employer." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Browse Companies
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-6">
              Explore {companies.length} companies actively hiring on HireQuadrant
            </p>

            <input
              type="text"
              placeholder="Search companies by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <Building2 className="h-8 w-8 text-primary-500" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Unable to Load Companies</h3>
                  <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((company) => (
                <Link
                  key={company.id}
                  to={`/?company=${encodeURIComponent(company.name)}`}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover border border-gray-100 dark:border-slate-700 transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <CompanyLogo company={company.name} logoUrl={company.logo_url} size="lg" />
                    <div className="flex-1">
                      <h3 className="font-bold text-secondary-900 dark:text-white mb-1">
                        {company.name}
                      </h3>
                      {company.location && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {company.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {company.job_count} open {company.job_count === 1 ? 'role' : 'roles'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">No companies found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Companies;
