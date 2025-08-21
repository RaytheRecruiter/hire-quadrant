// src/components/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have this context

interface CandidateProfile {
    location: string;
    phone_number: string;
    resume_url: string;
}

const ProfilePage = () => {
    const { user } = useAuth(); // Get the current user from your AuthContext
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    
    // Fetch the candidate's profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no row found
                console.error('Error fetching profile:', error);
            } else if (data) {
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    // Handle form submission for updating the profile
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const updates = {
            user_id: user.id,
            location: (e.target as any).location.value,
            phone_number: (e.target as any).phone_number.value,
            email: user.email, // Use email from auth
        };

        const { error } = await supabase
            .from('candidates')
            .upsert(updates, { onConflict: 'user_id' });

        if (error) {
            console.error('Error updating profile:', error);
        } else {
            alert('Profile updated successfully!');
            fetchProfile(); // Re-fetch data to reflect changes
        }
        setLoading(false);
    };

    // Handle resume file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !user) {
            return;
        }

        const file = e.target.files[0];
        setFile(file);
        setUploading(true);

        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('resumes')
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading file:', error);
        } else if (data) {
            const publicUrl = supabase.storage.from('resumes').getPublicUrl(data.path).data.publicUrl;
            
            // Update the candidate's profile with the new resume URL
            const { error: updateError } = await supabase
                .from('candidates')
                .upsert({ user_id: user.id, resume_url: publicUrl }, { onConflict: 'user_id' });
            
            if (updateError) {
                console.error('Error updating resume URL:', updateError);
            } else {
                alert('Resume uploaded successfully!');
                fetchProfile(); // Re-fetch to show new resume link
            }
        }
        setUploading(false);
    };
    
    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="profile-page-container">
            <h1>Candidate Profile</h1>
            <form onSubmit={handleSubmit}>
                {/* ... other form fields for location and phone number ... */}
                <label>
                    Location:
                    <input type="text" name="location" defaultValue={profile?.location || ''} />
                </label>
                <label>
                    Phone Number:
                    <input type="tel" name="phone_number" defaultValue={profile?.phone_number || ''} />
                </label>
                <button type="submit">Save Profile</button>
            </form>

            <div className="resume-section">
                <h2>Resume</h2>
                {profile?.resume_url ? (
                    <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                        View Current Resume
                    </a>
                ) : (
                    <p>No resume uploaded yet.</p>
                )}
                <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                />
                {uploading && <p>Uploading...</p>}
            </div>
        </div>
    );
};

export default ProfilePage;