interface MarkProps { className?: string; title?: string }

/** Nexegin mark: a rising stepped path (career moves) ending in a signal node. */
export function NexeginMark({ className = 'h-8 w-8', title }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#052e2b" />
      <path d="M14 47H26V35H38V23H50" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="47" r="4.5" fill="#ffffff" />
      <circle cx="50" cy="23" r="7" fill="#E8631A" />
    </svg>
  );
}

export function NexeginLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <NexeginMark className="h-8 w-8" />
      <span className="font-display font-bold text-xl tracking-tight text-secondary-900 dark:text-white hidden sm:inline">nexegin</span>
    </span>
  );
}
