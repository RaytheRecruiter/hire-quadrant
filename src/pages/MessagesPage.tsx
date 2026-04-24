import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { MessageSquare, Loader2, Send, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

interface Conversation {
  id: string;
  employer_id: string;
  candidate_id: string;
  company_id: string | null;
  subject: string | null;
  last_message_at: string;
  other_name?: string;
  other_id: string;
  company?: { name: string; slug: string } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

const MessagesPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data: convs } = await supabase
      .from('conversations')
      .select(
        'id, employer_id, candidate_id, company_id, subject, last_message_at, company:companies(name, slug)',
      )
      .or(`employer_id.eq.${user.id},candidate_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    const rows: Conversation[] = ((convs as any) ?? []).map((c: any) => {
      const otherId = c.employer_id === user.id ? c.candidate_id : c.employer_id;
      return { ...c, other_id: otherId };
    });

    // Fetch display names for the other participants in one roundtrip
    const ids = Array.from(new Set(rows.map((r) => r.other_id)));
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', ids);
      const nameMap = new Map<string, string>((profs ?? []).map((p: any) => [p.id, p.name]));
      rows.forEach((r) => { r.other_name = nameMap.get(r.other_id); });
    }

    setConversations(rows);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Honor ?c=<id> on mount to deep-link to a specific conversation
  useEffect(() => {
    const c = searchParams.get('c');
    if (c) setSelectedId(c);
  }, [searchParams]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoadingMessages(false);

    // Mark unread messages sent BY the other party as read
    if (user?.id && data) {
      const unread = data.filter((m: Message) => m.sender_id !== user.id && !m.read_at);
      if (unread.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unread.map((m) => m.id));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId, loadMessages]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const send = async () => {
    const body = draft.trim();
    if (!body || !selectedId || !user?.id) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedId,
      sender_id: user.id,
      body,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft('');
    await loadMessages(selectedId);
    loadConversations();
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/messages" replace />;

  return (
    <>
      <Helmet><title>Messages · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">Messages</h1>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[70vh]">
            {/* List */}
            <aside className="border-r border-gray-100 dark:border-slate-700 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    No conversations yet. When an employer reaches out, it'll show up here.
                  </p>
                </div>
              ) : (
                <ul>
                  {conversations.map((c) => {
                    const isActive = c.id === selectedId;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(c.id);
                            setSearchParams((prev) => {
                              prev.set('c', c.id);
                              return prev;
                            });
                          }}
                          className={`w-full text-left p-4 border-b border-gray-100 dark:border-slate-700 transition-colors ${
                            isActive ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <p className="font-semibold text-secondary-900 dark:text-white truncate">
                            {c.other_name || 'Conversation'}
                          </p>
                          {c.company && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {c.company.name}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            {/* Thread */}
            <section className="flex flex-col">
              {!selected ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-slate-400 text-sm p-6 text-center">
                  Select a conversation to read and reply.
                </div>
              ) : (
                <>
                  <header className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <p className="font-semibold text-secondary-900 dark:text-white">
                      {selected.other_name || 'Conversation'}
                    </p>
                    {selected.company && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">About {selected.company.name}</p>
                    )}
                  </header>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="text-center py-6">
                        <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-6">
                        No messages yet — say hi.
                      </p>
                    ) : (
                      messages.map((m) => {
                        const mine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                              mine
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-secondary-900 dark:text-white'
                            }`}>
                              <p className="text-sm whitespace-pre-line">{m.body}</p>
                              <p className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-gray-500 dark:text-slate-400'}`}>
                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                    <textarea
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Write a reply… (Enter to send)"
                      className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={sending || !draft.trim()}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagesPage;
