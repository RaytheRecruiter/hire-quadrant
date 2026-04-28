import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import HardLink from './HardLink';
import { useAuth } from '../contexts/AuthContext';
import {
  Grid3X3, User, LogOut, BarChart3, FileText, Building2, Bookmark, Bell, Search, BookOpen,
  ChevronDown, Menu, X, Settings, Briefcase, Sparkles, GraduationCap,
  MessageSquare, Star, Users as UsersIcon, HelpCircle, Key
} from 'lucide-react';
import { getInitials, colorFromString } from '../utils/companyLogo';
import DarkModeToggle from './DarkModeToggle';
import GlobalSearch from './GlobalSearch';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, isCompany } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const handleJobsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      e.preventDefault();
      document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Cmd+K / Ctrl+K to open global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const navClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      isActive(path) ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30' : 'text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-slate-800'
    }`;

  const initials = user ? getInitials(user.name) : '';
  const avatarColor = user ? colorFromString(user.name || user.email) : 'bg-gray-100 text-gray-500';

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <HardLink to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="p-1.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-soft">
              <Grid3X3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-secondary-900 dark:text-white hidden sm:inline">Hire Quadrant</span>
          </HardLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <HardLink to="/#jobs-section" onClick={handleJobsClick} className={navClass('/')}>Jobs</HardLink>
            <HardLink to="/career" className={navClass('/career')}>Career Paths</HardLink>
            <HardLink to="/companies" className={navClass('/companies')}>Companies</HardLink>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`${navClass('/advanced-search')} flex items-center gap-1.5`}
              aria-label="Open search"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
              <kbd className="hidden xl:inline text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-mono">⌘K</kbd>
            </button>
            <HardLink to="/blog" className={navClass('/blog')}>Blog</HardLink>
            <HardLink to="/pricing" className={navClass('/pricing')}>Pricing</HardLink>
            {isCompany && (
              <HardLink to="/company-dashboard" className={navClass('/company-dashboard')}>
                <Briefcase className="h-4 w-4 inline mr-1" />
                Dashboard
              </HardLink>
            )}
            {isCompany && (
              <HardLink to="/talent-search" className={navClass('/talent-search')}>
                Talent Search
              </HardLink>
            )}
            {isAdmin && (
              <HardLink
                to="/company-portal"
                className={`flex items-center gap-1 ${navClass('/company-portal')}`}
              >
                <Settings className="h-4 w-4" />
                Portal
              </HardLink>
            )}
          </nav>

          {/* Right: Auth actions */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                {!isAdmin && !isCompany && (
                  <>
                    <HardLink to="/my-jobs" title="My jobs" className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-secondary-700 hover:bg-gray-50 transition-colors">
                      <Briefcase className="h-4 w-4" />
                      My jobs
                    </HardLink>
                    <HardLink to="/messages" title="Messages" className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors">
                      <MessageSquare className="h-5 w-5" />
                    </HardLink>
                    <HardLink to="/notifications" title="Notifications" className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-secondary-700 hover:bg-gray-50 transition-colors">
                      <Bell className="h-5 w-5" />
                    </HardLink>
                  </>
                )}

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className={`h-9 w-9 rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-sm hover:ring-2 hover:ring-primary-300 transition-all ${user?.avatarUrl ? 'bg-gray-100' : avatarColor}`}
                    aria-label="Account menu"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'Account'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-card-hover border border-gray-100 dark:border-slate-700 py-1 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-sm font-semibold text-secondary-900 truncate">{user?.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                      </div>
                      <HardLink to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                        <User className="h-4 w-4 text-gray-400" /> Profile
                      </HardLink>
                      {!isCompany && (
                        <>
                          <HardLink to="/my-reviews" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                            <Star className="h-4 w-4 text-gray-400" /> My Reviews
                          </HardLink>
                          <HardLink to="/saved" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                            <Bookmark className="h-4 w-4 text-gray-400" /> Saved Jobs
                          </HardLink>
                          <HardLink to="/alerts" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                            <Bell className="h-4 w-4 text-gray-400" /> Job Alerts
                          </HardLink>
                        </>
                      )}
                      {isCompany && (
                        <HardLink to="/company-dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                          <Briefcase className="h-4 w-4 text-gray-400" /> Company Dashboard
                        </HardLink>
                      )}
                      <HardLink to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-100" onClick={() => setUserMenuOpen(false)}>
                        <Settings className="h-4 w-4 text-gray-400" /> Settings
                      </HardLink>
                      <HardLink to="/help" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                        <HelpCircle className="h-4 w-4 text-gray-400" /> Help
                      </HardLink>
                      <HardLink to="/reset-password" className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                        <Key className="h-4 w-4 text-gray-400" /> Reset Password
                      </HardLink>
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
                <HardLink to="/login" className="text-secondary-700 hover:text-primary-600 px-4 py-2 text-sm font-semibold transition-colors">
                  Sign in
                </HardLink>
                <HardLink to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-soft hover:shadow-card-hover transition-all">
                  Sign up
                </HardLink>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
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
            <HardLink to="/" onClick={handleJobsClick} className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Jobs</HardLink>
            <HardLink to="/companies" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Companies</HardLink>
            <HardLink to="/advanced-search" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Search</HardLink>
            <HardLink to="/blog" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Blog</HardLink>
            <HardLink to="/pricing" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Pricing</HardLink>
            {isAuthenticated && !isAdmin && !isCompany && (
              <>
                <HardLink to="/saved" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">
                  <Bookmark className="h-4 w-4 text-gray-400" /> Saved Jobs
                </HardLink>
                <HardLink to="/alerts" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">
                  <Bell className="h-4 w-4 text-gray-400" /> Job Alerts
                </HardLink>
              </>
            )}
            {isCompany && (
              <>
                <HardLink to="/company-dashboard" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Dashboard</HardLink>
                <HardLink to="/talent-search" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Talent Search</HardLink>
              </>
            )}
            {isAdmin && (
              <>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</div>
                <HardLink to="/admin" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Admin Dashboard</HardLink>
                <HardLink to="/talent-search" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Talent Search</HardLink>
                <HardLink to="/xml-feeder" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">XML Feeder</HardLink>
                <HardLink to="/company-sources" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold hover:bg-gray-50">Company Sources</HardLink>
              </>
            )}
            {!isAuthenticated && (
              <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
                <HardLink to="/login" className="block px-4 py-2.5 rounded-lg text-secondary-800 font-semibold text-center border border-gray-200 hover:bg-gray-50">
                  Sign in
                </HardLink>
                <HardLink to="/register" className="block px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center shadow-soft">
                  Sign up
                </HardLink>
              </div>
            )}
          </div>
        </div>
      )}
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Header;
