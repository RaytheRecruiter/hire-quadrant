// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getInitials, colorFromString } from '../utils/companyLogo';
import toast from 'react-hot-toast';
import { MapPin, FileText, Briefcase, Calendar, Building2, ExternalLink, Eye, Trash2, Loader2, AlertCircle, Sparkles, Camera, User as UserIcon } from 'lucide-react';
import ExperienceSection from '../components/profile/ExperienceSection';
import EducationSection from '../components/profile/EducationSection';
import SkillsSection from '../components/profile/SkillsSection';
import JobPreferencesSection from '../components/profile/JobPreferencesSection';
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
    const { user, updateProfile } = useAuth();
    const [nameValue, setNameValue] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (user?.name) setNameValue(user.name);
    }, [user?.name]);

    const handleSaveName = async () => {
        const trimmed = nameValue.trim();
        if (trimmed.length < 2) {
            toast.error('Name must be at least 2 characters');
            return;
        }
        setSavingName(true);
        const ok = await updateProfile({ name: trimmed });
        setSavingName(false);
        if (ok) toast.success('Name updated');
        else toast.error('Could not update name');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            toast.error('Image must be under 3 MB');
            return;
        }
        setUploadingAvatar(true);
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true, contentType: file.type });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;
            const ok = await updateProfile({ avatarUrl: publicUrl });
            if (!ok) throw new Error('Failed to save avatar URL to profile');
            toast.success('Photo updated');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user) return;
        setUploadingAvatar(true);
        const ok = await updateProfile({ avatarUrl: null });
        setUploadingAvatar(false);
        if (ok) toast.success('Photo removed');
        else toast.error('Could not remove photo');
    };

    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [applications, setApplications] = useState<(JobApplication & { job?: JobInfo })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            setError(null);
            const [candRes, careerRes] = await Promise.all([
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

            if (candRes.error) throw candRes.error;
            if (careerRes.error) throw careerRes.error;

            if (candRes.data) {
                setProfile(candRes.data);
                setHeadlineValue(candRes.data.headline || '');
                setLocationValue(candRes.data.location || '');
                setPhoneValue(candRes.data.phone_number || '');
                setResumeTextValue(candRes.data.resume_text || '');
            }

            if (careerRes.data) {
                setCurrentRoleValue(careerRes.data.current_role || '');
                setTargetRoleValue(careerRes.data.target_role || '');
            }
        } catch (err) {
            console.error('Error in fetchProfile:', err);
            setError('Failed to load profile. Please try again later.');
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
            window.dispatchEvent(new CustomEvent('profile-updated'));
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
                window.dispatchEvent(new CustomEvent('profile-updated'));
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
            window.dispatchEvent(new CustomEvent('profile-updated'));
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
            default: return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-slate-400 mb-4">Please log in to view your profile.</p>
                    <HardLink to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                        Go to Login
                    </HardLink>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-slate-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900/50 py-12">
                <div className="max-w-md w-full mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 mb-1">Unable to Load Profile</h3>
                                <p className="text-red-800 text-sm mb-4">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-red-700 hover:text-red-800 font-medium text-sm"
                                >
                                    Try Reloading
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900/50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
                    <div className="flex items-start gap-5">
                        <div className="relative">
                            <label
                                htmlFor="avatar-upload"
                                className={`h-20 w-20 rounded-full overflow-hidden flex items-center justify-center cursor-pointer group ${
                                    user.avatarUrl ? 'bg-gray-100 dark:bg-slate-700' : colorFromString(user.name || user.email)
                                }`}
                                title="Click to upload a photo"
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name || 'Profile'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold">
                                        {getInitials(user.name) || user.email.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {uploadingAvatar ? (
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-white" />
                                    )}
                                </div>
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploadingAvatar}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <input
                                    type="text"
                                    value={nameValue}
                                    onChange={(e) => setNameValue(e.target.value)}
                                    onBlur={handleSaveName}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            (e.target as HTMLInputElement).blur();
                                        }
                                    }}
                                    placeholder="Your full name"
                                    className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 dark:border-slate-700 focus:border-primary-400 focus:outline-none min-w-0 flex-1 max-w-md"
                                />
                                {savingName && <Loader2 className="h-4 w-4 text-gray-400 dark:text-slate-500 animate-spin" />}
                            </div>
                            <p className="text-gray-500 dark:text-slate-400">{user.email}</p>
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className="inline-block px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize">
                                    {user.role}
                                </span>
                                {user.avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        disabled={uploadingAvatar}
                                        className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 hover:text-rose-600"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Remove photo
                                    </button>
                                )}
                            </div>
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
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                        Personal Information
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Professional Headline</label>
                            <input
                                type="text"
                                value={headlineValue}
                                onChange={(e) => setHeadlineValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Senior React Developer | 5+ years experience"
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">A short headline that helps employers find you</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Location</label>
                            <input
                                type="text"
                                value={locationValue}
                                onChange={(e) => setLocationValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Washington, DC"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phoneValue}
                                onChange={(e) => setPhoneValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. (555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Current Role</label>
                            <input
                                type="text"
                                value={currentRoleValue}
                                onChange={(e) => setCurrentRoleValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Target Role</label>
                            <input
                                type="text"
                                value={targetRoleValue}
                                onChange={(e) => setTargetRoleValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
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

                <ExperienceSection />
                <EducationSection />
                <SkillsSection />
                <JobPreferencesSection />

                {/* Resume */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                        Resume
                    </h2>
                    {profile?.resume_url ? (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-primary-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
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
                        <p className="text-gray-500 dark:text-slate-400 mb-4">No resume uploaded yet.</p>
                    )}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            {profile?.resume_url ? 'Upload New Resume' : 'Upload Resume'}
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block w-full text-sm text-gray-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        {uploading && <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Uploading...</p>}
                    </div>

                    <div>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 mb-3">
                            <Sparkles className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-violet-800 dark:text-violet-300">
                                Paste your resume here to unlock <strong>AI match scores</strong> on every job listing.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 font-mono text-sm"
                            rows={8}
                        />
                    </div>

                    {showResumeViewer && resumeViewUrl && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">Resume Preview</h3>
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
                                        className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:text-slate-300 font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(resumeViewUrl)}&embedded=true`}
                                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg"
                                style={{ height: '600px' }}
                                title="Resume Preview"
                            />
                        </div>
                    )}
                </div>

                {/* Applied Jobs */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                        Applied Jobs ({applications.length})
                    </h2>
                    {applications.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-slate-400 mb-2">You haven't applied to any jobs yet.</p>
                            <HardLink
                                to="/"
                                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                                Browse Jobs
                            </HardLink>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {applications.map((app) => (
                                <HardLink
                                    key={app.id}
                                    to={`/jobs/${app.job_id}`}
                                    className="block p-4 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {app.job?.title || `Job ${app.job_id}`}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400">
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
                                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                <Eye className="h-3 w-3" />
                                                {(app.employer_views?.length ?? 0) === 0 ? (
                                                    <span className="italic text-gray-400 dark:text-slate-500">Not yet reviewed</span>
                                                ) : (
                                                    <>
                                                        <span>
                                                            Viewed {app.employer_views!.length} time{app.employer_views!.length === 1 ? '' : 's'}
                                                        </span>
                                                        <span className="text-gray-400 dark:text-slate-500">
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
                                </HardLink>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
