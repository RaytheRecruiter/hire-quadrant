// Stripe integration infrastructure -- inactive until VITE_STRIPE_ENABLED is set
const STRIPE_ENABLED = import.meta.env.VITE_STRIPE_ENABLED === 'true';
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

export const isStripeEnabled = (): boolean => {
  return STRIPE_ENABLED && !!STRIPE_PUBLISHABLE_KEY;
};

// Placeholder: Create a Stripe Checkout Session
// In production, this would call a Supabase Edge Function that creates
// a Stripe Checkout Session on the server side
export const createCheckoutSession = async (planId: string, companyId: string): Promise<string | null> => {
  if (!isStripeEnabled()) {
    console.warn('Stripe is not enabled. Set VITE_STRIPE_ENABLED=true and VITE_STRIPE_PUBLISHABLE_KEY to activate.');
    return null;
  }

  // Suppress unused variable warnings in the placeholder
  void planId;
  void companyId;

  // Future implementation:
  // 1. Call Supabase Edge Function: supabase.functions.invoke('create-checkout-session', { body: { planId, companyId } })
  // 2. The Edge Function creates a Stripe Checkout Session using the secret key
  // 3. Return the session URL for redirect
  return null;
};

// Placeholder: Handle Stripe webhook events
// This would be implemented as a Supabase Edge Function at:
// supabase/functions/stripe-webhook/index.ts
// Events to handle:
// - checkout.session.completed -> activate subscription
// - customer.subscription.updated -> update subscription status
// - customer.subscription.deleted -> cancel subscription
// - invoice.payment_failed -> set status to past_due

export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
] as const;
