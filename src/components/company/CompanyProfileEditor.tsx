import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, AlertCircle, Lock, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../utils/supabaseClient';
import CompanyLogo from '../CompanyLogo';

interface CompanyProfileEditorProps {
  company: any;
  onSave: (updates: any) => Promise<void>;
}

const CompanyProfileEditor: React.FC<CompanyProfileEditorProps> = ({ company, onSave }) => {
  const { isOwner, isAdmin, can, member } = usePermissions();
  const noMember = !member;
  const canEdit = noMember || isOwner || isAdmin || can('edit_company_page');
  const [formData, setFormData] = useState({
    display_name: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    location: '',
    founded: '',
    contact_email: '',
    culture: '',
    logo: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    if (company) {
      setFormData({
        display_name: company.display_name || company.name || '',
        description: company.description || '',
        website: company.website || '',
        industry: company.industry || '',
        size: company.size || '',
        location: company.location || '',
        founded: company.founded || '',
        logo: company.logo || '',
        contact_email: company.contact_email || '',
        culture: company.culture || '',
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !company?.id) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Logo must be an image file.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo must be under 2 MB.' });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${company.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
      setFormData((prev) => ({ ...prev, logo: data.publicUrl }));
      await onSave({ logo: data.publicUrl });
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setMessage({ type: 'error', text: "You don't have permission to edit the Company Page." });
      return;
    }
    setSaving(true);
    setMessage(null);

    try {
      await onSave(formData);
      setMessage({ type: 'success', text: 'Company profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update company profile. Please try again.' });
    } finally {
      setSaving(false);
      if (messageTimer.current) clearTimeout(messageTimer.current);
      messageTimer.current = setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {!canEdit && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            You can view the Company Page but not edit it. Ask your Owner or Admin
            to grant you the "Edit Company Page" permission.
          </span>
        </div>
      )}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <fieldset disabled={!canEdit} className={`space-y-6 ${!canEdit ? 'opacity-70' : ''}`}>
      <div>
        <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Company Logo</label>
        <div className="flex items-center gap-4">
          <CompanyLogo company={formData.display_name} logoUrl={formData.logo} size="lg" />
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 ${canEdit ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700' : 'cursor-not-allowed opacity-60'}`}>
            {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingLogo ? 'Uploading…' : formData.logo ? 'Replace logo' : 'Upload logo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={!canEdit || uploadingLogo}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">PNG or JPG, up to 2 MB. Saves immediately.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Display Name</label>
        <input
          type="text"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Company Size</label>
          <select
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
          >
            <option value="">Select size</option>
            <option value="1-10 employees">1-10 employees</option>
            <option value="11-50 employees">11-50 employees</option>
            <option value="50-200 employees">50-200 employees</option>
            <option value="201-500 employees">201-500 employees</option>
            <option value="501-1000 employees">501-1000 employees</option>
            <option value="1000+ employees">1000+ employees</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Founded</label>
          <input
            type="text"
            name="founded"
            value={formData.founded}
            onChange={handleChange}
            placeholder="e.g. 2015"
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">Culture</label>
        <textarea
          name="culture"
          value={formData.culture}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 transition-all"
        />
      </div>

      </fieldset>
      {canEdit && (
        <div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-500 text-white font-semibold rounded-xl hover:from-primary-500 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );
};

export default CompanyProfileEditor;
