import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';

interface CompanyProfileEditorProps {
  company: any;
  onSave: (updates: any) => Promise<void>;
}

const CompanyProfileEditor: React.FC<CompanyProfileEditorProps> = ({ company, onSave }) => {
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
  });
  const [saving, setSaving] = useState(false);
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
        contact_email: company.contact_email || '',
        culture: company.culture || '',
      });
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      <div>
        <label className="block text-sm font-semibold text-secondary-800 mb-1">Display Name</label>
        <input
          type="text"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-800 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-secondary-800 mb-1">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 mb-1">Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 mb-1">Company Size</label>
          <select
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
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
          <label className="block text-sm font-semibold text-secondary-800 mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 mb-1">Founded</label>
          <input
            type="text"
            name="founded"
            value={formData.founded}
            onChange={handleChange}
            placeholder="e.g. 2015"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-secondary-800 mb-1">Contact Email</label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-secondary-800 mb-1">Culture</label>
        <textarea
          name="culture"
          value={formData.culture}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50/50 hover:bg-white focus:bg-white transition-all"
        />
      </div>

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
    </form>
  );
};

export default CompanyProfileEditor;
