import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useSEO } from '../hooks/useSEO';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
}

const categoryColors: Record<string, string> = {
  career: 'bg-blue-100 text-blue-700',
  resume: 'bg-purple-100 text-purple-700',
  interview: 'bg-orange-100 text-orange-700',
  hiring: 'bg-green-100 text-green-700',
  industry: 'bg-pink-100 text-pink-700',
};

const Blog: React.FC = () => {
  useSEO({
    title: 'Career Resources',
    description: 'Expert advice on resumes, interviews, and job hunting. Read our latest articles on career growth, hiring, and the tech industry.',
    canonical: '/blog',
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        let q = supabase
          .from('blog_posts')
          .select('id, slug, title, excerpt, category, cover_image_url, author_name, published_at')
          .eq('published', true)
          .order('published_at', { ascending: false });
        if (category !== 'all') q = q.eq('category', category);
        const { data, error: queryError } = await q;
        if (queryError) throw queryError;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary-500" />
            Career Resources
          </h1>
          <p className="mt-2 text-gray-600 text-lg">Expert advice on resumes, interviews, and job hunting.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {['all', 'career', 'resume', 'interview', 'hiring', 'industry'].map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === c ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" /></div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Unable to Load Articles</h3>
                <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No posts in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(p => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              >
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    className="w-full h-48 object-cover"
                    width={400}
                    height={225}
                    fetchPriority="low"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary-500/50" />
                  </div>
                )}
                <div className="p-6">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide mb-3 ${categoryColors[p.category] || 'bg-gray-100 text-gray-700'}`}>
                    {p.category}
                  </span>
                  <h2 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors mb-2">
                    {p.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{p.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{p.author_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(p.published_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
