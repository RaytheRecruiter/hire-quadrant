import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Grid3X3, User, LogOut, BarChart3, FileText, Building2, Bookmark, Bell, Search, BookOpen } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin, isCompany } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl mr-3 shadow-lg">
                <Grid3X3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">Hire Quadrant</span>
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-secondary-800 font-medium">Welcome, <span className="font-bold">{user?.name}</span>!</span>
                {/* Conditionally render the Profile link when authenticated */}
                <Link
                  to="/profile"
                  className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                >
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                {!isAdmin && !isCompany && (
                  <>
                    <Link
                      to="/saved"
                      className="flex items-center text-secondary-700 hover:text-primary-500 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                    >
                      <Bookmark className="h-4 w-4 mr-1" />
                      Saved
                    </Link>
                    <Link
                      to="/alerts"
                      className="flex items-center text-secondary-700 hover:text-primary-500 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Alerts
                    </Link>
                  </>
                )}
                {(isCompany || isAdmin) && (
                  <Link
                    to="/talent-search"
                    className="flex items-center text-secondary-700 hover:text-primary-500 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Talent Search
                  </Link>
                )}
                <Link
                  to="/blog"
                  className="flex items-center text-secondary-700 hover:text-primary-500 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Blog
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Admin Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/xml-feeder"
                    className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    XML Feeder
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/company-sources"
                    className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Sources
                  </Link>
                )}
                {isCompany && (
                  <Link
                    to="/company-dashboard"
                    className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Company Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center text-secondary-700 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/blog"
                  className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Blog
                </Link>
                <Link
                  to="/login"
                  className="flex items-center text-secondary-700 hover:text-primary-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:bg-primary-50"
                >
                  <User className="h-4 w-4 mr-1" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
