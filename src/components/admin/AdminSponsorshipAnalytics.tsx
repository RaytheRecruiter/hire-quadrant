// Sponsorship (PROMOTE) analytics + comp-sponsorship admin tool.
// Per Ray 2026-08-18: "No analytics yet on sponsorship spend vs. results
// -- Build it please!!!!" and a comp/trial account path for demo jobs so
// sales doesn't have to go through the Stripe paywall.

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Loader2,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';

interface OrderRow {
  id: string;
  job_id: string;
  company_id: string;
  tier: number | null;
  price_cents_paid: number;
  duration_days: number;
  addon_urgent: boolean;
  addon_price_cents: number;
  is_comp: boolean;
  purchased_at: string;
}

interface JobLite {
  id: string;
  title: string;
  company: string;
  views: number | null;
  applications: number | null;
  is_sponsored: boolean | null;
}

interface SponsorshipPlanLite {
  tier: number;
  name: string;
  duration_days: number;
}

const fmtDollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

const AdminSponsorshipAnalytics: React.FC = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [jobTitleById, setJobTitleById] = useState<Record<string, string>>({});
  const [companyNameById, setCompanyNameById] = useState<Record<string, string>>({});
  const [allJobs, setAllJobs] = useState<JobLite[]>([]);
  const [loading, setLoading] = useState(true);

  // Comp-sponsorship tool
  const [plans, setPlans] = useState<SponsorshipPlanLite[]>([]);
  const [urgentDuration, setUrgentDuration] = useState<number | null>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [jobResults, setJobResults] = useState<{ id: string; title: string; company: string; company_id: string | null }[]>([]);
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string; company_id: string | null } | null>(null);
  const [compTier, setCompTier] = useState(1);
  const [compUrgent, setCompUrgent] = useState(false);
  const [compBusy, setCompBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: orderData }, { data: jobsData }, { data: planData }, { data: addonData }] = await Promise.all([
      supabase.from('job_sponsorship_orders').select('*').order('purchased_at', { ascending: false }).limit(200),
      supabase.from('jobs').select('id, title, company, company_id, views, applications, is_sponsored'),
      supabase.from('sponsorship_plans').select('tier, name, duration_days').eq('is_active', true).order('sort_order'),
      supabase.from('job_addons').select('duration_days').eq('key', 'urgent_hiring').maybeSingle(),
    ]);

    const jobs = (jobsData || []) as (JobLite & { company_id: string | null })[];
    setAllJobs(jobs);
    setJobTitleById(Object.fromEntries(jobs.map((j) => [j.id, j.title])));

    const companyIds = Array.from(new Set(jobs.map((j) => j.company_id).filter(Boolean))) as string[];
    if (companyIds.length > 0) {
      const { data: companies } = await supabase.from('companies').select('id, name, display_name').in('id', companyIds);
      setCompanyNameById(
        Object.fromEntries((companies || []).map((c) => [c.id, c.display_name || c.name]))
      );
    }

    setOrders((orderData || []) as OrderRow[]);
    setPlans(planData || []);
    setUrgentDuration(addonData?.duration_days ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (jobSearch.trim().length < 2) {
      setJobResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id, title, company, company_id')
        .ilike('title', `%${jobSearch.trim()}%`)
        .limit(10);
      setJobResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [jobSearch]);

  const handleComp = async () => {
    if (!selectedJob) return;
    if (!selectedJob.company_id) {
      toast.error('This job has no linked company — cannot sponsor it.');
      return;
    }
    const plan = plans.find((p) => p.tier === compTier);
    if (!plan) return;

    setCompBusy(true);
    const now = new Date();
    const jobUpdate: Record<string, unknown> = {
      is_sponsored: true,
      sponsor_tier: plan.tier,
      sponsor_start_date: now.toISOString(),
      sponsor_end_date: new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString(),
    };
    if (compUrgent && urgentDuration) {
      jobUpdate.is_urgent = true;
      jobUpdate.urgent_until = new Date(now.getTime() + urgentDuration * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error: jobError } = await supabase.from('jobs').update(jobUpdate).eq('id', selectedJob.id);
    if (jobError) {
      setCompBusy(false);
      toast.error(jobError.message);
      return;
    }

    const { error: orderError } = await supabase.from('job_sponsorship_orders').insert({
      job_id: selectedJob.id,
      company_id: selectedJob.company_id,
      tier: plan.tier,
      price_cents_paid: 0,
      duration_days: plan.duration_days,
      addon_urgent: compUrgent,
      addon_price_cents: 0,
      is_comp: true,
    });

    setCompBusy(false);
    if (orderError) {
      toast.error(orderError.message);
      return;
    }
    toast.success(`Comped "${selectedJob.title}" at ${plan.name}`);
    setSelectedJob(null);
    setJobSearch('');
    setCompUrgent(false);
    load();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
      </div>
    );
  }

  const realOrders = orders.filter((o) => !o.is_comp);
  const totalRevenueCents = realOrders.reduce((sum, o) => sum + o.price_cents_paid + (o.addon_price_cents || 0), 0);
  const revenueByTier = new Map<number, { count: number; cents: number }>();
  for (const o of realOrders) {
    if (!o.tier) continue;
    const entry = revenueByTier.get(o.tier) || { count: 0, cents: 0 };
    entry.count += 1;
    entry.cents += o.price_cents_paid;
    revenueByTier.set(o.tier, entry);
  }

  const sponsoredJobs = allJobs.filter((j) => j.is_sponsored);
  const nonSponsoredJobs = allJobs.filter((j) => !j.is_sponsored);
  const avg = (arr: JobLite[], key: 'views' | 'applications') =>
    arr.length ? arr.reduce((sum, j) => sum + (j[key] || 0), 0) / arr.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary-600" />
          Sponsorship performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total sponsorship revenue
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{fmtDollars(totalRevenueCents)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" /> Paid purchases
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{realOrders.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Comp'd sponsorships
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{orders.length - realOrders.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">Revenue by tier</p>
            {revenueByTier.size === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500">No paid purchases yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {[...revenueByTier.entries()].sort((a, b) => a[0] - b[0]).map(([tier, v]) => (
                    <tr key={tier} className="border-b border-gray-50 dark:border-slate-800 last:border-0">
                      <td className="py-1.5 text-gray-600 dark:text-slate-400">Tier {tier}</td>
                      <td className="py-1.5 text-right text-gray-500 dark:text-slate-400">{v.count} purchases</td>
                      <td className="py-1.5 text-right font-semibold text-secondary-900 dark:text-white">{fmtDollars(v.cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
              Sponsored vs. non-sponsored (platform average)
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 dark:text-slate-500">
                  <th className="text-left font-normal"></th>
                  <th className="text-right font-normal">Views</th>
                  <th className="text-right font-normal">Applications</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50 dark:border-slate-800">
                  <td className="py-1.5 text-gray-600 dark:text-slate-400">Sponsored ({sponsoredJobs.length})</td>
                  <td className="py-1.5 text-right font-semibold text-amber-600">{avg(sponsoredJobs, 'views').toFixed(1)}</td>
                  <td className="py-1.5 text-right font-semibold text-amber-600">{avg(sponsoredJobs, 'applications').toFixed(1)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-gray-600 dark:text-slate-400">Non-sponsored ({nonSponsoredJobs.length})</td>
                  <td className="py-1.5 text-right text-gray-500 dark:text-slate-400">{avg(nonSponsoredJobs, 'views').toFixed(1)}</td>
                  <td className="py-1.5 text-right text-gray-500 dark:text-slate-400">{avg(nonSponsoredJobs, 'applications').toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3">
              Current snapshot, not a before/after lift — views/applications aren't tracked over time yet.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">Recent purchases</p>
          {orders.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">No sponsorship purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700">
                    <th className="py-2 pr-3">Job</th>
                    <th className="py-2 pr-3">Company</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">Urgent add-on</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 30).map((o) => (
                    <tr key={o.id} className="border-b border-gray-100 dark:border-slate-800">
                      <td className="py-2 pr-3">{jobTitleById[o.job_id] || o.job_id}</td>
                      <td className="py-2 pr-3">{companyNameById[o.company_id] || '—'}</td>
                      <td className="py-2 pr-3">{o.tier ?? '—'}</td>
                      <td className="py-2 pr-3">{o.addon_urgent ? 'Yes' : '—'}</td>
                      <td className="py-2 pr-3">
                        {o.is_comp ? (
                          <span className="inline-flex items-center gap-1 text-purple-700"><ShieldCheck className="h-3 w-3" /> Comp</span>
                        ) : (
                          fmtDollars(o.price_cents_paid + (o.addon_price_cents || 0))
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 dark:text-slate-400">
                        {new Date(o.purchased_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-600" />
          Comp a job sponsorship
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Grants sponsorship for free — for demo/trial jobs, so sales doesn't have to go through Stripe.
        </p>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search job by title…"
              value={selectedJob ? selectedJob.title : jobSearch}
              onChange={(e) => {
                setSelectedJob(null);
                setJobSearch(e.target.value);
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
            />
            {jobResults.length > 0 && !selectedJob && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {jobResults.map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setSelectedJob(j);
                      setJobResults([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span>{j.title}</span>
                    <span className="text-xs text-gray-400">{j.company}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedJob && (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Selected: {selectedJob.title}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={compTier}
                  onChange={(e) => setCompTier(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  {plans.map((p) => (
                    <option key={p.tier} value={p.tier}>{p.name} ({p.duration_days}d)</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400">
                  <input type="checkbox" checked={compUrgent} onChange={(e) => setCompUrgent(e.target.checked)} />
                  + Urgent Hiring
                </label>
                <button
                  onClick={handleComp}
                  disabled={compBusy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                  {compBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Comp sponsorship
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSponsorshipAnalytics;
