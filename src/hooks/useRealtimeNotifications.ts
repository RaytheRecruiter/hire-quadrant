import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// Subscribes the caller to Supabase realtime notification inserts for
// the given user, invoking the callback with the new row payload.
// Use alongside the existing 60s poll — this just delivers faster.
export function useRealtimeNotifications(
  userId: string | null | undefined,
  onInsert: () => void,
) {
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => onInsert(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onInsert]);
}

export function useRealtimeMessages(
  conversationId: string | null | undefined,
  onInsert: () => void,
) {
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => onInsert(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onInsert]);
}
