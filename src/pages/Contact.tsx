import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('https://formspree.io/f/xyzpqwer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      if (response.ok) {
        toast.success('Message sent! We'll get back to you soon.');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (err) {
      toast.error('Error sending message. Please email us directly.');
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-white/20 dark:border-slate-700 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white"
                  placeholder="Your message..."
                />
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
