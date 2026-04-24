import React, { useEffect, useState } from 'react';
import { Quote, TrendingUp } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface Block {
  id: string;
  kind: 'text' | 'image' | 'video' | 'quote' | 'stat';
  heading: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  position: number;
}

interface Props {
  companyId: string;
  companyName: string;
}

const WhyJoinUsSection: React.FC<Props> = ({ companyId, companyName }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('company_content_blocks')
        .select('*')
        .eq('company_id', companyId)
        .order('position', { ascending: true });
      setBlocks((data as Block[]) ?? []);
      setLoading(false);
    })();
  }, [companyId]);

  if (loading || blocks.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
      <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-5">
        Why join {companyName}?
      </h2>
      <div className="space-y-6">
        {blocks.map((b) => <BlockRenderer key={b.id} block={b} />)}
      </div>
    </section>
  );
};

const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  if (block.kind === 'image' && block.image_url) {
    return (
      <figure className="overflow-hidden rounded-xl">
        <img
          src={block.image_url}
          alt={block.heading ?? 'Company image'}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
        {block.heading && (
          <figcaption className="text-sm text-gray-500 dark:text-slate-400 mt-2">{block.heading}</figcaption>
        )}
      </figure>
    );
  }
  if (block.kind === 'video' && block.video_url) {
    // Support YouTube + direct embeds
    const embed = toEmbedUrl(block.video_url);
    return (
      <div>
        {block.heading && (
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">{block.heading}</h3>
        )}
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          {embed ? (
            <iframe
              src={embed}
              title={block.heading ?? 'Company video'}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={block.video_url} controls className="w-full h-full" />
          )}
        </div>
      </div>
    );
  }
  if (block.kind === 'quote' && block.body) {
    return (
      <blockquote className="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-400 rounded-r-lg p-4">
        <Quote className="h-5 w-5 text-primary-400 mb-2" />
        <p className="text-secondary-900 dark:text-white italic whitespace-pre-line">{block.body}</p>
        {block.heading && (
          <footer className="text-sm text-gray-600 dark:text-slate-400 mt-2">— {block.heading}</footer>
        )}
      </blockquote>
    );
  }
  if (block.kind === 'stat' && block.body) {
    return (
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-2xl font-bold text-secondary-900 dark:text-white">{block.body}</p>
          {block.heading && <p className="text-sm text-gray-600 dark:text-slate-400">{block.heading}</p>}
        </div>
      </div>
    );
  }
  // text (default)
  if (!block.body && !block.heading) return null;
  return (
    <div>
      {block.heading && (
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-1">{block.heading}</h3>
      )}
      {block.body && (
        <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{block.body}</p>
      )}
    </div>
  );
};

function toEmbedUrl(url: string): string | null {
  // YouTube watch or share links → embed URL
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default WhyJoinUsSection;
