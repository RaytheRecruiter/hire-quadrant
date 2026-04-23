import React from 'react';
import { Linkedin, Twitter, Facebook, Mail, MessageCircle } from 'lucide-react';

interface ShareJobBoxProps {
  title: string;
  company?: string;
  url: string;
}

const ShareJobBox: React.FC<ShareJobBoxProps> = ({ title, company, url }) => {
  const encodedUrl = encodeURIComponent(url);
  const summary = company ? `${title} at ${company}` : title;
  const encodedSummary = encodeURIComponent(summary);
  const encodedShareText = encodeURIComponent(`Check out this job: ${summary} — ${url}`);

  const items = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
    },
    {
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedSummary}&url=${encodedUrl}`,
      icon: Twitter,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
    },
    {
      label: 'Email',
      href: `mailto:?subject=${encodedSummary}&body=${encodedShareText}`,
      icon: Mail,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedShareText}`,
      icon: MessageCircle,
    },
  ];

  return (
    <div className="bg-primary-50 dark:bg-slate-800 border border-primary-100 dark:border-slate-700 rounded-2xl p-6">
      <p className="text-secondary-900 dark:text-white font-semibold mb-3">Share this job</p>
      <div className="flex items-center gap-5">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${item.label}`}
            title={`Share on ${item.label}`}
            className="text-secondary-900 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <item.icon className="h-6 w-6" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default ShareJobBox;
