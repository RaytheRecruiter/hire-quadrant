import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import HardLink from '../components/HardLink';
import { ArrowLeft, Clock, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useSEO } from '../hooks/useSEO';
import ShareButtons from '../components/ShareButtons';
import { format } from 'date-fns';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
}

// Simple markdown-ish renderer for post body (H2, bullets, paragraphs)
const renderBody = (body: string) => {
  const blocks = body.split(/\n\s*\n/);
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return <h2 key={i} className="text-2xl font-bold text-secondary-900 dark:text-white mt-8 mb-3">{block.replace(/^## /, '')}</h2>;
    }
    if (block.startsWith('# ')) {
      return <h1 key={i} className="text-3xl font-bold text-secondary-900 dark:text-white mt-8 mb-3">{block.replace(/^# /, '')}</h1>;
    }
    const lines = block.split('\n');
    if (lines.every(l => l.startsWith('- '))) {
      return (
        <ul key={i} className="list-disc list-inside space-y-1 text-gray-700 dark:text-slate-300 mb-4 ml-4">
          {lines.map((l, j) => <li key={j}>{l.replace(/^-\s*/, '')}</li>)}
        </ul>
      );
    }
    return <p key={i} className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">{block}</p>;
  });
};

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: post?.title,
    description: post?.excerpt,
    canonical: slug ? `/blog/${slug}` : undefined,
    ogImage: post?.cover_image_url || undefined,
  });

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h2 className="text-xl font-bold mb-2">Post not found</h2>
          <HardLink to="/blog" className="text-primary-600 hover:underline">← Back to blog</HardLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <HardLink to="/blog" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 font-medium mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Career Resources
        </HardLink>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-3xl shadow-xl mb-8"
            width={1200}
            height={675}
            fetchPriority="high"
          />
        )}

        <article className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 md:p-12">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 mb-4">
            <span className="px-3 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold uppercase tracking-wide">
              {post.category}
            </span>
            <span>{post.author_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(post.published_at), 'MMM d, yyyy')}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-6 leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-xl text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">{post.excerpt}</p>}
          <div className="prose max-w-none mb-8">{renderBody(post.body)}</div>
          <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Share this article:</p>
            <ShareButtons title={post.title} url={window.location.href} />
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
