import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Plug, Loader2, Plus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const PROVIDERS = [
  { id: 'greenhouse', name: 'Greenhouse', docs: 'https://developers.greenhouse.io/', description: 'Sync job postings and push candidates.' },
  { id: 'lever', name: 'Lever', docs: 'https://hire.lever.co/developer/documentation', description: 'Two-way candidate sync.' },
  { id: 'workday', name: 'Workday', docs: 'https://community.workday.com/', description: 'Enterprise recruiting integration.' },
  { id: 'icims', name: 'iCIMS', docs: 'https://developer.icims.com/', description: 'Job posting + applicant sync.' },
];

const AtsIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  const fetchIntegrations = async () => {
    setLoading(true);
    const { data } = await supabase.from('ats_integrations').select('*');
    setIntegrations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleConnect = async (providerId: string) => {
    if (!apiKey) return toast.error('API key required.');
    // NOTE: In production this should call an Edge Function that encrypts the key.
    // For now we store it plain-text — acceptable for internal testing only.
    const { error } = await supabase.from('ats_integrations').insert({
      provider: providerId,
      api_key_encrypted: apiKey,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success(`${providerId} connected`);
    setApiKey('');
    setAdding(null);
    fetchIntegrations();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Plug className="w-5 h-5 text-primary-600" />
          ATS Integrations
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect external Applicant Tracking Systems. Currently a placeholder — full sync logic per ATS is on the roadmap.
        </p>
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-500" /></div>
      ) : (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDERS.map(p => {
            const existing = integrations.find(i => i.provider === p.id);
            return (
              <div key={p.id} className="border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-secondary-900">{p.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                  </div>
                  {existing?.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Not connected
                    </span>
                  )}
                </div>
                <a
                  href={p.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  API docs <ExternalLink className="h-3 w-3" />
                </a>
                <div className="mt-4">
                  {adding === p.id ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder={`${p.name} API key`}
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                      />
                      <button
                        onClick={() => handleConnect(p.id)}
                        className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-600"
                      >
                        Connect
                      </button>
                      <button onClick={() => { setAdding(null); setApiKey(''); }} className="text-sm text-gray-500 px-2">Cancel</button>
                    </div>
                  ) : (
                    !existing?.is_active && (
                      <button
                        onClick={() => setAdding(p.id)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        <Plus className="h-4 w-4" /> Connect
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AtsIntegrations;
