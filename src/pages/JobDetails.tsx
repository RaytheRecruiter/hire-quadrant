import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useCompanies } from '../contexts/CompanyContext';
import { supabase } from '../utils/supabaseClient';
import { MapPin, Calendar, DollarSign, Clock, Users, Eye, ArrowLeft, CheckCircle, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Session-level deduplication so a user doesn't inflate views by refreshing
const viewedJobIds = new Set<string>();

const formatJobDescription = (description: string) => {
    if (!description) return <p>No description available</p>;

    const sections = description.split(/\n\s*\n/);

    return sections.map((section, sectionIndex) => {
        const lines = section.split('\n').filter(line => line.trim());
        const elements: React.ReactElement[] = [];
        let currentParagraph: string[] = [];

        const flushParagraph = () => {
            if (currentParagraph.length > 0) {
                elements.push(
                    <p key={`p-${elements.length}`} className="text-gray-600 mb-2">
                        {currentParagraph.join(' ')}
                    </p>
                );
                currentParagraph = [];
            }
        };

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const isHeader = (trimmedLine.endsWith(':') && trimmedLine.length < 100) ||
                (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 80 && !trimmedLine.includes('$'));

            const isBullet = /^[\u2022\u2023\u25E6\u2043\u2219•\-\*]\s/.test(trimmedLine) ||
                /^\d+[\.\)]\s/.test(trimmedLine);

            if (isHeader) {
                flushParagraph();
                elements.push(
                    <p key={`h-${elements.length}`} className="font-semibold text-gray-800 mt-4 mb-1">
                        {trimmedLine}
                    </p>
                );
            } else if (isBullet) {
                flushParagraph();
                elements.push(
                    <p key={`b-${elements.length}`} className="text-gray-600 ml-4 mb-1">
                        {trimmedLine}
                    </p>
                );
            } else {
                currentParagraph.push(trimmedLine);
            }
        });

        flushParagraph();

        return (
            <div key={sectionIndex} className="mb-6 last:mb-0">
                {elements}
            </div>
        );
    });
};

const JobDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getJobById, applyToJob, hasApplied } = useJobs();
    const { user } = useAuth();
    const { getCompanyByName, getCompanyById } = useCompanies();
    const navigate = useNavigate();
    const [applied, setApplied] = React.useState(false);

    const job = getJobById(id);
    const companyProfile = job ? (getCompanyByName(job.company) || getCompanyById(job.company)) : null;

    useEffect(() => {
        if (user && job) {
            setApplied(hasApplied(job.id, user.id));
        }
    }, [job, user, hasApplied]);

    // Track job view — increments the views column on the jobs table
    useEffect(() => {
        if (!job || viewedJobIds.has(job.id)) return;
        viewedJobIds.add(job.id);

        supabase.rpc('increment_job_views', { row_id: job.id }).then(({ error }) => {
            if (error) console.error('Failed to track job view:', error);
        });
    }, [job]);

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
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

    const handleApply = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        const success = await applyToJob(job.id, user.id);
        if (success) {
            setApplied(true);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-primary-600 hover:text-primary-800 font-medium mb-8 transition-colors duration-200"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Job List
                </button>

                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="flex justify-between items-start mb-6">
                            <h1 className="text-3xl font-bold text-secondary-900 leading-tight pr-8">{job.title}</h1>
                            {job.salary && (
                                <div className="text-2xl font-bold text-primary-600 flex-shrink-0">
                                    {job.salary}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center text-gray-600 text-sm md:text-base mb-8 gap-y-2 gap-x-6">
                            <div className="flex items-center">
                                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                                <Link
                                    to={`/companies/${companyProfile?.id}`}
                                    className="font-medium text-primary-700 hover:underline"
                                >
                                    {job.company}
                                </Link>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                                {job.location || 'Not Specified'}
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                                {job.type || 'Not Specified'}
                            </div>
                            <div className="flex items-center">
                                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                                Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
                            </div>
                        </div>

                        <div className="prose max-w-none text-gray-700 leading-relaxed job-description">
                            {formatJobDescription(job.description)}
                        </div>
                    </div>
                    <div className="bg-gray-50/70 border-t border-gray-200 p-8">
                        {user && applied ? (
                            <div className="flex items-center justify-center text-green-600 font-semibold py-4 bg-green-50 rounded-xl">
                                <CheckCircle className="h-6 w-6 mr-3" />
                                You have already applied for this job!
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <div className="text-gray-600 mb-4 sm:mb-0 font-medium">
                                    Apply before {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'N/A'}
                                </div>
                                <button
                                    onClick={handleApply}
                                    className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                    Apply Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;