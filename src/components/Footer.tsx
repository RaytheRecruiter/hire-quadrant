import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Twitter, Github } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-900 dark:bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-4">HireQuadrant</h3>
            <p className="text-sm text-gray-300">
              Work with employers who show up.
            </p>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-semibold mb-4 text-white">For Candidates</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-white transition">Browse Jobs</Link></li>
              <li><Link to="/saved" className="hover:text-white transition">Saved Jobs</Link></li>
              <li><Link to="/alerts" className="hover:text-white transition">Job Alerts</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link to="/blog" className="hover:text-white transition">Career Blog</Link></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-semibold mb-4 text-white">For Employers</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="mailto:employers@hirequadrant.com" className="hover:text-white transition">Post a Job</a></li>
              <li><Link to="/pricing" className="hover:text-white transition">Plans & Pricing</Link></li>
              <li><a href="mailto:sales@hirequadrant.com" className="hover:text-white transition">Contact Sales</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/about" className="hover:text-white transition">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Social + Copyright */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-300 mb-4 md:mb-0">
            © {currentYear} HireQuadrant. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="mailto:hello@hirequadrant.com" className="text-gray-300 hover:text-white transition">
              <Mail className="h-5 w-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
