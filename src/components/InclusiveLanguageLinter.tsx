import React, { useMemo } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { scanInclusive } from '../utils/inclusiveLanguage';

interface Props {
  text: string;
  className?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  gendered: 'Gendered language',
  age: 'Age-coded',
  ableist: 'Ableist language',
  'culture-fit': 'Culture-fit framing',
  exclusionary: 'Exclusionary credentialism',
  jargon: 'Jargon',
};

const InclusiveLanguageLinter: React.FC<Props> = ({ text, className = '' }) => {
  const flags = useMemo(() => scanInclusive(text), [text]);
  if (!text || text.trim().length < 20) return null;

  if (flags.length === 0) {
    return (
      <div className={`text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 ${className}`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        No inclusive-language issues detected.
      </div>
    );
  }

  // Group by category
  const grouped = new Map<string, typeof flags>();
  flags.forEach((f) => {
    const list = grouped.get(f.category) ?? [];
    list.push(f);
    grouped.set(f.category, list);
  });

  return (
    <details className={`rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 ${className}`}>
      <summary className="cursor-pointer text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4" />
        Inclusive-language check: {flags.length} suggestion{flags.length === 1 ? '' : 's'}
      </summary>
      <ul className="mt-2 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
        {Array.from(grouped.entries()).map(([cat, items]) => (
          <li key={cat}>
            <span className="font-semibold">{CATEGORY_LABEL[cat] ?? cat}:</span>{' '}
            {Array.from(new Set(items.map((f) => f.match))).join(', ')}
            {items[0].suggestion && (
              <span className="text-amber-800 dark:text-amber-300"> — consider: {items[0].suggestion}</span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
};

export default InclusiveLanguageLinter;
