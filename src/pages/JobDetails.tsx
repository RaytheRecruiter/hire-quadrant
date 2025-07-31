import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useCompanies } from '../contexts/CompanyContext';
import { TrackingService } from '../utils/trackingService';
import { MapPin, Calendar, DollarSign, Clock, Users, Eye, ArrowLeft, CheckCircle, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper function to format job description with proper spacing and structure
const formatJobDescription = (description: string) => {
  if (!description) return <p>No description available</p>;

  // Split by double line breaks first to preserve intentional paragraph breaks
  const sections = description.split(/\n\s*\n/);
  
  return sections.map((section, sectionIndex) => {
    // Split each section by single line breaks
    const lines = section.split('\n').filter(line => line.trim());
    
    return (
      <div key={sectionIndex} className="mb-6 last:mb-0">
        {lines.map((line, lineIndex) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null;
          
          // Check if it's a section header (ends with colon or is all caps)
          const isHeader = (trimmedLine.endsWith(':') && trimmedLine.length < 100) || 
                          (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 80 && !trimmedLine.includes('$'));
          
          if (isHeader) {
            return (
              <h3 key={lineIndex} className="font-bold text-secondary-900 text-xl mt-8 mb-4 first:mt-0">
                {trimmedLine}
              </h3>
            );
          }
          
          // Check if it's a bullet point
          const bulletMatch = trimmedLine.match(/^[•·▪▫◦‣⁃\-*]\s*(.+)$/);
          if (bulletMatch) {
            return (
              <div key={lineIndex} className="flex items-start mb-3 ml-4">
                <span className="text-primary-500 mr-3 text-lg flex-shrink-0 mt-1">•</span>
                <span className="flex-1">{bulletMatch[1]}</span>
              </div>
            );
          }
          
          // Check if it's a numbered list item
          const numberMatch = trimmedLine.match(/^(\d+\.?\s*)(.+)$/);
          if (numberMatch && trimmedLine.length < 200) {
            return (
              <div key={lineIndex} className="flex items-start mb-3 ml-4">
                <span className="text-primary-500 mr-3 font-semibold flex-shrink-0">{numberMatch[1]}</span>
                <span className="flex-1">{numberMatch[2]}</span>
              </div>
            );
          }
          
          // Regular paragraph - check if it's a continuation or new paragraph
          const isShortLine = trimmedLine.length < 100;
          const endsWithPunctuation = /[.!?]$/.test(trimmedLine);
          
          return (
            <p key={lineIndex} className={`mb-4 ${isShortLine && endsWithPunctuation ? 'mb-6' : ''}`}>
              {trimmedLine}
            </p>
          );
        })}
      </div>
    );
  });
};

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getJobById, incrementJobViews, applyToJob, hasApplied } = useJobs();
  const { getCompanyByName } = useCompanies();

  const job = id ? getJobById(id) : undefined;
  const applied = user && job ? hasApplied(job.id, user.id) : false;
  const companyProfile = job ? getCompanyByName(job.sourceCompany || job.company) : undefined;

  useEffect(() => {
    if (job && id) {
      console.log(`JobDetails: Incrementing views for job ${job.id}`);
      // Increment views asynchronously
      TrackingService.incrementJobViews(job.id);
    }
  }, [id]); // Only depend on id, so it runs once per job visit

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const jobTypeColors = {
    'full-time': 'bg-green-100 text-green-800',
    'part-time': 'bg-blue-100 text-blue-800',
    'contract': 'bg-orange-100 text-orange-800',
    'contract-to-hire': 'bg-purple-100 text-purple-800',
    'internship': 'bg-purple-100 text-purple-800'
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Direct Placement';
      case 'contract': return 'Contract';
      case 'contract-to-hire': return 'Contract to Hire';
      case 'part-time': return 'Part Time';
      case 'internship': return 'Internship';
      default: return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    }
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user && !applied) {
      applyToJob(job.id, user.id, user.name, user.email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-8 font-semibold bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4 leading-tight">{job.title}</h1>
                <div className="flex items-center text-gray-700 mb-6">
                  <span className="text-2xl font-bold text-secondary-800">
                    {companyProfile ? (
                      <Link 
                        to={`/companies/${companyProfile.id}`}
                        className="hover:text-primary-600 transition-colors duration-300 flex items-center"
                      >
                        <Building2 className="h-5 w-5 mr-2" />
                        {job.company}
                      </Link>
                    ) : (
                      job.company
                    )}
                  </span>
                  {job.sourceCompany && (
                    <>
                      <span className="mx-3 text-gray-400">•</span>
                      <span className="text-lg text-gray-600">
                        via {companyProfile ? (
                          <Link 
                            to={`/companies/${companyProfile.id}`}
                            className="hover:text-primary-600 transition-colors duration-300"
                          >
                            {job.sourceCompany}
                          </Link>
                        ) : (
                          job.sourceCompany
                        )}
                      </span>
                    </>
                  )}
                  <span className="mx-4 text-gray-400">•</span>
                  <MapPin className="h-5 w-5 mr-1" />
                  <span className="text-lg">{job.location}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{job.views} views</span>
                  </div>
                  <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{job.applications} applications</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${jobTypeColors[job.type]} mb-4 shadow-sm`}>
                  {getJobTypeLabel(job.type)}
                </span>
                {applied ? (
                  <div className="flex items-center text-green-700 bg-green-100 px-6 py-3 rounded-xl font-semibold shadow-sm">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Applied</span>
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex items-center p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl border border-primary-200">
                <div className="p-3 bg-primary-400 rounded-xl mr-4">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-primary-600 font-medium">Salary</p>
                  <p className="font-bold text-secondary-900 text-lg">{job.salary}</p>
                </div>
              </div>
              <div className="flex items-center p-6 bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-2xl border border-secondary-200">
                <div className="p-3 bg-secondary-800 rounded-xl mr-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-secondary-600 font-medium">Application Deadline</p>
                  <p className="font-bold text-secondary-900 text-lg">
                    {formatDistanceToNow(new Date(job.applicationDeadline), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-bold text-secondary-900 mb-6">Job Description</h2>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="text-gray-700 leading-relaxed text-lg">
                    {formatJobDescription(job.description)}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-secondary-900 mb-6">Requirements</h2>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <ul className="space-y-3">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start text-lg">
                      <span className="text-primary-400 mr-3 text-xl">•</span>
                      <span className="text-gray-700 leading-relaxed">{requirement}</span>
                    </li>
                  ))}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-secondary-900 mb-6">Benefits</h2>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <ul className="space-y-3">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start text-lg">
                      <span className="text-primary-400 mr-3 text-xl">•</span>
                      <span className="text-gray-700 leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              {job.sourceCompany && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Job Source:</strong> This position is provided by {companyProfile ? (
                      <Link 
                        to={`/companies/${companyProfile.id}`}
                        className="font-semibold hover:underline"
                      >
                        {job.sourceCompany}
                      </Link>
                    ) : (
                      job.sourceCompany
                    )}. 
                    When you apply, your application will be forwarded to {companyProfile ? (
                      <Link 
                        to={`/companies/${companyProfile.id}`}
                        className="font-semibold hover:underline"
                      >
                        {job.sourceCompany}
                      </Link>
                    ) : (
                      job.sourceCompany
                    )} for review.
                    {job.externalUrl && (
                      <>
                        {' '}
                        <a 
                          href={job.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View original posting
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="text-gray-600 mb-4 sm:mb-0 font-medium">
                  Apply before {new Date(job.applicationDeadline).toLocaleDateString()}
                </div>
                {!applied && (
                  <button
                    onClick={handleApply}
                    className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;