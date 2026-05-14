import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as chatService from '../services/chatService';
import {
  ConversationWithDetails,
  MessageWithSender,
  MessageRow,
  MessageSender,
  OfferStatus,
} from '../types/chat';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Error desconocido';
}

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
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
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

    return () => { supabase.removeChannel(channel); };
  // myId y session se cubren con token (cambian juntos); loadData depende de conversationId+token
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  // ── Helpers para construir mensajes optimistas ─────────────────────────────

  const myMeta = useCallback((): MessageSender => ({
    id:         myId ?? '',
    username:   session?.user.user_metadata?.username   ?? null,
    avatar_url: session?.user.user_metadata?.avatar_url ?? null,
  }), [myId, session]);

  const tempBase = useCallback((content: string): Omit<MessageWithSender, 'id'> => ({
    conversation_id:  conversationId,
    sender_id:        myId ?? '',
    content,
    is_read:          false,
    created_at:       new Date().toISOString(),
    message_type:     'text',
    offer_price:      null,
    offer_status:     null,
    swap_product_id:  null,
    swap_product_ids: null,
    swap_products:    [],
    sender:           myMeta(),
  }), [conversationId, myId, myMeta]);

  // ── Enviar mensaje de texto ────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!token || !conversationId || !content.trim() || !myId) return;

    const trimmed = content.trim();
    const tempId  = `temp-${Date.now()}`;
    const tempMsg: MessageWithSender = { id: tempId, ...tempBase(trimmed) };

    setMessages(prev => [...prev, tempMsg]);

    const real = await chatService.sendMessage(conversationId, trimmed, token);

    setMessages(prev => {
      if (real && prev.some(m => m.id === real.id)) return prev.filter(m => m.id !== tempId);
      if (real) return prev.map(m => m.id === tempId ? { ...real, sender: tempMsg.sender } : m);
      return prev.filter(m => m.id !== tempId);
    });
  }, [conversationId, token, myId, tempBase]);

  // ── Utilidad: mensaje de sistema ──────────────────────────────────────────

  const addSystemMessage = useCallback((content: string) => {
    const sysMsg: MessageWithSender = {
      id:               `sys-${Date.now()}`,
      conversation_id:  conversationId,
      sender_id:        myId ?? '',
      content,
      is_read:          true,
      created_at:       new Date().toISOString(),
      message_type:     'text',
      offer_price:      null,
      offer_status:     null,
      swap_product_id:  null,
      swap_product_ids: null,
      sender:           myMeta(),
    };
    setMessages(prev => [...prev, sysMsg]);
  }, [conversationId, myId, myMeta]);

  // ── Ofertas ────────────────────────────────────────────────────────────────

  const makeOffer = useCallback(async (price: number): Promise<string | null> => {
    if (!token || !conversationId || !myId) return null;

    const tempId = `temp-offer-${Date.now()}`;
    const tempMsg: MessageWithSender = {
      id: tempId,
      ...tempBase(`Oferta: ${price.toFixed(2)} €`),
      message_type: 'offer',
      offer_price:  price,
      offer_status: 'pending',
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const real = await chatService.makeOffer(conversationId, price, token);
      setMessages(prev => {
        if (prev.some(m => m.id === real.id)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { ...real, sender: tempMsg.sender } : m);
      });
      return null;
    } catch (e: unknown) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return errMsg(e);
    }
  }, [conversationId, token, myId, tempBase]);

  const acceptOffer = useCallback(async (messageId: string): Promise<{ orderId: string } | string> => {
    if (!token || !conversationId) return 'Sin sesión';

    // Optimista: marcar oferta como aceptada + añadir mensaje informativo
    setMessages(prev => updateOfferStatus(prev, messageId, 'accepted'));
    addSystemMessage('✅ Oferta aceptada. El producto ha sido reservado para ti.');
    setConversation(prev => prev ? { ...prev, product: { ...prev.product, is_reserved: true } } : prev);

    try {
      const result = await chatService.acceptOffer(conversationId, messageId, token);
      return { orderId: result.orderId };
    } catch (e: unknown) {
      // Revertir en caso de error
      setMessages(prev => updateOfferStatus(prev, messageId, 'pending'));
      setConversation(prev => prev ? { ...prev, product: { ...prev.product, is_reserved: false } } : prev);
      return errMsg(e);
    }
  }, [conversationId, token, addSystemMessage]);

  const rejectOffer = useCallback(async (messageId: string): Promise<string | null> => {
    if (!token || !conversationId) return 'Sin sesión';

    setMessages(prev => updateOfferStatus(prev, messageId, 'rejected'));
    addSystemMessage('❌ Oferta rechazada.');

    try {
      await chatService.rejectOffer(conversationId, messageId, token);
      return null;
    } catch (e: unknown) {
      setMessages(prev => updateOfferStatus(prev, messageId, 'pending'));
      return errMsg(e);
    }
  }, [conversationId, token, addSystemMessage]);

  // ── Intercambio ────────────────────────────────────────────────────────────

  const makeSwap = useCallback(async (swapProductIds: string[]): Promise<string | null> => {
    if (!token || !conversationId || !myId) return 'Sin sesión';

    const tempId = `temp-swap-${Date.now()}`;
    const tempMsg: MessageWithSender = {
      id: tempId,
      ...tempBase('Propuesta de intercambio'),
      message_type:     'swap',
      offer_price:      null,
      offer_status:     'pending',
      swap_product_id:  swapProductIds[0] ?? null,
      swap_product_ids: swapProductIds,
      swap_products:    [],
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const real = await chatService.makeSwap(conversationId, swapProductIds, token);
      setMessages(prev => {
        if (prev.some(m => m.id === real.id)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { ...real, sender: tempMsg.sender } : m);
      });
      return null;
    } catch (e: unknown) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return errMsg(e);
    }
  }, [conversationId, token, myId, tempBase]);

  const acceptSwap = useCallback(async (messageId: string): Promise<string | null> => {
    if (!token || !conversationId) return 'Sin sesión';

    setMessages(prev => updateOfferStatus(prev, messageId, 'accepted'));
    addSystemMessage('🔄 ¡Intercambio aceptado! Accede a "Mis ventas" para enviar tu prenda con número de seguimiento.');
    setConversation(prev => prev ? { ...prev, product: { ...prev.product, is_reserved: true } } : prev);

    try {
      await chatService.acceptSwap(conversationId, messageId, token);
      return null;
    } catch (e: unknown) {
      setMessages(prev => updateOfferStatus(prev, messageId, 'pending'));
      setConversation(prev => prev ? { ...prev, product: { ...prev.product, is_reserved: false } } : prev);
      return errMsg(e);
    }
  }, [conversationId, token, addSystemMessage]);

  const rejectSwap = useCallback(async (messageId: string): Promise<string | null> => {
    if (!token || !conversationId) return 'Sin sesión';

    setMessages(prev => updateOfferStatus(prev, messageId, 'rejected'));
    addSystemMessage('❌ Propuesta de intercambio rechazada.');

    try {
      await chatService.rejectSwap(conversationId, messageId, token);
      return null;
    } catch (e: unknown) {
      setMessages(prev => updateOfferStatus(prev, messageId, 'pending'));
      return errMsg(e);
    }
  }, [conversationId, token, addSystemMessage]);

  const counterOffer = useCallback(async (messageId: string, price: number): Promise<string | null> => {
    if (!token || !conversationId || !myId) return 'Sin sesión';

    // Optimista: marcar la oferta actual como contrarrestada y añadir nueva
    setMessages(prev => updateOfferStatus(prev, messageId, 'countered'));
    const tempId = `temp-counter-${Date.now()}`;
    const tempCounter: MessageWithSender = {
      id: tempId,
      ...tempBase(`Oferta: ${price.toFixed(2)} €`),
      message_type: 'offer',
      offer_price:  price,
      offer_status: 'pending',
    };
    setMessages(prev => [...prev, tempCounter]);

    try {
      const real = await chatService.counterOffer(conversationId, messageId, price, token);
      setMessages(prev => {
        if (prev.some(m => m.id === real.id)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { ...real, sender: tempCounter.sender } : m);
      });
      return null;
    } catch (e: unknown) {
      setMessages(prev => [
        ...updateOfferStatus(prev.filter(m => m.id !== tempId), messageId, 'pending'),
      ]);
      return errMsg(e);
    }
  }, [conversationId, token, myId, tempBase]);

  // ── Utilidades internas ────────────────────────────────────────────────────

  function updateOfferStatus(msgs: MessageWithSender[], id: string, status: OfferStatus): MessageWithSender[] {
    return msgs.map(m => m.id === id ? { ...m, offer_status: status } : m);
  }

  return {
    messages,
    conversation,
    sendMessage,
    makeOffer,
    acceptOffer,
    rejectOffer,
    counterOffer,
    makeSwap,
    acceptSwap,
    rejectSwap,
    loading,
    error,
    isBuyer: conversation?.buyer_id === myId,
  };
}
