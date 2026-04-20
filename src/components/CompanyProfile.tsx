import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompanies } from '../contexts/CompanyContext';
import { useJobs } from '../contexts/JobContext';
import { ArrowLeft, MapPin, Users, Calendar, Globe, Mail, Building2, Award, Heart, Briefcase } from 'lucide-react';
import JobCard from './JobCard';
import CompanyReviews from './CompanyReviews';

const CompanyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCompanyById } = useCompanies();
  const { jobs } = useJobs();

  const company = id ? getCompanyById(id) : undefined;

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  // Get jobs from this company
  const companyJobs = jobs.filter(job => 
    job.sourceCompany === company.name || 
    job.sourceCompany === company.displayName ||
    job.company === company.name ||
    job.company === company.displayName
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-8 font-semibold bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </button>

        {/* Company Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-primary-400 to-primary-600"></div>
            
            {/* Company Info */}
            <div className="relative px-8 pb-8">
              {/* Logo */}
              <div className="absolute -top-16 left-8">
                <div className="w-32 h-32 bg-white rounded-2xl shadow-lg border-4 border-white overflow-hidden">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={`${company.displayName} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-primary-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-20">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-secondary-900 mb-2">{company.displayName}</h1>
                    <p className="text-xl text-gray-600 mb-4">{company.industry}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{company.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{company.size}</span>
                      </div>
                      {company.founded && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Founded {company.founded}</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-1" />
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}
                      {company.contactEmail && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          <a 
                            href={`mailto:${company.contactEmail}`}
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            Contact
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{companyJobs.length}</div>
                      <div className="text-sm text-gray-600">Open Positions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">About {company.displayName}</h2>
              <p className="text-gray-700 leading-relaxed">{company.description}</p>
            </div>

            {/* Culture */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-2xl font-bold text-secondary-900">Our Culture</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">{company.culture}</p>
            </div>

            <CompanyReviews companyId={company.id} companyName={company.displayName || company.name} />

            {/* Open Positions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <Briefcase className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-2xl font-bold text-secondary-900">Open Positions ({companyJobs.length})</h2>
              </div>
              
              {companyJobs.length > 0 ? (
                <div className="space-y-6">
                  {companyJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No open positions at the moment</div>
                  <div className="text-sm text-gray-400">Check back later for new opportunities</div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Specialties */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center mb-4">
                <Award className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-secondary-900">Specialties</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.specialties.map((specialty, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Benefits & Perks</h3>
              <ul className="space-y-2">
                {company.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-400 mr-2 text-sm">•</span>
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;