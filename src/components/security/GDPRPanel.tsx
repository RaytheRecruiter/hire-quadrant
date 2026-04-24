import React, { useState } from 'react';
import { Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const GDPRPanel: React.FC = () => {
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const exportData = async () => {
    setExporting(true);
    const { data, error } = await supabase.rpc('export_my_data');
    setExporting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hirequadrant-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const deleteAccount = async () => {
    if (confirmInput !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleting(true);
    const { error } = await supabase.rpc('delete_my_data');
    if (error) {
      setDeleting(false);
      toast.error(error.message);
      return;
    }
    toast.success('Your data has been removed. Signing out…');
    await logout();
    window.location.href = '/';
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-1">
          Download your data
        </h2>
        <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
          Get a JSON archive of your profile, resume, applications, reviews, saved jobs, and notifications.
        </p>
        <button
          type="button"
          onClick={exportData}
          disabled={exporting}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download data
        </button>
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4" />
          Delete my data
        </h2>
        <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
          Permanently removes your profile, applications, saved jobs, and notifications.
          Reviews you wrote will be anonymized to preserve company ratings.
        </p>
        {showDelete ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-lg p-3">
            <p className="text-xs text-rose-700 dark:text-rose-300 mb-2">
              This cannot be undone. Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full text-sm rounded-lg border-rose-200 dark:border-rose-900/60 dark:bg-slate-900 dark:text-slate-100 focus:ring-rose-500 focus:border-rose-500 mb-2"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting || confirmInput !== 'DELETE'}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Permanently delete
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmInput('');
                }}
                className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my data
          </button>
        )}
      </div>
    </section>
  );
};

export default GDPRPanel;
