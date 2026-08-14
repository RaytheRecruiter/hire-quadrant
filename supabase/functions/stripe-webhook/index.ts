import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Maximum age of a Stripe webhook we'll accept. Stripe's own libraries use 5 min.
// Rejecting older events defends against replay of previously-intercepted webhooks.
const WEBHOOK_TOLERANCE_SECONDS = 300;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyStripeSignature(
  body: string,
  signature: string,
  signingSecret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',');
    let timestamp = '';
    let sig = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') sig = value;
    }

    if (!timestamp || !sig) return false;

    // Reject events older than the tolerance window (replay defense).
    const eventSeconds = Number(timestamp);
    if (!Number.isFinite(eventSeconds)) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - eventSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
      console.error(`Stripe webhook timestamp outside tolerance: event=${eventSeconds}, now=${nowSeconds}`);
      return false;
    }

    const signedContent = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(signingSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const computed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
    const computedSig = Array.from(new Uint8Array(computed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return timingSafeEqual(computedSig, sig);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const signature = req.headers.get('stripe-signature');
    const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !signingSecret) {
      return new Response(JSON.stringify({ error: 'Missing webhook credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();

    const verified = await verifyStripeSignature(body, signature, signingSecret);
    if (!verified) {
      console.error('Invalid Stripe signature');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const event = JSON.parse(body);

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      // Fired once at the end of a successful Checkout — the only place we
      // reliably learn *which* company and plan/credit-pack this purchase
      // is for, via the metadata set in create-checkout-session.
      case 'checkout.session.completed': {
        const session = event.data.object;
        const companyId = session.metadata?.companyId || session.client_reference_id;

        if (!companyId) {
          console.error('checkout.session.completed missing companyId metadata', session.id);
          break;
        }

        if (session.mode === 'subscription') {
          const planId = session.metadata?.planId;
          const billingFrequency = session.metadata?.billingFrequency === 'annual' ? 'annual' : 'monthly';

          const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
            headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
          });
          const stripeSub = await subRes.json();

          await supabase.from('subscriptions').upsert(
            {
              company_id: companyId,
              plan_id: planId,
              status: stripeSub.status,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              billing_frequency: billingFrequency,
              current_period_start: new Date(stripeSub.current_period_start * 1000),
              current_period_end: new Date(stripeSub.current_period_end * 1000),
              updated_at: new Date(),
            },
            { onConflict: 'company_id' }
          );
        } else if (session.mode === 'payment') {
          // One-time "buy more contacts" credit pack purchase.
          const credits = parseInt(session.metadata?.creditAmount || '0', 10);
          if (credits > 0) {
            const { data: existing } = await supabase
              .from('subscriptions')
              .select('purchased_contacts_remaining')
              .eq('company_id', companyId)
              .maybeSingle();

            await supabase
              .from('subscriptions')
              .update({
                purchased_contacts_remaining: (existing?.purchased_contacts_remaining || 0) + credits,
                updated_at: new Date(),
              })
              .eq('company_id', companyId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date(),
          })
          .eq('stripe_customer_id', invoice.customer);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({
        received: true,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
