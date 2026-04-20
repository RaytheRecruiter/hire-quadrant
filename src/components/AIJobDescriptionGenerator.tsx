import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { generateJobDescription } from '../utils/aiClient';

interface Props {
  title?: string;
  company?: string;
  location?: string;
  onGenerated?: (description: string) => void;
}

const AIJobDescriptionGenerator: React.FC<Props> = ({ title: initialTitle = '', company = '', location = '', onGenerated }) => {
  const [title, setTitle] = useState(initialTitle);
  const [bullets, setBullets] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!title) return setError('Job title is required.');
    setError('');
    setLoading(true);
    try {
      const generated = await generateJobDescription({
        title,
        company,
        location,
        bullets: bullets.split('\n').map(b => b.trim()).filter(Boolean),
      });
      setDescription(generated);
      onGenerated?.(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Sparkles className="h-5 w-5 text-primary-600" />
        </div>
        <h3 className="text-lg font-bold text-secondary-900">AI Job Description Generator</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Paste a few bullet points about the role and Claude will draft a polished job description.
      </p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Job title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <textarea
          rows={5}
          placeholder="Key points (one per line). e.g.
Build and ship features across frontend/backend
Minimum 3 years React + Node experience
Fully remote, USA only
Competitive equity + health benefits"
          value={bullets}
          onChange={e => setBullets(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono text-sm"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 shadow-md"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Description'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {description && (
        <div className="mt-6 border border-primary-200 rounded-2xl bg-primary-50/30 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-primary-700">Generated</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{description}</pre>
        </div>
      )}
    </div>
  );
};

export default AIJobDescriptionGenerator;
