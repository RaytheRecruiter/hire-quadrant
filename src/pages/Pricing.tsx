// Public, self-service pricing page — per Ray's 2026-08-18 reply
// referencing lusha.com/pricing: "Something like this could be good just
// for automated sales; where it's self-service." Unauthenticated, pulls
// live pricing from the same tables the logged-in company panels use
// (subscription_plans, contact_credit_packs, sponsorship_plans,
// job_addons — all publicly SELECT-able for is_active rows) so there's
// only one source of truth for pricing.
//
// CTAs route to /register?type=company rather than straight to Stripe
// Checkout — checkout requires an authenticated company account, so the
// self-service flow here is "sign up, then subscribe from the dashboard,"
// not a fully anonymous checkout.

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { Search, Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

// Replaces the old free/basic/premium/enterprise job-limit pricing page
// (job posting has been unlimited and free since Phase 1 — those plans
// were deactivated and their "Coming Soon" checkout buttons were never
// wired up). FAQ content + JSON-LD pattern carried forward from that
// page, updated for the new Post/Promote/Source model.
const FAQ_ITEMS = [
  {
    q: 'Is HireQuadrant free for job seekers?',
    a: 'Yes. Candidates never pay. You can browse jobs, save searches, set up email alerts, and apply to any role for free.',
  },
  {
    q: 'How much does it cost to post a job?',
    a: 'Job postings are always free, with no limit on how many you post.',
  },
  {
    q: 'What is Promote / Sponsored Jobs?',
    a: 'A one-time purchase per job listing that boosts its placement in search results for a set number of days, with an optional Urgent Hiring add-on for extra visibility. No subscription required.',
  },
  {
    q: 'What is Source / the Resume Database?',
    a: 'A monthly or annual subscription that lets you search candidate profiles and unlock contact info directly, instead of waiting for applicants to come to you.',
  },
  {
    q: 'Can I cancel or change plans anytime?',
    a: 'Yes, for Starter and Pro Resume Database plans — upgrade, downgrade, or cancel anytime from your Company Dashboard. Our top-tier Business plan is set up with our sales team.',
  },
  {
    q: 'Does HireQuadrant use AI?',
    a: 'Yes. Employers get an AI job description generator and AI candidate screening with fit scores. Candidates get similar-job recommendations and AI-assisted matching.',
  },
  {
    q: 'Do you support applicant tracking system (ATS) integrations?',
    a: 'Yes. We support Greenhouse, Lever, Workday, and iCIMS. Connect your ATS from the Admin panel to sync jobs and applicants.',
  },
];

interface ResumePlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  monthly_unlock_credits: number;
  features: string[];
  requires_manual_upgrade: boolean;
  sort_order: number;
}

interface SponsorshipPlan {
  id: string;
  tier: number;
  name: string;
  price_cents: number;
  duration_days: number;
  features: string[];
  sort_order: number;
}

const fmtMo = (cents: number) => (cents <= 0 ? 'Free' : `$${(cents / 100).toFixed(0)}`);

const Pricing: React.FC = () => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [resumePlans, setResumePlans] = useState<ResumePlan[]>([]);
  const [sponsorshipPlans, setSponsorshipPlans] = useState<SponsorshipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
    const prior = document.getElementById('pricing-faq-schema');
    if (prior) prior.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'pricing-faq-schema';
    script.text = JSON.stringify(faq);
    document.head.appendChild(script);
    return () => { document.getElementById('pricing-faq-schema')?.remove(); };
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: resumeData }, { data: sponsorData }] = await Promise.all([
        supabase
          .from('subscription_plans')
          .select('id, name, slug, price_monthly, price_yearly, monthly_unlock_credits, features, requires_manual_upgrade, sort_order')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('sponsorship_plans')
          .select('id, tier, name, price_cents, duration_days, features, sort_order')
          .eq('is_active', true)
          .order('sort_order'),
      ]);
      setResumePlans(resumeData || []);
      setSponsorshipPlans(sponsorData || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <Helmet>
        <title>Pricing — HireQuadrant</title>
        <meta
          name="description"
          content="HireQuadrant pricing: post jobs for free, sponsor listings to reach more candidates, and search the resume database to find talent yourself."
        />
      </Helmet>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
          Simple, self-service pricing
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          Post for free. Promote when you need more applicants. Source when you want to find candidates yourself.
        </p>
        <HardLink
          to="/register?type=company"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 text-white font-semibold hover:from-primary-500 hover:to-primary-600 transition-all shadow-lg"
        >
          Get started for free
          <ArrowRight className="h-4 w-4" />
        </HardLink>
      </div>

      {/* POST — always free */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-1">Post</p>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Job postings are always free</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">No limits, no plan required. Just sign up and post.</p>
          </div>
          <span className="text-3xl font-bold text-emerald-600">$0</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mx-auto" />
        </div>
      ) : (
        <>
          {/* PROMOTE — Job Sponsorship */}
          {sponsorshipPlans.length > 0 && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Promote
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">Sponsor a job listing</h2>
                <p className="text-gray-600 dark:text-slate-400 mt-2">One-time boost per job. No subscription required.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sponsorshipPlans.map((plan) => {
                  const isPopular = plan.features?.includes('Most Popular');
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-6 bg-white/90 backdrop-blur-sm shadow-lg ${
                        isPopular ? 'border-primary-400 ring-2 ring-primary-200' : 'border-white/20'
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary-500 text-white">
                          Most Popular
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-secondary-900 dark:text-white">{plan.name}</h3>
                      <p className="text-3xl font-bold text-primary-600 mt-2">
                        {fmtMo(plan.price_cents)}
                        <span className="text-sm font-normal text-gray-400"> / {plan.duration_days} days</span>
                      </p>
                      <ul className="mt-4 space-y-2">
                        {(plan.features || []).filter((f) => f !== 'Most Popular').map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <HardLink
                        to="/register?type=company"
                        className="block text-center mt-6 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition"
                      >
                        Get started
                      </HardLink>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SOURCE — Resume Database */}
          {resumePlans.length > 0 && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-wide text-primary-600 font-semibold mb-1 flex items-center justify-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Source
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white">Search the resume database</h2>
                <p className="text-gray-600 dark:text-slate-400 mt-2">Find and reach out to candidates directly.</p>
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 mt-4">
                  {(['monthly', 'annual'] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setBilling(freq)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                        billing === freq ? 'bg-primary-500 text-white shadow' : 'text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      {freq === 'monthly' ? 'Monthly' : 'Annual (save ~17%)'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {resumePlans.map((plan) => {
                  const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly;
                  const isPopular = plan.features?.includes('Most Popular');
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border p-6 bg-white/90 backdrop-blur-sm shadow-lg ${
                        isPopular ? 'border-primary-400 ring-2 ring-primary-200' : 'border-white/20'
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-primary-500 text-white">
                          Most Popular
                        </span>
                      )}
                      <h3 className="font-bold text-lg text-secondary-900 dark:text-white">{plan.name}</h3>
                      <p className="text-3xl font-bold text-primary-600 mt-2">
                        {fmtMo(price)}
                        {price > 0 && <span className="text-sm font-normal text-gray-400">/{billing === 'monthly' ? 'mo' : 'yr'}</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{plan.monthly_unlock_credits} unlocks / mo</p>
                      <ul className="mt-4 space-y-2">
                        {(plan.features || []).filter((f) => f !== 'Most Popular').map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <HardLink
                        to={plan.requires_manual_upgrade ? '/contact' : '/register?type=company'}
                        className={`block text-center mt-6 px-4 py-2.5 rounded-xl font-semibold transition ${
                          isPopular
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'border border-primary-400 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                        }`}
                      >
                        {plan.requires_manual_upgrade ? 'Contact sales' : 'Get started'}
                      </HardLink>
                    </div>
                  );
                })}
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-6 flex flex-col justify-center items-center text-center">
                  <h3 className="font-bold text-lg text-secondary-900 dark:text-white">Enterprise</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 mb-4">
                    Custom credits, team seats, and dedicated support.
                  </p>
                  <a
                    href="mailto:billing@hirequadrant.com?subject=Enterprise%20Resume%20Database"
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold hover:border-primary-400 hover:text-primary-600 transition"
                  >
                    Contact sales
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* FAQ — matches the FAQPage JSON-LD injected above */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-secondary-900 dark:text-white text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <details key={i} className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
                  <summary className="font-semibold text-secondary-900 dark:text-white cursor-pointer list-none flex items-center justify-between">
                    {item.q}
                    <span className="text-primary-500 transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
                  </summary>
                  <p className="mt-3 text-secondary-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-10 text-center text-gray-600 dark:text-slate-400">
              Need a custom plan or have questions?{' '}
              <a
                href="mailto:sales@hirequadrant.com"
                className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
              >
                Contact our sales team
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Pricing;
