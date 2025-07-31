import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useCompanies } from '../contexts/CompanyContext';
import { Job } from '../contexts/JobContext';
import { MapPin, Calendar, Eye, Users, DollarSign, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { user } = useAuth();
  const { hasApplied } = useJobs();
  const { getCompanyByName } = useCompanies();

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

  const applied = user ? hasApplied(job.id, user.id) : false;
  const companyProfile = getCompanyByName(job.sourceCompany || job.company);

  return (
    <div className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:bg-white">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-secondary-900 mb-3 group-hover:text-primary-600 transition-colors duration-300">
            <Link 
              to={`/jobs/${job.id}`}
              className="hover:text-primary-500 transition-colors duration-300"
            >
              {job.title}
            </Link>
          </h3>
          <div className="flex items-center text-gray-600 mb-3">
            <span className="font-semibold text-secondary-800">
              {companyProfile ? (
                <Link 
                  to={`/companies/${companyProfile.id}`}
                  className="hover:text-primary-600 transition-colors duration-300 flex items-center"
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  {job.company}
                </Link>
              ) : (
                job.company
              )}
            </span>
            {job.sourceCompany && (
              <>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-500">
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
            <span className="mx-3 text-gray-400">•</span>
            <MapPin className="h-4 w-4 mr-1" />
            <span>{job.location}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${jobTypeColors[job.type]} shadow-sm`}>
            {getJobTypeLabel(job.type)}
          </span>
          {applied && (
            <span className="mt-3 text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">Applied</span>
          )}
        </div>
      </div>

      <div className="flex items-center text-gray-700 mb-4">
        <DollarSign className="h-4 w-4 mr-1" />
        <span className="font-bold text-secondary-900">
          {job.salary}
        </span>
      </div>

      <div className="text-gray-600 mb-6 leading-relaxed">
        <p className="line-clamp-3">
          {job.description.split('\n')[0].trim()}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <Eye className="h-4 w-4 mr-1" />
            <span>{job.views} views</span>
          </div>
          <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
            <Users className="h-4 w-4 mr-1" />
            <span>{job.applications} applications</span>
          </div>
        </div>
        <Link 
          to={`/jobs/${job.id}`}
          className="text-primary-500 hover:text-primary-600 font-semibold hover:underline transition-all duration-300"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default JobCard;