import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { JobProvider } from './contexts/JobContext';
import Header from './components/Header';
import ProfileNudge from './components/ProfileNudge';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import CompanyProfile from './components/CompanyProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import XMLFeederAdmin from './components/XMLFeederAdmin';
import CompanySourceManager from './components/CompanySourceManager';
import ProfilePage from './pages/ProfilePage';
import CompanyDashboard from './pages/CompanyDashboard';
import Pricing from './pages/Pricing';
import SavedJobs from './pages/SavedJobs';
import JobAlerts from './pages/JobAlerts';
import ResumeSearch from './pages/ResumeSearch';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Onboarding from './pages/Onboarding';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CompanyProvider>
          <JobProvider>
            <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <ProfileNudge />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/companies/:id" element={<CompanyProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/xml-feeder" element={<XMLFeederAdmin />} />
                <Route path="/company-sources" element={<CompanySourceManager />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/company-dashboard" element={<CompanyDashboard />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/saved" element={<SavedJobs />} />
                <Route path="/alerts" element={<JobAlerts />} />
                <Route path="/talent-search" element={<ResumeSearch />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </div>
            </Router>
          </JobProvider>
        </CompanyProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
