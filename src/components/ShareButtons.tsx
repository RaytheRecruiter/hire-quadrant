import React from 'react';
import { Share2, Copy, Linkedin, Twitter, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonsProps {
  title: string;
  url: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ title, url }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setShowDropdown(false);
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleTwitter = () => {
    const text = `Check out this job: ${title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this job: ${url}`)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-2 z-10 w-48">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>
          <button
            onClick={handleLinkedIn}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <Linkedin className="h-4 w-4" />
            Share on LinkedIn
          </button>
          <button
            onClick={handleTwitter}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <Twitter className="h-4 w-4" />
            Share on Twitter
          </button>
          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <Mail className="h-4 w-4" />
            Share via Email
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButtons;
