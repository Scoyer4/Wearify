import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as chatService from '../services/chatService';
import { ConversationWithDetails, MessageWithSender, MessageRow, MessageSender } from '../types/chat';

export function useChat(conversationId: string, session: Session | null) {
  const [messages, setMessages]         = useState<MessageWithSender[]>([]);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const token = session?.access_token ?? null;
  const myId  = session?.user.id      ?? null;

  const conversationRef = useRef<ConversationWithDetails | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const [conv, msgs] = await Promise.all([
        chatService.getConversation(conversationId, token),
        chatService.getMessages(conversationId, token),
      ]);
      if (conv) {
        setConversation(conv);
        conversationRef.current = conv;
      }
      if (msgs) setMessages(msgs.items);
      // Avisa al navbar para que refresque el contador de no leídos
      window.dispatchEvent(new Event('chat-messages-read'));
    } catch {
      setError('Error al cargar el chat');
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (!conversationId || !token) return;

    loadData();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newRow = payload.new as MessageRow;

          const isMe = newRow.sender_id === myId;
          const sender: MessageSender = isMe
            ? {
                id:         session!.user.id,
                username:   session!.user.user_metadata?.username   ?? null,
                avatar_url: session!.user.user_metadata?.avatar_url ?? null,
              }
            : {
                id:         conversationRef.current?.otherUser.id         ?? newRow.sender_id,
                username:   conversationRef.current?.otherUser.username   ?? null,
                avatar_url: conversationRef.current?.otherUser.avatar_url ?? null,
              };

          setMessages(prev => {
            if (prev.some(m => m.id === newRow.id)) return prev;
            return [...prev, { ...newRow, sender }];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, token]);

  const sendMessage = useCallback(async (content: string) => {
    if (!token || !conversationId || !content.trim() || !myId) return;

    const trimmed = content.trim();
    const tempId  = `temp-${Date.now()}`;

    const tempMsg: MessageWithSender = {
      id:              tempId,
      conversation_id: conversationId,
      sender_id:       myId,
      content:         trimmed,
      is_read:         false,
      created_at:      new Date().toISOString(),
      sender: {
        id:         myId,
        username:   session?.user.user_metadata?.username   ?? null,
        avatar_url: session?.user.user_metadata?.avatar_url ?? null,
      },
    };

    setMessages(prev => [...prev, tempMsg]);

    const real = await chatService.sendMessage(conversationId, trimmed, token);

    setMessages(prev => {
      // Si Realtime ya entregó el mensaje real, solo eliminamos el temporal
      if (real && prev.some(m => m.id === real.id)) {
        return prev.filter(m => m.id !== tempId);
      }
      // Reemplazamos el temporal con el mensaje real del servidor
      if (real) {
        return prev.map(m => m.id === tempId ? { ...real, sender: tempMsg.sender } : m);
      }
      // En caso de error, eliminamos el temporal
      return prev.filter(m => m.id !== tempId);
    });
  }, [conversationId, token, myId, session]);

  return { messages, conversation, sendMessage, loading, error };
}
