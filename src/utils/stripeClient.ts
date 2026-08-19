import { supabase } from './supabaseClient';

// Stripe integration -- checkout stays disabled until VITE_STRIPE_ENABLED is
// set and a publishable key is configured (no Stripe account exists yet).
const STRIPE_ENABLED = import.meta.env.VITE_STRIPE_ENABLED === 'true';
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export const isStripeEnabled = (): boolean => {
  return STRIPE_ENABLED && !!STRIPE_PUBLISHABLE_KEY;
};

interface CreateCheckoutSessionArgs {
  mode: 'subscription' | 'payment';
  priceIds: string[];
  metadata?: Record<string, string>;
}

async function invokeCheckout({ mode, priceIds, metadata }: CreateCheckoutSessionArgs): Promise<string | null> {
  if (!isStripeEnabled()) {
    console.warn('Stripe is not enabled. Set VITE_STRIPE_ENABLED=true and VITE_STRIPE_PUBLISHABLE_KEY to activate.');
    return null;
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      mode,
      priceIds,
      successUrl: `${window.location.origin}${window.location.pathname}?checkout=success`,
      cancelUrl: `${window.location.origin}${window.location.pathname}?checkout=canceled`,
      metadata,
    },
  });

  if (error) {
    console.error('Failed to create checkout session:', error);
    return null;
  }

  return data?.url || null;
}

// Resume Database plan subscribe/change-plan checkout.
export const createCheckoutSession = async (
  stripePriceId: string,
  planId: string,
  billingFrequency: 'monthly' | 'annual'
): Promise<string | null> => {
  return invokeCheckout({
    mode: 'subscription',
    priceIds: [stripePriceId],
    metadata: { planId, billingFrequency },
  });
};

// One-time "buy more contacts" credit pack purchase.
export const createAddOnCheckoutSession = async (
  stripePriceId: string,
  creditAmount: number
): Promise<string | null> => {
  return invokeCheckout({
    mode: 'payment',
    priceIds: [stripePriceId],
    metadata: { creditAmount: String(creditAmount) },
  });
};

interface SponsorshipTierArgs {
  stripePriceId: string;
  tier: number;
  durationDays: number;
  priceCents: number;
}

interface UrgentAddonArgs {
  stripePriceId: string;
  durationDays: number;
  priceCents: number;
}

// Job sponsorship purchase — tier is required, Urgent Hiring add-on is
// optional and bundled as a second Checkout line item in the same session.
export const createJobSponsorshipCheckout = async (
  jobId: string,
  tierArgs: SponsorshipTierArgs,
  urgentAddon?: UrgentAddonArgs
): Promise<string | null> => {
  const priceIds = [tierArgs.stripePriceId];
  if (urgentAddon) priceIds.push(urgentAddon.stripePriceId);

  return invokeCheckout({
    mode: 'payment',
    priceIds,
    metadata: {
      purchaseType: 'job_sponsorship',
      jobId,
      tier: String(tierArgs.tier),
      durationDays: String(tierArgs.durationDays),
      tierPriceCents: String(tierArgs.priceCents),
      addonUrgent: urgentAddon ? 'true' : 'false',
      ...(urgentAddon
        ? {
            addonDurationDays: String(urgentAddon.durationDays),
            addonPriceCents: String(urgentAddon.priceCents),
          }
        : {}),
    },
  });
};

interface ManageSubscriptionResult {
  success: boolean;
  error?: string;
}

async function invokeManageSubscription(body: Record<string, unknown>): Promise<ManageSubscriptionResult> {
  const { data, error } = await supabase.functions.invoke('manage-subscription', { body });
  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true };
}

// In-place, prorated plan change for an existing Resume Database
// subscriber. Do NOT use createCheckoutSession for this — that always
// starts a brand new Stripe subscription instead of modifying theirs.
export const changePlan = async (
  planId: string,
  billingFrequency: 'monthly' | 'annual'
): Promise<ManageSubscriptionResult> => {
  return invokeManageSubscription({ action: 'change_plan', planId, billingFrequency });
};

export const cancelSubscription = async (): Promise<ManageSubscriptionResult> => {
  return invokeManageSubscription({ action: 'cancel' });
};

export const resumeSubscription = async (): Promise<ManageSubscriptionResult> => {
  return invokeManageSubscription({ action: 'resume' });
};

export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
] as const;
