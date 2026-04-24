import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { JobProvider } from './contexts/JobContext';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';
import { ErrorBoundary } from './components/ErrorBoundary';
import Header from './components/Header';
import ProfileNudge from './components/ProfileNudge';
import { ScrollToTop } from './components/ScrollToTop';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import PasswordReset from './pages/PasswordReset';
import ProfilePage from './pages/ProfilePage';
import SavedJobs from './pages/SavedJobs';
import Onboarding from './pages/Onboarding';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Support from './pages/Support';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';

// Heavier / less-visited routes are lazy-loaded to keep the main bundle small.
const CompanyProfile = lazy(() => import('./components/CompanyProfile'));
const Admin = lazy(() => import('./pages/Admin'));
const XMLFeederAdmin = lazy(() => import('./components/XMLFeederAdmin'));
const CompanySourceManager = lazy(() => import('./components/CompanySourceManager'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const JobAlerts = lazy(() => import('./pages/JobAlerts'));
const ResumeSearch = lazy(() => import('./pages/ResumeSearch'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const CareerPath = lazy(() => import('./pages/CareerPath'));
const AdvancedSearch = lazy(() => import('./pages/AdvancedSearch'));
const Companies = lazy(() => import('./pages/Companies'));
const IndustryPage = lazy(() => import('./pages/IndustryPage'));
const LocationPage = lazy(() => import('./pages/LocationPage'));
const ReviewModeration = lazy(() => import('./pages/ReviewModeration'));
const ReviewReports = lazy(() => import('./pages/ReviewReports'));
const MyJobs = lazy(() => import('./pages/MyJobs'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MyReviews = lazy(() => import('./pages/MyReviews'));
const Demographics = lazy(() => import('./pages/Demographics'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
  </div>
);

const PageTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useGoogleAnalytics();
  return <>{children}</>;
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CompanyProvider>
          <JobProvider>
            <ErrorBoundary>
              <Router>
                <ScrollToTop />
                <PageTracker>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <ProfileNudge />
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/job/:slug" element={<JobDetails />} />
                <Route path="/companies/:id" element={<CompanyProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<PasswordReset />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/reviews" element={<ReviewModeration />} />
                <Route path="/admin/reports" element={<ReviewReports />} />
                <Route path="/xml-feeder" element={<XMLFeederAdmin />} />
                <Route path="/company-sources" element={<CompanySourceManager />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/company-dashboard" element={<CompanyDashboard />} />
                <Route path="/saved" element={<SavedJobs />} />
                <Route path="/alerts" element={<JobAlerts />} />
                <Route path="/my-jobs" element={<MyJobs />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/my-reviews" element={<MyReviews />} />
                <Route path="/demographics" element={<Demographics />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<Support />} />
                <Route path="/advanced-search" element={<AdvancedSearch />} />
                <Route path="/career" element={<CareerPath />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/industry/:industrySlug" element={<IndustryPage />} />
                <Route path="/jobs/location/:locationSlug" element={<LocationPage />} />
                <Route path="/talent-search" element={<ResumeSearch />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/support" element={<Support />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    <Footer />
                  </div>
                </PageTracker>
              </Router>
            </ErrorBoundary>
          </JobProvider>
        </CompanyProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
