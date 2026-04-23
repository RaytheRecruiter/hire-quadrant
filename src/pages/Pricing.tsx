import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { Check, Zap, Star, Crown, Building2, AlertCircle } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  job_limit: number;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  sort_order: number;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="w-8 h-8 text-gray-500" />,
  basic: <Star className="w-8 h-8 text-blue-500" />,
  premium: <Crown className="w-8 h-8 text-purple-500" />,
  enterprise: <Building2 className="w-8 h-8 text-yellow-600" />,
};

const planHighlight: Record<string, string> = {
  free: 'border-gray-200',
  basic: 'border-blue-200',
  premium: 'border-purple-300 ring-2 ring-purple-100',
  enterprise: 'border-yellow-200',
};

const FAQ_ITEMS = [
  {
    q: 'Is HireQuadrant free for job seekers?',
    a: 'Yes. Candidates never pay. You can browse jobs, save searches, set up email alerts, and apply to any role for free.',
  },
  {
    q: 'How much does it cost for employers?',
    a: 'Employers can start on the Free plan with 3 active job postings. Paid plans start at $29.99/month (Basic) and unlock more postings, advanced analytics, resume downloads, and featured listings. Enterprise is available for unlimited postings and dedicated support.',
  },
  {
    q: 'Can I cancel or change plans anytime?',
    a: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time from your Company Dashboard.',
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

const Pricing: React.FC = () => {
  useSEO({ title: 'Pricing', description: 'Simple, transparent pricing for employers. Free for job seekers forever.', canonical: '/pricing' });

  // Inject FAQ JSON-LD
  useEffect(() => {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map(item => ({
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

  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;

        const parsed = (data || []).map(plan => ({
          ...plan,
          features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
        }));

        setPlans(parsed);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load pricing plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Unable to Load Pricing</h3>
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your hiring needs. Start free and scale as you grow.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Yearly
            <span className="ml-1 text-xs text-green-600 font-semibold">Save ~17%</span>
          </span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isPremium = plan.slug === 'premium';
          const price = isYearly ? plan.price_yearly : plan.price_monthly;
          const period = isYearly ? '/year' : '/month';

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-slate-800 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col ${
                planHighlight[plan.slug] || 'border-gray-200 dark:border-slate-700'
              }`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-soft">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Icon & Name */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {planIcons[plan.slug] || <Zap className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {plan.job_limit === -1 ? 'Unlimited' : plan.job_limit} job posting{plan.job_limit !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.price_monthly === 0 ? (
                  <div>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${isYearly ? (plan.price_yearly / 12).toFixed(0) : plan.price_monthly}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400 text-sm">/month</span>
                    {isYearly && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Billed ${price}{period}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                {plan.slug === 'free' ? (
                  <HardLink
                    to="/register"
                    className="block w-full text-center py-2.5 px-4 rounded-lg font-medium text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-soft hover:shadow-card-hover"
                  >
                    Get Started
                  </HardLink>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center py-2.5 px-4 rounded-lg font-medium text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ section — matches the FAQPage JSON-LD injected above */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-secondary-900 dark:text-white text-center mb-10">
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
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-600 dark:text-slate-400">
          Need a custom plan or have questions?{' '}
          <a
            href="mailto:sales@hirequadrant.com"
            className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
          >
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  );
};

export default Pricing;
