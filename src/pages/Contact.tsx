import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Send, Phone, MapPin, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', category: 'general', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      // IMPORTANT: Replace YOUR_FORM_ID with actual Formspree form ID
      // Create one at: https://formspree.io/
      const FORMSPREE_ID = 'YOUR_FORM_ID';

      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          category: form.category,
          subject: form.subject,
          message: form.message,
          _replyto: form.email,
        }),
      });

      if (response.ok) {
        toast.success('Message sent! We\'ll get back to you within 24 hours.');
        setForm({ name: '', email: '', category: 'general', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again or email support@hirequadrant.com');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Error sending message. Please email support@hirequadrant.com directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us — HireQuadrant</title>
        <meta name="description" content="Get in touch with the HireQuadrant team. We'd love to hear from you." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Have a question or issue? We're here to help. Reach out via email, phone, or the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Email</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">support@hirequadrant.com</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">Response within 24 hours</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Live Chat</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Available during business hours</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">Mon-Fri, 9am-6pm EST</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Status Page</h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Check system status</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">status.hirequadrant.com</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-white/20 dark:border-slate-700 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Support / Bug Report</option>
                    <option value="partnership">Partnership</option>
                    <option value="sales">Sales</option>
                    <option value="recruiting">Job Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                    placeholder="Brief subject..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  Message *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 resize-none"
                  placeholder="Tell us more. Please include as much detail as possible..."
                />
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                  💡 Tip: Be specific about your issue. Include error messages or steps to reproduce if applicable.
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-soft hover:shadow-card-hover disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                Or reach out directly:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-primary-500" />
                  <a href="mailto:hello@hirequadrant.com" className="hover:text-primary-500 transition">
                    hello@hirequadrant.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-primary-500" />
                  <a href="mailto:employers@hirequadrant.com" className="hover:text-primary-500 transition">
                    employers@hirequadrant.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
