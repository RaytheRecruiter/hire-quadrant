import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Styled, dark-mode-aware replacement for window.confirm().
// Usage: const confirm = useConfirm(); if (!(await confirm({ title: 'Delete?' }))) return;

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOptions(opts);
    return new Promise<boolean>(resolve => { resolver.current = resolve; });
  }, []);

  const close = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!options) return;
    // Destructive actions start on Cancel so a stray Enter can't delete anything.
    (options.destructive ? cancelRef : confirmRef).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Tab') {
        // Two-button focus trap
        const first = cancelRef.current, last = confirmRef.current;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [options, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={options.message ? 'confirm-message' : undefined}
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-secondary-100 dark:border-slate-700"
          >
            <div className="flex items-start gap-3">
              {options.destructive && (
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {options.title}
                </h2>
                {options.message && (
                  <p id="confirm-message" className="mt-1.5 text-sm text-secondary-600 dark:text-slate-400">
                    {options.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-secondary-200 dark:border-slate-600 text-secondary-800 dark:text-slate-200 hover:bg-secondary-50 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => close(true)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-lg text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800 ${
                  options.destructive
                    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-400'
                    : 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-400'
                }`}
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
