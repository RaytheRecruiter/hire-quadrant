import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { JobProvider } from './contexts/JobContext';
import Header from './components/Header';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import CompanyProfile from './components/CompanyProfile'; // <-- Corrected path
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import XMLFeederAdmin from './components/XMLFeederAdmin';
import CompanySourceManager from './components/CompanySourceManager';
import ProfilePage from './pages/ProfilePage'; // <-- Corrected path
import CompanyDashboard from './pages/CompanyDashboard';
import Pricing from './pages/Pricing';
import SavedJobs from './pages/SavedJobs';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <JobProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/companies/:id" element={<CompanyProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/xml-feeder" element={<XMLFeederAdmin />} />
                <Route path="/company-sources" element={<CompanySourceManager />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/company-dashboard" element={<CompanyDashboard />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/saved" element={<SavedJobs />} />
              </Routes>
            </div>
          </Router>
        </JobProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
