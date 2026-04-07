import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  job_limit: number;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive';
  job_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface SubscriptionWithCompany extends Subscription {
  companies?: {
    name: string;
    display_name: string;
  };
  subscription_plans?: SubscriptionPlan & {
    name: string;
    slug: string;
  };
}

interface UseSubscriptionOptions {
  companyId?: string;
  isAdmin?: boolean;
}

interface UseSubscriptionReturn {
  plans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
  allSubscriptions: SubscriptionWithCompany[];
  loading: boolean;
  error: string | null;
  assignPlan: (companyId: string, planId: string) => Promise<boolean>;
  jobsUsed: number;
  jobsRemaining: number;
  refetch: () => Promise<void>;
}

export const useSubscription = (options: UseSubscriptionOptions = {}): UseSubscriptionReturn => {
  const { companyId, isAdmin = false } = options;

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<SubscriptionWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobsUsed, setJobsUsed] = useState(0);

  const fetchPlans = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (fetchError) {
      console.error('Error fetching plans:', fetchError);
      throw fetchError;
    }

    // Parse features from JSON if needed
    const parsedPlans = (data || []).map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
    }));

    setPlans(parsedPlans);
  }, []);

  const fetchCurrentSubscription = useCallback(async () => {
    if (!companyId) return;

    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('company_id', companyId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine (no subscription yet)
      console.error('Error fetching subscription:', fetchError);
      throw fetchError;
    }

    setCurrentSubscription(data || null);
  }, [companyId]);

  const fetchAllSubscriptions = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, companies(name, display_name), subscription_plans(name, slug)');

    if (fetchError) {
      console.error('Error fetching all subscriptions:', fetchError);
      throw fetchError;
    }

    setAllSubscriptions(data || []);
  }, [isAdmin]);

  const fetchJobsUsed = useCallback(async () => {
    if (!companyId) return;

    // Count active jobs for this company
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting jobs:', countError);
      return;
    }

    setJobsUsed(count || 0);
  }, [companyId]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchPlans(),
        fetchCurrentSubscription(),
        fetchAllSubscriptions(),
        fetchJobsUsed(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [fetchPlans, fetchCurrentSubscription, fetchAllSubscriptions, fetchJobsUsed]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const assignPlan = async (targetCompanyId: string, planId: string): Promise<boolean> => {
    try {
      setError(null);

      // Find the plan to get its job_limit
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        setError('Plan not found');
        return false;
      }

      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(
          {
            company_id: targetCompanyId,
            plan_id: planId,
            status: 'active',
            job_limit: plan.job_limit,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id' }
        );

      if (upsertError) {
        throw upsertError;
      }

      // Refresh data
      await fetchAll();
      return true;
    } catch (err: any) {
      console.error('Error assigning plan:', err);
      setError(err.message || 'Failed to assign plan');
      return false;
    }
  };

  const jobsRemaining = currentSubscription
    ? currentSubscription.job_limit === -1
      ? -1 // Unlimited
      : Math.max(0, currentSubscription.job_limit - jobsUsed)
    : 0;

  return {
    plans,
    currentSubscription,
    allSubscriptions,
    loading,
    error,
    assignPlan,
    jobsUsed,
    jobsRemaining,
    refetch: fetchAll,
  };
};
