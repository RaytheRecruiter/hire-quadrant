import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useCompanies } from '../contexts/CompanyContext';
import { Job } from '../contexts/JobContext';
import { MapPin, Calendar, DollarSign, Building2 } from 'lucide-react';
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
            default: return 'Full Time';
        }
    };

    const companyProfile = getCompanyByName(job.company);

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/20 p-6 flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${jobTypeColors[job.type] || 'bg-gray-100 text-gray-800'}`}>
                        {getJobTypeLabel(job.type)}
                    </span>
                    {user && hasApplied(job.id, user.id) && (
                        <span className="text-green-600 text-sm font-medium">Applied</span>
                    )}
                </div>

                <Link to={`/jobs/${job.id}`} className="block">
                    <h3 className="text-xl font-bold text-secondary-900 hover:text-primary-600 transition-colors duration-300">
                        {job.title}
                    </h3>
                </Link>

                <div className="flex items-center text-gray-700 mt-2 mb-4">
                    {companyProfile ? (
                        <Link to={`/companies/${companyProfile.id}`} className="flex items-center hover:text-primary-600 transition-colors duration-300">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span className="font-semibold text-secondary-800">{job.company}</span>
                        </Link>
                    ) : (
                        <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span className="font-semibold text-secondary-800">{job.company}</span>
                        </div>
                    )}
                    <span className="mx-2 text-gray-400">•</span>
                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-gray-600">{job.location}</span>
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
                    </div>
                    <Link
                        to={`/jobs/${job.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200 flex items-center"
                    >
                        View Details →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default JobCard;