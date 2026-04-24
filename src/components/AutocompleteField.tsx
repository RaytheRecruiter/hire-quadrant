import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  column: 'title' | 'location' | 'company';
  className?: string;
  onSelect?: (v: string) => void;
  id?: string;
}

const debounce = <T extends (...args: unknown[]) => void>(fn: T, ms: number): T => {
  let t: ReturnType<typeof setTimeout> | null = null;
  const wrapper = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  return wrapper as T;
};

const AutocompleteField: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  icon,
  column,
  className,
  onSelect,
  id,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const { data } = await supabase
        .from('jobs')
        .select(column)
        .ilike(column, `%${term}%`)
        .not(column, 'is', null)
        .limit(40);
      const uniq = new Set<string>();
      (data ?? []).forEach((r: Record<string, unknown>) => {
        const v = r[column];
        if (typeof v === 'string' && v.trim()) uniq.add(v.trim());
      });
      setSuggestions(Array.from(uniq).slice(0, 8));
    },
    [column],
  );

  const debounced = useRef(debounce(fetchSuggestions as (...a: unknown[]) => void, 180));

  useEffect(() => {
    debounced.current(value);
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const select = (v: string) => {
    onChange(v);
    onSelect?.(v);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      select(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={boxRef}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {icon}
        </span>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500`}
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-30 top-full mt-1 w-full bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg max-h-64 overflow-auto"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();
                select(s);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === activeIdx
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteField;
