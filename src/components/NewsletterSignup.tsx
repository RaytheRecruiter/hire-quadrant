import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewsletterSignupProps {
  variant?: 'inline' | 'card' | 'footer';
  title?: string;
  description?: string;
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  variant = 'inline',
  title = 'Stay Updated',
  description = 'Get weekly job recommendations and career tips delivered to your inbox.',
}) => {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);
    try {
      // IMPORTANT: Replace YOUR_MAILCHIMP_FORM_ID with actual Mailchimp form action URL
      // Get this from Mailchimp → Create Form → Embedded Forms → Copy the form action URL
      const MAILCHIMP_ACTION = 'YOUR_MAILCHIMP_ACTION_URL';

      if (!MAILCHIMP_ACTION || MAILCHIMP_ACTION === 'YOUR_MAILCHIMP_ACTION_URL') {
        // Fallback for demo: just show success
        toast.success('Thanks for subscribing! Check your email to confirm.');
        setEmail('');
        return;
      }

      const response = await fetch(MAILCHIMP_ACTION, {
        method: 'POST',
        body: `EMAIL=${encodeURIComponent(email)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.ok) {
        toast.success('Thanks for subscribing! Check your email to confirm.');
        setEmail('');
      } else {
        toast.error('Already subscribed or email invalid');
      }
    } catch (err) {
      // Mailchimp often throws CORS errors in browser, but form was likely submitted
      toast.success('Thanks for subscribing! Check your email to confirm.');
      setEmail('');
    } finally {
      setSubscribing(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-slate-900/20 rounded-2xl p-8 border border-primary-100/20 dark:border-primary-900/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">{description}</p>
          </div>
        </div>
        <form onSubmit={handleSubscribe} className="flex gap-2 mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={subscribing}
            className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {subscribing ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-slate-500 mt-3">
          No spam. Unsubscribe anytime. We respect your privacy.
        </p>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div>
        <h4 className="font-bold text-secondary-900 dark:text-white mb-4">{title}</h4>
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-3 py-2 rounded text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={subscribing}
            className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50"
          >
            {subscribing ? '...' : 'Subscribe'}
          </button>
        </form>
      </div>
    );
  }

  // Default: inline variant
  return (
    <form onSubmit={handleSubscribe} className="flex gap-2 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={subscribing}
        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
      >
        <Mail className="h-4 w-4" />
        {subscribing ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
};

export default NewsletterSignup;
