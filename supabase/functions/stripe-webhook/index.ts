import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

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

    return computedSig === sig;
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
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Get customer email from Stripe
        const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
        const customerRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: {
            Authorization: `Bearer ${stripeApiKey}`,
          },
        });
        const customer = await customerRes.json();

        // Find user by email
        const { data: user } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', customer.email)
          .maybeSingle();

        if (user) {
          // Update subscription status in DB
          await supabase.from('user_subscriptions').upsert({
            user_id: user.user_id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan: subscription.items.data[0]?.plan.nickname || 'unknown',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            updated_at: new Date(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Mark subscription as canceled
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        // Log successful payment
        await supabase.from('payment_logs').insert({
          stripe_invoice_id: invoice.id,
          stripe_customer_id: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          created_at: new Date(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        // Log failed payment
        await supabase.from('payment_logs').insert({
          stripe_invoice_id: invoice.id,
          stripe_customer_id: invoice.customer,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          error_message: invoice.last_stripe_error?.message || 'Unknown error',
          created_at: new Date(),
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;

        // Log refund
        await supabase.from('payment_logs').insert({
          stripe_invoice_id: charge.invoice || null,
          stripe_customer_id: charge.customer,
          amount: charge.amount_refunded,
          currency: charge.currency,
          status: 'refunded',
          created_at: new Date(),
        });
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
