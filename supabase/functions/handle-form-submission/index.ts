import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

interface ContactFormSubmission {
  type: 'contact' | 'newsletter';
  name?: string;
  email: string;
  category?: string;
  subject?: string;
  message?: string;
  honeypot?: string; // Anti-spam
  timestamp?: number;
}

// Anti-spam checks
function isSpam(data: ContactFormSubmission): string | null {
  // Check honeypot field
  if (data.honeypot && data.honeypot.length > 0) {
    return 'Honeypot triggered';
  }

  // Check submission speed (must take > 3 seconds)
  if (data.timestamp && Date.now() - data.timestamp < 3000) {
    return 'Submission too fast';
  }

  // Check for gibberish (vowel/consonant ratio)
  const message = (data.message || '') + (data.name || '');
  const vowels = (message.match(/[aeiouAEIOU]/g) || []).length;
  const consonants = (message.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
  const ratio = vowels / (vowels + consonants || 1);
  if (ratio < 0.2 || ratio > 0.8) {
    return 'Invalid text pattern';
  }

  // Check for no-space strings (common bot pattern)
  if (data.message && !/\s/.test(data.message) && data.message.length > 20) {
    return 'No-space gibberish detected';
  }

  // Check for 4+ dots in email local part (Gmail dot trick abuse)
  const emailLocal = (data.email || '').split('@')[0];
  if ((emailLocal.match(/\./g) || []).length >= 4) {
    return 'Email dot trick detected';
  }

  return null;
}

// Email validation
function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = (await req.json()) as ContactFormSubmission;

    // Validate required fields
    if (!data.email || !data.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email
    if (!isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Anti-spam check (silent rejection for bots)
    const spamReason = isSpam(data);
    if (spamReason) {
      console.warn(`Spam detected: ${spamReason}`);
      // Return success to bots so they don't adapt
      return new Response(
        JSON.stringify({ ok: true, message: 'Form submitted' }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    // Check for duplicate submission (same email + message within 1 hour)
    if (data.type === 'contact' && data.message) {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const { data: existingSubmission } = await supabase
        .from('form_submissions')
        .select('id')
        .eq('email', data.email)
        .eq('message', data.message)
        .gte('created_at', oneHourAgo.toISOString())
        .limit(1)
        .maybeSingle();

      if (existingSubmission) {
        // Silent rejection for duplicate (return success)
        return new Response(
          JSON.stringify({ ok: true, message: 'Form submitted' }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    }

    // Store submission in database
    const { error: dbError } = await supabase.from('form_submissions').insert({
      type: data.type,
      name: data.name || null,
      email: data.email,
      category: data.category || null,
      subject: data.subject || null,
      message: data.message || null,
      ip_hash: req.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date(),
    });

    if (dbError) {
      console.error('DB error:', dbError);
      // Still return success to prevent form resubmission on client
    }

    // Send appropriate email
    if (data.type === 'contact') {
      // Send confirmation email to user
      await supabase.functions.invoke('send-email', {
        body: {
          to: data.email,
          subject: `We received your message - ${data.subject || 'HireQuadrant'}`,
          template: 'contact_confirmation',
          variables: {
            name: data.name || 'there',
            subject: data.subject,
            supportEmail: 'support@hirequadrant.com',
          },
        },
      });

      // Send notification email to support
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'support@hirequadrant.com',
          subject: `New contact form: ${data.subject || 'General inquiry'}`,
          template: 'contact_notification',
          variables: {
            name: data.name,
            email: data.email,
            category: data.category,
            subject: data.subject,
            message: data.message,
          },
        },
      });
    } else if (data.type === 'newsletter') {
      // Send newsletter confirmation
      await supabase.functions.invoke('send-email', {
        body: {
          to: data.email,
          subject: 'Welcome to HireQuadrant Weekly',
          template: 'newsletter_confirmation',
          variables: {
            unsubscribeUrl: `${Deno.env.get('SITE_URL')}/unsubscribe?email=${encodeURIComponent(data.email)}`,
          },
        },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Form submitted successfully',
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Form submission error:', error);
    // Still return success to prevent client retry
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Form submitted',
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
});
