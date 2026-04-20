import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Grid3X3, User, LogOut, BarChart3, FileText, Building2, Bookmark, Bell, Search, BookOpen,
  ChevronDown, Menu, X, Settings, Briefcase, Sparkles
} from 'lucide-react';
import { getInitials, colorFromString } from '../utils/companyLogo';
import DarkModeToggle from './DarkModeToggle';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, isCompany } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  // Click-outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) setAdminMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const navClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      isActive(path) ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30' : 'text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-slate-800'
    }`;

  const mainNav = (
    <>
      <Link to="/" className={navClass('/')}>Jobs</Link>
      <Link to="/blog" className={navClass('/blog')}>Blog</Link>
      <Link to="/pricing" className={navClass('/pricing')}>Pricing</Link>
    </>
  );

  const initials = user ? getInitials(user.name) : '';
  const avatarColor = user ? colorFromString(user.name || user.email) : 'bg-gray-100 text-gray-500';

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="p-1.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-soft">
              <Grid3X3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-secondary-900 dark:text-white hidden sm:inline">Hire Quadrant</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNav}
            {isCompany && <Link to="/talent-search" className={navClass('/talent-search')}>Talent Search</Link>}
            {isCompany && <Link to="/company-dashboard" className={navClass('/company-dashboard')}>Dashboard</Link>}
            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setAdminMenuOpen(v => !v)}
                  className={`flex items-center gap-1 ${navClass('/admin')}`}
                >
                  <Settings className="h-4 w-4" />
                  Admin
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-card-hover border border-gray-100 dark:border-slate-700 py-1 animate-fade-in">
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setAdminMenuOpen(false)}>
                      <BarChart3 className="h-4 w-4 text-gray-400" /> Admin Dashboard
                    </Link>
                    <Link to="/talent-search" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setAdminMenuOpen(false)}>
                      <Search className="h-4 w-4 text-gray-400" /> Talent Search
                    </Link>
                    <Link to="/xml-feeder" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setAdminMenuOpen(false)}>
                      <FileText className="h-4 w-4 text-gray-400" /> XML Feeder
                    </Link>
                    <Link to="/company-sources" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setAdminMenuOpen(false)}>
                      <Building2 className="h-4 w-4 text-gray-400" /> Company Sources
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right: Auth actions */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                {!isAdmin && !isCompany && (
                  <>
                    <Link to="/saved" title="Saved jobs" className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors">
                      <Bookmark className="h-5 w-5" />
                    </Link>
                    <Link to="/alerts" title="Job alerts" className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors">
                      <Bell className="h-5 w-5" />
                    </Link>
                  </>
                )}

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className={`h-9 w-9 rounded-full ${avatarColor} flex items-center justify-center font-display font-bold text-sm hover:ring-2 hover:ring-primary-300 transition-all`}
                  >
                    {initials}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-card-hover border border-gray-100 dark:border-slate-700 py-1 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-sm font-semibold text-secondary-900 truncate">{user?.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                      </div>
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                        <User className="h-4 w-4 text-gray-400" /> Profile
                      </Link>
                      {!isAdmin && !isCompany && (
                        <>
                          <Link to="/saved" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                            <Bookmark className="h-4 w-4 text-gray-400" /> Saved Jobs
                          </Link>
                          <Link to="/alerts" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                            <Bell className="h-4 w-4 text-gray-400" /> Job Alerts
                          </Link>
                        </>
                      )}
                      {isCompany && (
                        <Link to="/company-dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                          <Briefcase className="h-4 w-4 text-gray-400" /> Company Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-secondary-700 hover:text-primary-600 px-4 py-2 text-sm font-semibold transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-soft hover:shadow-card-hover transition-all">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-secondary-700 hover:bg-gray-50"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link to="/" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Jobs</Link>
            <Link to="/blog" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Blog</Link>
            <Link to="/pricing" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Pricing</Link>
            {isAuthenticated && !isAdmin && !isCompany && (
              <>
                <Link to="/saved" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">
                  <Bookmark className="h-4 w-4 text-gray-400" /> Saved Jobs
                </Link>
                <Link to="/alerts" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">
                  <Bell className="h-4 w-4 text-gray-400" /> Job Alerts
                </Link>
              </>
            )}
            {isCompany && (
              <>
                <Link to="/company-dashboard" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Dashboard</Link>
                <Link to="/talent-search" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Talent Search</Link>
              </>
            )}
            {isAdmin && (
              <>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</div>
                <Link to="/admin" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Admin Dashboard</Link>
                <Link to="/talent-search" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Talent Search</Link>
                <Link to="/xml-feeder" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">XML Feeder</Link>
                <Link to="/company-sources" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Company Sources</Link>
              </>
            )}
            {!isAuthenticated && (
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
                <Link to="/login" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold text-center border border-gray-200 hover:bg-gray-50">
                  Sign in
                </Link>
                <Link to="/register" className="block px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center shadow-soft">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
