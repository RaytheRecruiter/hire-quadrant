// src/pages/ProfilePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface CandidateProfile {
    location: string;
    phone_number: string;
    resume_url: string;
}

const ProfilePage = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch the candidate's profile data
    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
        } else if (data) {
            setProfile(data);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Handle form submission for updating the profile
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setMessage(null);

        const updates = {
            user_id: user.id,
            location: (e.target as any).location.value,
            phone_number: (e.target as any).phone_number.value,
            email: user.email,
        };

        const { error } = await supabase
            .from('candidates')
            .upsert(updates, { onConflict: 'user_id' });

        if (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            await fetchProfile();
        }
    };

    // Handle resume file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) {
            return;
        }

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
            // For private buckets, store the file path and generate signed URLs on demand
            const storagePath = data.path;

            // Update the candidate's profile with the storage path
            const { error: updateError } = await supabase
                .from('candidates')
                .upsert({ user_id: user.id, resume_url: storagePath }, { onConflict: 'user_id' });

            if (updateError) {
                console.error('Error updating resume URL:', updateError);
                setMessage({ type: 'error', text: 'File uploaded but failed to save to profile.' });
            } else {
                setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
                await fetchProfile();
            }
        }
        setUploading(false);
    };

    // Generate a signed URL to view the resume
    const handleViewResume = async () => {
        if (!profile?.resume_url) return;

        const { data, error } = await supabase.storage
            .from('resumes')
            .createSignedUrl(profile.resume_url, 3600); // 1 hour expiry

        if (error) {
            console.error('Error generating resume URL:', error);
            setMessage({ type: 'error', text: 'Failed to generate resume link.' });
            return;
        }

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Candidate Profile</h1>

                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                defaultValue={profile?.location || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. Washington, DC"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone_number"
                                defaultValue={profile?.phone_number || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                                placeholder="e.g. (555) 123-4567"
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

                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Resume</h2>
                    {profile?.resume_url ? (
                        <div className="mb-4">
                            <button
                                onClick={handleViewResume}
                                className="text-primary-600 hover:text-primary-700 font-medium underline"
                            >
                                View Current Resume
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500 mb-4">No resume uploaded yet.</p>
                    )}
                    <div>
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
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
