import React, { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading2, Link as LinkIcon } from 'lucide-react';
import DOMPurify from 'dompurify';

// Allowlist kept tight on purpose — this HTML is written by company users
// and rendered on public job pages, so only the formatting the toolbar
// actually produces is allowed through.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

export const sanitizeJobDescriptionHtml = (html: string) => DOMPurify.sanitize(html, SANITIZE_CONFIG);

// Heuristic: does this description look like HTML (new rich-text jobs) or
// plain text (legacy jobs, parsed by jobDescriptionFormatter's markdown-ish
// renderer instead)?
export const isHtmlDescription = (value: string) => /<\/?(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|a)[\s>]/i.test(value);

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  // Only push external value changes into the DOM when the user isn't
  // actively typing — otherwise every keystroke's onChange->value->effect
  // round-trip fights the caret position.
  useEffect(() => {
    if (ref.current && !isFocused.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInput = () => {
    if (!ref.current) return;
    onChange(sanitizeJobDescriptionHtml(ref.current.innerHTML));
  };

  const handleLink = () => {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  };

  const toolbarBtn = 'p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700';

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
        <button type="button" onClick={() => exec('bold')} className={toolbarBtn} title="Bold" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => exec('italic')} className={toolbarBtn} title="Italic" aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => exec('formatBlock', '<h3>')} className={toolbarBtn} title="Heading" aria-label="Heading">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className={toolbarBtn} title="Bulleted list" aria-label="Bulleted list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={toolbarBtn} title="Numbered list" aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleLink} className={toolbarBtn} title="Link" aria-label="Link">
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        data-placeholder={placeholder}
        className="min-h-[200px] max-h-[420px] overflow-y-auto px-3 py-2 text-sm text-secondary-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-slate-500"
      />
    </div>
  );
};

export default RichTextEditor;
