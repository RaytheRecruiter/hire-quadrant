import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { useCompanies } from '../contexts/CompanyContext';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { useJobMatchScore } from '../hooks/useJobMatchScore';
import { supabase } from '../utils/supabaseClient';
import { MapPin, Calendar, Clock, ArrowLeft, CheckCircle, DollarSign, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import ScreeningQuestionsModal from '../components/ScreeningQuestionsModal';
import SimilarJobs from '../components/SimilarJobs';
// import RecentlyViewedJobs from '../components/RecentlyViewedJobs'; // Disabled: causing infinite job_tracking queries
import { CareerGrowthPaths } from '../components/CareerGrowthPaths';
import CompanyLogo from '../components/CompanyLogo';
import ShareButtons from '../components/ShareButtons';
import { extractTags } from '../utils/skillExtractor';
import { useSEO } from '../hooks/useSEO';
import { generateSlug, extractIdFromSlug, isUuid } from '../utils/slugGenerator';
import type { ScreeningQuestion, ScreeningAnswer } from '../types/screening';

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
                    <p key={`p-${elements.length}`} className="text-secondary-700 dark:text-slate-300 mb-3 leading-relaxed">
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
                    <h3 key={`h-${elements.length}`} className="font-display font-bold text-secondary-900 dark:text-white mt-6 mb-2 text-lg">
                        {trimmedLine.replace(/:$/, '')}
                    </h3>
                );
            } else if (isBullet) {
                flushParagraph();
                elements.push(
                    <li key={`b-${elements.length}`} className="text-secondary-700 dark:text-slate-300 ml-4 mb-1.5 list-disc list-outside">
                        {trimmedLine.replace(/^[\u2022\u2023\u25E6\u2043\u2219•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '')}
                    </li>
                );
            } else {
                currentParagraph.push(trimmedLine);
            }
        });
        flushParagraph();
        return <div key={sectionIndex} className="mb-5 last:mb-0">{elements}</div>;
    });
};

const buildJobSchema = (job: any, url: string) => {
    const schema: any = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: job.postedDate || job.posted_date,
        employmentType: (job.type || '').toUpperCase().replace('-', '_') || 'FULL_TIME',
        hiringOrganization: { '@type': 'Organization', name: job.company || 'HireQuadrant' },
        directApply: true,
        url,
    };
    if (job.location) {
        schema.jobLocation = {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'US' },
        };
    }
    if (job.salary) {
        const match = String(job.salary).match(/\d[\d,]*/g);
        if (match && match.length > 0) {
            const min = parseInt(match[0].replace(/,/g, ''), 10);
            const max = match[1] ? parseInt(match[1].replace(/,/g, ''), 10) : min;
            schema.baseSalary = {
                '@type': 'MonetaryAmount',
                currency: 'USD',
                value: { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitText: 'YEAR' },
            };
        }
    }
    if (job.applicationDeadline) {
        schema.validThrough = new Date(job.applicationDeadline).toISOString();
    }
    return schema;
};

const JobDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getJobById, applyToJob, hasApplied, jobs } = useJobs();
    const { user } = useAuth();
    const { getCompanyByName, getCompanyById } = useCompanies();
    const { isSaved, toggleSaved } = useSavedJobs();
    const navigate = useNavigate();
    const [applied, setApplied] = React.useState(false);
    const [applying, setApplying] = React.useState(false);
    const [screeningOpen, setScreeningOpen] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const [directJob, setDirectJob] = React.useState<Job | null>(null);

    // Support both UUID and slug-based URLs
    let job = getJobById(id) || directJob;
    if (!job && id && !isUuid(id)) {
      // Try to find job by slug (search through jobs for matching title/company slug)
      job = jobs.find(j => {
        const slug = generateSlug(j.title, j.company || '');
        return slug === id || slug.startsWith(id);
      });
    }

    // Load job directly from Supabase if not in context
    React.useEffect(() => {
      const contextJob = getJobById(id);
      if (!contextJob && id) {
        supabase.from('jobs').select('*').eq('id', id).maybeSingle().then(({ data }) => {
          if (data) setDirectJob(data as Job);
        }).catch(err => console.error('Failed to fetch job:', err));
      }
    }, [id]);
    const companyProfile = job ? (getCompanyByName(job.company) || getCompanyById(job.company)) : null;
    const saved = job ? isSaved(job.id) : false;

    const screeningQuestions: ScreeningQuestion[] = useMemo(
        () => ((job as any)?.screening_questions as ScreeningQuestion[] | undefined) || [],
        [job]
    );
    const tags = useMemo(() => job ? extractTags(job.title, job.description) : [], [job]);
    const { matchScore, matchingSkills } = useJobMatchScore(job?.id || '');

    useEffect(() => {
        if (user && job) setApplied(hasApplied(job.id, user.id));
    }, [job, user, hasApplied]);

    // Per-page SEO
    useSEO({
        title: job ? `${job.title} at ${job.company}` : undefined,
        description: job ? `${job.title} at ${job.company}${job.location ? ' in ' + job.location : ''}. ${job.description?.slice(0, 140) || ''}` : undefined,
        canonical: job ? `/jobs/${job.id}` : undefined,
    });

    useEffect(() => {
        if (!job || viewedJobIds.has(job.id)) return;
        viewedJobIds.add(job.id);
        supabase.rpc('increment_job_views', { row_id: job.id }).then(({ error }) => {
            if (error) console.error('Failed to track job view:', error);
        });

        // Track view in job_views table for authenticated users (for recently viewed feature)
        if (user?.id) {
            supabase.from('job_views').insert({
                job_id: job.id,
                user_id: user.id,
                session_id: crypto.randomUUID(),
                viewed_at: new Date().toISOString(),
            }).catch(error => {
                console.error('Failed to insert job view record:', error);
            });
        }
    }, [job, user?.id]);

    useEffect(() => {
        if (!job) return;
        const schema = buildJobSchema(job, window.location.href);
        const breadcrumb = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Jobs', item: 'https://hirequadrant.com/' },
                { '@type': 'ListItem', position: 2, name: job.company || 'Company', item: companyProfile ? `https://hirequadrant.com/companies/${companyProfile.id}` : 'https://hirequadrant.com/' },
                { '@type': 'ListItem', position: 3, name: job.title, item: window.location.href },
            ],
        };

        const prior = document.getElementById('job-posting-schema');
        if (prior) prior.remove();
        const priorBc = document.getElementById('job-breadcrumb-schema');
        if (priorBc) priorBc.remove();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'job-posting-schema';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);

        const bcScript = document.createElement('script');
        bcScript.type = 'application/ld+json';
        bcScript.id = 'job-breadcrumb-schema';
        bcScript.text = JSON.stringify(breadcrumb);
        document.head.appendChild(bcScript);

        return () => {
            document.getElementById('job-posting-schema')?.remove();
            document.getElementById('job-breadcrumb-schema')?.remove();
        };
    }, [job, companyProfile]);

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h2 className="font-display text-2xl font-bold text-secondary-900 mb-2">Job not found</h2>
                    <p className="text-gray-500 mb-6">This job may have been removed or expired.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-soft"
                    >
                        Browse all jobs
                    </button>
                </div>
            </div>
        );
    }

    const submitApplication = async (answers: ScreeningAnswer[]) => {
        const success = await applyToJob(job.id, answers);
        if (success) {
            setApplied(true);
            setScreeningOpen(false);
            setShowSuccess(true);
            toast.success('Application submitted!');
        }
    };

    const handleApply = async () => {
        if (!user) {
            toast.error('Sign in to apply');
            navigate('/login');
            return;
        }
        if (screeningQuestions.length > 0) {
            setScreeningOpen(true);
            return;
        }
        setApplying(true);
        const success = await applyToJob(job.id);
        setApplying(false);
        if (success) {
            setApplied(true);
            setShowSuccess(true);
            toast.success('Application submitted!');
        } else {
            toast.error('Could not submit application');
        }
    };

    const handleSave = async () => {
        if (!user) {
            toast.error('Sign in to save jobs');
            return;
        }
        const wasSaved = saved;
        await toggleSaved(job.id);
        toast.success(wasSaved ? 'Removed from saved jobs' : 'Saved for later');
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: job.title, text: `${job.title} at ${job.company}`, url }); }
            catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        }
    };

    const minSalary = (job as any).min_salary;
    const maxSalary = (job as any).max_salary;
    const salaryDisplay = minSalary && maxSalary
        ? `$${(minSalary / 1000).toFixed(0)}k – $${(maxSalary / 1000).toFixed(0)}k`
        : job.salary;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24 md:pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1 text-secondary-600 hover:text-primary-600 font-medium mb-6 text-sm transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                {/* Success state */}
                {showSuccess && applied && (
                    <div className="bg-gradient-to-br from-emerald-50 to-primary-50 border border-primary-200 rounded-2xl p-6 mb-6 flex items-start gap-4 animate-slide-up">
                        <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-display text-lg font-bold text-secondary-900">Application sent!</h3>
                            <p className="text-sm text-secondary-700 mt-1">
                                We've notified <strong>{job.company}</strong>. Track the status on your <Link to="/profile" className="text-primary-600 hover:underline font-semibold">profile page</Link>.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-10 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-start gap-4">
                            <CompanyLogo company={job.company} logoUrl={(companyProfile as any)?.logo_url} size="lg" />
                            <div className="flex-1 min-w-0">
                                <h1 className="font-display text-2xl md:text-3xl font-bold text-secondary-900 dark:text-white leading-tight text-balance">
                                    {job.title}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary-600 dark:text-slate-400">
                                    {companyProfile ? (
                                        <Link to={`/companies/${companyProfile.id}`} className="font-semibold text-primary-700 hover:underline">
                                            {job.company}
                                        </Link>
                                    ) : (
                                        <span className="font-semibold text-secondary-800">{job.company}</span>
                                    )}
                                    {job.location && (
                                        <span className="flex items-center gap-1 text-secondary-500">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {job.location}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-secondary-500">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-1.5">
                                    {job.type && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                                            <Clock className="h-3 w-3" />
                                            {job.type}
                                        </span>
                                    )}
                                    {salaryDisplay && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                            <DollarSign className="h-3 w-3" />
                                            {salaryDisplay}
                                        </span>
                                    )}
                                    {matchScore !== null && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                            ✨ {matchScore}% match
                                        </span>
                                    )}
                                    {tags.map(t => (
                                        <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                {matchingSkills.length > 0 && (
                                    <p className="text-xs text-violet-600 dark:text-violet-300 mt-1">Matches: {matchingSkills.join(', ')}</p>
                                )}
                            </div>

                            {/* Desktop actions */}
                            <div className="hidden md:flex flex-col gap-2 items-end flex-shrink-0">
                                <button
                                    onClick={handleApply}
                                    disabled={applied || applying}
                                    className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-soft transition-all ${
                                        applied
                                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                            : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-card-hover'
                                    }`}
                                >
                                    {applied ? (<><CheckCircle className="h-4 w-4" /> Applied</>) : applying ? 'Applying…' : 'Apply now'}
                                </button>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleSave}
                                        title={saved ? 'Saved' : 'Save'}
                                        className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                                            saved ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                    >
                                        {saved ? <BookmarkCheck className="h-4.5 w-4.5 fill-primary-500" /> : <Bookmark className="h-4.5 w-4.5" />}
                                    </button>
                                    <ShareButtons title={job.title} url={window.location.href} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-6 md:p-10 prose max-w-none">
                        {formatJobDescription(job.description)}
                    </div>
                </div>

                <CareerGrowthPaths jobTitle={job.title} jobDescription={job.description} />
                <SimilarJobs jobId={job.id} />
                {/* <RecentlyViewedJobs excludeJobId={job.id} /> */}
            </div>

            {/* Sticky mobile apply bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 pb-safe shadow-card-hover z-30">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <button
                        onClick={handleSave}
                        className={`h-11 w-11 flex items-center justify-center rounded-xl border ${
                            saved ? 'bg-primary-50 border-primary-200 text-primary-600' : 'border-gray-200 text-gray-500'
                        }`}
                    >
                        {saved ? <BookmarkCheck className="h-5 w-5 fill-primary-500" /> : <Bookmark className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={applied || applying}
                        className={`flex-1 h-11 rounded-xl font-semibold shadow-soft transition-all flex items-center justify-center gap-2 ${
                            applied
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                    >
                        {applied ? (<><CheckCircle className="h-4 w-4" /> Applied</>) : applying ? 'Applying…' : `Apply for ${job.title.length > 20 ? 'this role' : job.title}`}
                    </button>
                </div>
            </div>

            <ScreeningQuestionsModal
                open={screeningOpen}
                questions={screeningQuestions}
                companyName={job.company || 'this company'}
                onClose={() => setScreeningOpen(false)}
                onSubmit={submitApplication}
            />
        </div>
    );
};

export default JobDetails;
