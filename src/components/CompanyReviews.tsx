import React, { useEffect, useState } from 'react';
import { Star, Plus, Loader2, Save, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  pros: string | null;
  cons: string | null;
  job_title: string | null;
  employment_status: 'current' | 'former' | 'interviewed' | null;
  is_anonymous: boolean;
  created_at: string;
  reviewer_id: string;
}

interface Props {
  companyId: string;
  companyName: string;
}

const CompanyReviews: React.FC<Props> = ({ companyId, companyName }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    rating: 0,
    title: '',
    body: '',
    pros: '',
    cons: '',
    job_title: '',
    employment_status: 'current' as 'current' | 'former' | 'interviewed',
  });

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_reviews')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const userHasReviewed = reviews.some(r => r.reviewer_id === user?.id);

  const handleSubmit = async () => {
    if (!user) return;
    if (form.rating === 0 || !form.title || !form.body) {
      return alert('Rating, title, and review body are required.');
    }
    setSaving(true);
    const { error } = await supabase.from('company_reviews').insert({
      company_id: companyId,
      reviewer_id: user.id,
      rating: form.rating,
      title: form.title,
      body: form.body,
      pros: form.pros || null,
      cons: form.cons || null,
      job_title: form.job_title || null,
      employment_status: form.employment_status,
      is_anonymous: true,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ rating: 0, title: '', body: '', pros: '', cons: '', job_title: '', employment_status: 'current' });
    setShowForm(false);
    fetchReviews();
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-900">Reviews & Ratings</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`h-5 w-5 ${n <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-secondary-800">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({reviews.length} review{reviews.length === 1 ? '' : 's'})</span>
            </div>
          )}
        </div>
        {isAuthenticated && !userHasReviewed && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-primary-500 hover:to-primary-600 transition-all"
          >
            <Plus className="h-4 w-4" /> Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 border border-primary-200 rounded-2xl p-5 bg-primary-50/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-secondary-800">Review {companyName}</h4>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))} className="p-1">
                <Star className={`h-7 w-7 ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Review title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <textarea
            rows={4}
            placeholder="Share your experience"
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <textarea
              rows={2}
              placeholder="Pros"
              value={form.pros}
              onChange={e => setForm(f => ({ ...f, pros: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <textarea
              rows={2}
              placeholder="Cons"
              value={form.cons}
              onChange={e => setForm(f => ({ ...f, cons: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Your role (optional)"
              value={form.job_title}
              onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <select
              value={form.employment_status}
              onChange={e => setForm(f => ({ ...f, employment_status: e.target.value as any }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="current">Current employee</option>
              <option value="former">Former employee</option>
              <option value="interviewed">Interviewed here</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 shadow-md"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Submit Review
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-secondary-900">{r.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`h-4 w-4 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {r.employment_status === 'current' ? 'Current' : r.employment_status === 'former' ? 'Former' : 'Interviewed'}
                      {r.job_title && ` — ${r.job_title}`}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{r.body}</p>
              {(r.pros || r.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100 text-sm">
                  {r.pros && <div><div className="font-semibold text-green-700 mb-1">Pros</div><p className="text-gray-600">{r.pros}</p></div>}
                  {r.cons && <div><div className="font-semibold text-red-700 mb-1">Cons</div><p className="text-gray-600">{r.cons}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyReviews;
