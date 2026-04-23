// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, FileText, Briefcase, Calendar, Building2, ExternalLink, Eye, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CandidateProfile {
    user_id: string;
    location: string;
    phone_number: string;
    headline: string;
    resume_url: string;
    resume_text: string;
    email: string;
}

interface CareerSettings {
    user_id: string;
    current_role: string;
    target_role: string;
}

interface JobApplication {
    id: string;
    job_id: string;
    status: string;
    applied_at: string;
    source_company: string;
    employer_views?: string[];
}

interface JobInfo {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
}

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [applications, setApplications] = useState<(JobApplication & { job?: JobInfo })[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [headlineValue, setHeadlineValue] = useState('');
    const [locationValue, setLocationValue] = useState('');
    const [phoneValue, setPhoneValue] = useState('');
    const [resumeTextValue, setResumeTextValue] = useState('');
    const [currentRoleValue, setCurrentRoleValue] = useState('');
    const [targetRoleValue, setTargetRoleValue] = useState('');
    const [resumeViewUrl, setResumeViewUrl] = useState<string | null>(null);
    const [showResumeViewer, setShowResumeViewer] = useState(false);

    // Fetch the candidate's profile data
    const fetchProfile = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const [{ data: candidateData }, { data: careerData }] = await Promise.all([
                supabase
                    .from('candidates')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle(),
                supabase
                    .from('user_career_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle(),
            ]);

            if (candidateData) {
                setProfile(candidateData);
                setHeadlineValue(candidateData.headline || '');
                setLocationValue(candidateData.location || '');
                setPhoneValue(candidateData.phone_number || '');
                setResumeTextValue(candidateData.resume_text || '');
            }

            if (careerData) {
                setCurrentRoleValue(careerData.current_role || '');
                setTargetRoleValue(careerData.target_role || '');
            }
        } catch (err) {
            console.error('Error in fetchProfile:', err);
        }

        setLoading(false);
    }, [user]);

    // Fetch applied jobs
    const fetchApplications = useCallback(async () => {
        if (!user) return;

        try {
            const { data: apps, error } = await supabase
                .from('job_applications')
                .select('*')
                .eq('user_id', user.id)
                .order('applied_at', { ascending: false });

            if (error) {
                console.error('Error fetching applications:', error);
                return;
            }

            if (apps && apps.length > 0) {
                // Fetch job details for each application
                const jobIds = apps.map(a => a.job_id);
                const { data: jobs } = await supabase
                    .from('jobs')
                    .select('id, title, company, location, type')
                    .in('id', jobIds);

                const jobMap = new Map((jobs || []).map(j => [j.id, j]));
                setApplications(apps.map(app => ({
                    ...app,
                    job: jobMap.get(app.job_id)
                })));
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
        fetchApplications();
    }, [fetchProfile, fetchApplications]);

    // Handle form submission for updating the profile
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setMessage(null);

        try {
            if (profile) {
                // Update existing row
                const { error } = await supabase
                    .from('candidates')
                    .update({
                        headline: headlineValue || null,
                        location: locationValue,
                        phone_number: phoneValue,
                        resume_text: resumeTextValue || null,
                        email: user.email,
                    })
                    .eq('user_id', user.id);

                if (error) throw error;
            } else {
                // Insert new row
                const { error } = await supabase
                    .from('candidates')
                    .insert({
                        user_id: user.id,
                        headline: headlineValue || null,
                        location: locationValue,
                        phone_number: phoneValue,
                        resume_text: resumeTextValue || null,
                        email: user.email,
                    });

                if (error) throw error;
            }

            // Update career settings (upsert)
            await supabase.from('user_career_settings').upsert({
                user_id: user.id,
                current_role: currentRoleValue || null,
                target_role: targetRoleValue || null,
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            await fetchProfile();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        }
    };

    // Handle resume file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) return;

        const file = e.target.files[0];
        setUploading(true);
        setMessage(null);

        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('resumes')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading file:', error);
            setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
            setUploading(false);
            return;
        }

        if (data) {
            const storagePath = data.path;

            try {
                if (profile) {
                    const { error: updateError } = await supabase
                        .from('candidates')
                        .update({ resume_url: storagePath })
                        .eq('user_id', user.id);
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('candidates')
                        .insert({ user_id: user.id, resume_url: storagePath, email: user.email });
                    if (insertError) throw insertError;
                }

                setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
                await fetchProfile();
            } catch (err: any) {
                console.error('Error saving resume to profile:', err);
                setMessage({ type: 'error', text: 'File uploaded but failed to save to profile.' });
            }
        }
        setUploading(false);
    };

    // Delete the currently uploaded resume from storage + candidate row
    const [deletingResume, setDeletingResume] = useState(false);

    const handleDeleteResume = async () => {
        if (!user || !profile?.resume_url) return;
        if (!window.confirm('Delete your current resume? You can upload a new one after.')) return;

        setDeletingResume(true);
        setMessage(null);

        try {
            // Remove from storage (best-effort — continue if it fails)
            const { error: storageError } = await supabase.storage
                .from('resumes')
                .remove([profile.resume_url]);
            if (storageError) {
                console.warn('Could not remove file from storage (continuing):', storageError);
            }

            // Clear the resume_url on the candidate row
            const { error: updateError } = await supabase
                .from('candidates')
                .update({ resume_url: null })
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            setShowResumeViewer(false);
            setResumeViewUrl(null);
            setMessage({ type: 'success', text: 'Resume deleted. You can upload a new one below.' });
            await fetchProfile();
        } catch (err: any) {
            console.error('Error deleting resume:', err);
            setMessage({ type: 'error', text: err?.message || 'Failed to delete resume.' });
        } finally {
            setDeletingResume(false);
        }
    };

    // Generate a signed URL to view the resume
    const handleViewResume = async () => {
        if (!profile?.resume_url) return;

        const { data, error } = await supabase.storage
            .from('resumes')
            .createSignedUrl(profile.resume_url, 3600);

        if (error) {
            console.error('Error generating resume URL:', error);
            setMessage({ type: 'error', text: 'Failed to generate resume link.' });
            return;
        }

        if (data?.signedUrl) {
            const fileName = profile.resume_url.toLowerCase();
            if (fileName.endsWith('.pdf')) {
                window.open(data.signedUrl, '_blank');
            } else {
                setResumeViewUrl(data.signedUrl);
                setShowResumeViewer(true);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Applied': return 'bg-blue-100 text-blue-800';
            case 'Screening': return 'bg-yellow-100 text-yellow-800';
            case 'Interview': return 'bg-purple-100 text-purple-800';
            case 'Offer': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
                    <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary-600">
                                {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-500">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        Personal Information
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline</label>
                            <input
                                type="text"
                                value={headlineValue}
                                onChange={(e) => setHeadlineValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Senior React Developer | 5+ years experience"
                            />
                            <p className="text-xs text-gray-500 mt-1">A short headline that helps employers find you</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={locationValue}
                                onChange={(e) => setLocationValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Washington, DC"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phoneValue}
                                onChange={(e) => setPhoneValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. (555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                            <input
                                type="text"
                                value={currentRoleValue}
                                onChange={(e) => setCurrentRoleValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                            <input
                                type="text"
                                value={targetRoleValue}
                                onChange={(e) => setTargetRoleValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Engineering Manager"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                        >
                            Save Profile
                        </button>
                    </form>
                </div>

                {/* Resume */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        Resume
                    </h2>
                    {profile?.resume_url ? (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-primary-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">
                                    {profile.resume_url.split('/').pop()?.replace(/^\d+_/, '') || 'Resume uploaded'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                                <button
                                    onClick={handleViewResume}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    View
                                </button>
                                <button
                                    onClick={handleDeleteResume}
                                    disabled={deletingResume}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                    {deletingResume ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3 w-3" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 mb-4">No resume uploaded yet.</p>
                    )}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {profile?.resume_url ? 'Upload New Resume' : 'Upload Resume'}
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Resume Text (paste your resume for AI job matching)
                            </label>
                            {resumeTextValue && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-xs font-semibold rounded-full">
                                    ✨ AI matching enabled
                                </span>
                            )}
                        </div>
                        <textarea
                            value={resumeTextValue}
                            onChange={(e) => setResumeTextValue(e.target.value)}
                            placeholder="Paste your resume content here to unlock AI match scores on every job..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 font-mono text-sm"
                            rows={8}
                        />
                    </div>

                    {showResumeViewer && resumeViewUrl && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800">Resume Preview</h3>
                                <div className="flex gap-3">
                                    <a
                                        href={resumeViewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Download
                                    </a>
                                    <button
                                        onClick={() => setShowResumeViewer(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(resumeViewUrl)}&embedded=true`}
                                className="w-full border border-gray-200 rounded-lg"
                                style={{ height: '600px' }}
                                title="Resume Preview"
                            />
                        </div>
                    )}
                </div>

                {/* Applied Jobs */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                        Applied Jobs ({applications.length})
                    </h2>
                    {applications.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-2">You haven't applied to any jobs yet.</p>
                            <Link
                                to="/"
                                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                                Browse Jobs
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {applications.map((app) => (
                                <Link
                                    key={app.id}
                                    to={`/jobs/${app.job_id}`}
                                    className="block p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {app.job?.title || `Job ${app.job_id}`}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                {app.job?.company && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {app.job.company}
                                                    </span>
                                                )}
                                                {app.job?.location && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {app.job.location}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Applied {formatDate(app.applied_at)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                                                <Eye className="h-3 w-3" />
                                                {(app.employer_views?.length ?? 0) === 0 ? (
                                                    <span className="italic text-gray-400">Not yet reviewed</span>
                                                ) : (
                                                    <>
                                                        <span>
                                                            Viewed {app.employer_views!.length} time{app.employer_views!.length === 1 ? '' : 's'}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            • last {formatDistanceToNow(new Date(app.employer_views![app.employer_views!.length - 1]), { addSuffix: true })}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
