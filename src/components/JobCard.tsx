import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useJobMatchScore } from '../hooks/useJobMatchScore';
import { Job } from '../contexts/JobContext';
import { MapPin, DollarSign, Bookmark, BookmarkCheck, Zap, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import CompanyLogo from './CompanyLogo';
import HardLink from './HardLink';
import { extractTags } from '../utils/skillExtractor';
import { generateSlug } from '../utils/slugGenerator';

interface JobCardProps {
    job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
    const { user, isCompany, isAdmin } = useAuth();
    const { hasApplied, applyToJob } = useJobs();
    const { isSaved, toggleSaved } = useSavedJobs();
    const { matchScore, loading: scoreLoading } = useJobMatchScore(job.id);
    const navigate = useNavigate();
    const [applying, setApplying] = React.useState(false);

    const applied = user ? hasApplied(job.id, user.id) : false;
    const saved = isSaved(job.id);
    const screeningCount = job.screening_questions?.length ?? 0;
    const canOneClick = !!user && screeningCount === 0 && !applied;
    const tags = React.useMemo(() => extractTags(job.title, job.description), [job.title, job.description]);
    const minSalary = job.min_salary;
    const maxSalary = job.max_salary;
    const salaryDisplay = minSalary && maxSalary
        ? `$${(minSalary / 1000).toFixed(0)}k – $${(maxSalary / 1000).toFixed(0)}k`
        : job.salary;

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error('Sign in to save jobs');
            navigate('/login');
            return;
        }
        const wasSaved = saved;
        await toggleSaved(job.id);
        toast.success(wasSaved ? 'Removed from saved jobs' : 'Saved for later');
    };

    const handleQuickApply = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error('Sign in to apply');
            navigate('/login');
            return;
        }
        setApplying(true);
        try {
            const ok = await applyToJob(job.id);
            if (ok) toast.success(`Applied to ${job.title}`);
            else toast.error('Could not submit application');
        } finally {
            setApplying(false);
        }
    };

    const typeLabel = (() => {
        switch (job.type) {
            case 'full-time': return 'Full Time';
            case 'part-time': return 'Part Time';
            case 'contract': return 'Contract';
            case 'contract-to-hire': return 'Contract-to-Hire';
            case 'internship': return 'Internship';
            default: return job.type || 'Full Time';
        }
    })();

    return (
        <HardLink
            to={`/job/${generateSlug(job.title, job.company || '', job.id)}`}
            className="group block bg-white dark:bg-slate-800 rounded-2xl shadow-card hover:shadow-card-hover border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 hover:scale-[1.01] p-4"
        >
            <div className="flex items-start gap-3">
                <CompanyLogo company={job.company} logoUrl={job.company_logo_url} size="md" />

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="font-display text-lg font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors line-clamp-1">
                                {job.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                                <span className="font-medium truncate">{job.company}</span>
                                {job.location && (
                                    <>
                                        <span className="text-gray-300">·</span>
                                        <span className="flex items-center gap-1 text-gray-500 truncate">
                                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                            {job.location}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleBookmark}
                            aria-label={saved ? 'Remove from saved' : 'Save job'}
                            className={`h-9 w-9 flex items-center justify-center rounded-lg flex-shrink-0 transition-all ${
                                saved
                                    ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300'
                                    : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {saved ? (
                                <BookmarkCheck className="h-5 w-5 fill-primary-500 text-primary-500" />
                            ) : (
                                <Bookmark className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                            {typeLabel}
                        </span>
                        {salaryDisplay && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                <DollarSign className="h-3 w-3" />
                                {salaryDisplay}
                            </span>
                        )}
                        {!isCompany && !isAdmin && user && (
                            scoreLoading ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 animate-pulse w-16 h-5" />
                            ) : matchScore !== null ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                                    ✨ {matchScore}% match
                                </span>
                            ) : null
                        )}
                        {tags.map(t => (
                            <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200 cursor-default">
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-slate-700">
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                            <Clock className="h-3 w-3" />
                            Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
                        </span>

                        <div className="flex items-center gap-2">
                            {applied ? (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Applied
                                </span>
                            ) : canOneClick ? (
                                <button
                                    type="button"
                                    onClick={handleQuickApply}
                                    disabled={applying}
                                    className="inline-flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-soft hover:shadow-card-hover transition-all disabled:opacity-60"
                                >
                                    <Zap className="h-3.5 w-3.5" />
                                    {applying ? 'Applying…' : 'Quick Apply'}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </HardLink>
    );
};

export default React.memo(JobCard, (prev, next) => {
    if (prev.job.id !== next.job.id) return false;
    if (prev.job.title !== next.job.title) return false;
    if (prev.job.company !== next.job.company) return false;
    if (prev.job.company_logo_url !== next.job.company_logo_url) return false;
    if (prev.job.location !== next.job.location) return false;
    if (prev.job.type !== next.job.type) return false;
    if (prev.job.salary !== next.job.salary) return false;
    if (prev.job.min_salary !== next.job.min_salary) return false;
    if (prev.job.max_salary !== next.job.max_salary) return false;
    if (prev.job.description !== next.job.description) return false;
    if (prev.job.postedDate !== next.job.postedDate) return false;
    if ((prev.job.screening_questions?.length ?? 0) !== (next.job.screening_questions?.length ?? 0)) return false;
    return true;
});
