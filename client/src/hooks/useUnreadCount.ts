import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { getUnreadCount } from '../services/chatService';

export function useUnreadCount(session: Session | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  const token = session?.access_token ?? null;

  const refetch = useCallback(async () => {
    if (!token) { setUnreadCount(0); return; }
    const data = await getUnreadCount(token);
    if (data) setUnreadCount(data.unreadCount);
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Refresca cada 30 segundos en segundo plano
  useEffect(() => {
    if (!token) return;
    const id = setInterval(refetch, 30_000);
    return () => clearInterval(id);
  }, [token, refetch]);

  // Refresca inmediatamente cuando se leen mensajes en el chat
  useEffect(() => {
    window.addEventListener('chat-messages-read', refetch);
    return () => window.removeEventListener('chat-messages-read', refetch);
  }, [refetch]);

  return { unreadCount, refetch };
}
