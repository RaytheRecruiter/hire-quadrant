import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Check, Zap, Star, Crown, Building2 } from 'lucide-react';

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

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
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
              className={`relative bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col ${
                planHighlight[plan.slug] || 'border-gray-200'
              }`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Icon & Name */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {planIcons[plan.slug] || <Zap className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {plan.job_limit === -1 ? 'Unlimited' : plan.job_limit} job posting{plan.job_limit !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.price_monthly === 0 ? (
                  <div>
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-4xl font-bold text-gray-900">
                      ${isYearly ? (plan.price_yearly / 12).toFixed(0) : plan.price_monthly}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                    {isYearly && (
                      <p className="text-xs text-gray-400 mt-1">
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
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto">
                {plan.slug === 'free' ? (
                  <Link
                    to="/register"
                    className="block w-full text-center py-2.5 px-4 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Get Started
                  </Link>
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

      {/* FAQ / Contact */}
      <div className="mt-16 text-center">
        <p className="text-gray-600">
          Need a custom plan or have questions?{' '}
          <a
            href="mailto:sales@hirequadrant.com"
            className="text-green-600 font-medium hover:text-green-700"
          >
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  );
};

export default Pricing;
