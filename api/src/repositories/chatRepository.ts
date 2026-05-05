import supabase from '../config/db';
import {
  ConversationRow,
  MessageRow,
  ConversationWithDetails,
  MessageWithSender,
  OfferStatus,
} from '../models/chat';

export const chatRepository = {

  findProductSeller: async (productId: string): Promise<{ seller_id: string } | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as { seller_id: string } | null;
  },

  findProductDetails: async (productId: string): Promise<{ seller_id: string; price: number; is_sold: boolean } | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('seller_id, price, is_sold')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { seller_id: data.seller_id, price: data.price, is_sold: data.is_sold ?? false };
  },

  findConversation: async (productId: string, buyerId: string, sellerId: string): Promise<ConversationRow | null> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('product_id', productId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as ConversationRow | null;
  },

  getConversationRaw: async (conversationId: string): Promise<ConversationRow | null> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as ConversationRow | null;
  },

  createConversation: async (productId: string, buyerId: string, sellerId: string): Promise<ConversationRow> => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ product_id: productId, buyer_id: buyerId, seller_id: sellerId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ConversationRow;
  },

  findOrCreateConversation: async (productId: string, buyerId: string, sellerId: string): Promise<ConversationRow> => {
    const existing = await chatRepository.findConversation(productId, buyerId, sellerId);
    if (existing) return existing;
    try {
      return await chatRepository.createConversation(productId, buyerId, sellerId);
    } catch {
      // Race condition: another request created the row between our SELECT and INSERT
      const found = await chatRepository.findConversation(productId, buyerId, sellerId);
      if (found) return found;
      throw new Error('No se pudo crear la conversación');
    }
  },

  createMessage: async (conversationId: string, senderId: string, content: string): Promise<MessageRow> => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content, message_type: 'text' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as MessageRow;
  },

  createOfferMessage: async (conversationId: string, senderId: string, price: number): Promise<MessageRow> => {
    const content = `Oferta: ${price.toFixed(2)} €`;
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id:       senderId,
        content,
        message_type:    'offer',
        offer_price:     price,
        offer_status:    'pending',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as MessageRow;
  },

  findMessageById: async (messageId: string): Promise<MessageRow | null> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MessageRow | null;
  },

  findPendingOffer: async (conversationId: string): Promise<MessageRow | null> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('message_type', 'offer')
      .eq('offer_status', 'pending')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MessageRow | null;
  },

  updateOfferStatus: async (messageId: string, status: OfferStatus): Promise<void> => {
    const { error } = await supabase
      .from('messages')
      .update({ offer_status: status })
      .eq('id', messageId);
    if (error) throw new Error(error.message);
  },

  isParticipant: async (conversationId: string, userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data !== null;
  },

  getConversations: async (userId: string, page: number, limit: number): Promise<{ rows: ConversationWithDetails[]; total: number }> => {
    const from = (page - 1) * limit;
    const to   = page * limit - 1;

    const { data, error, count } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(title, price, is_sold, productImages(image_url)),
        buyer:users!buyer_id(id, username, avatar_url),
        seller:users!seller_id(id, username, avatar_url)
      `, { count: 'exact' })
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    const rows  = data ?? [];
    const total = count ?? 0;
    if (rows.length === 0) return { rows: [], total };

    const convIds = rows.map((c: any) => c.id as string);

    // Último mensaje por conversación (batch)
    const { data: msgs, error: msgErr } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });
    if (msgErr) throw new Error(msgErr.message);

    const lastMsgMap: Record<string, { content: string; created_at: string }> = {};
    for (const m of (msgs ?? [])) {
      if (!lastMsgMap[m.conversation_id]) {
        lastMsgMap[m.conversation_id] = { content: m.content, created_at: m.created_at };
      }
    }

    // No leídos por conversación para userId (batch)
    const { data: unread, error: unreadErr } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (unreadErr) throw new Error(unreadErr.message);

    const unreadMap: Record<string, number> = {};
    for (const m of (unread ?? [])) {
      unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1;
    }

    const conversations: ConversationWithDetails[] = rows.map((c: any) => {
      const isBuyer  = c.buyer_id === userId;
      const other    = isBuyer ? c.seller : c.buyer;
      const imgUrl   = (c.product?.productImages ?? [])[0]?.image_url ?? null;
      return {
        id:              c.id,
        product_id:      c.product_id,
        buyer_id:        c.buyer_id,
        seller_id:       c.seller_id,
        created_at:      c.created_at,
        last_message_at: c.last_message_at,
        product:  {
          title:    c.product?.title    ?? '',
          price:    c.product?.price    ?? 0,
          image_url: imgUrl,
          is_sold:  c.product?.is_sold  ?? false,
        },
        otherUser:   { id: other?.id ?? '', username: other?.username ?? null, avatar_url: other?.avatar_url ?? null },
        lastMessage: lastMsgMap[c.id] ?? null,
        unreadCount: unreadMap[c.id]  ?? 0,
      };
    });

    return { rows: conversations, total };
  },

  getConversation: async (conversationId: string, userId: string): Promise<ConversationWithDetails | null> => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        product:products(title, price, is_sold, productImages(image_url)),
        buyer:users!buyer_id(id, username, avatar_url),
        seller:users!seller_id(id, username, avatar_url)
      `)
      .eq('id', conversationId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const c: any  = data;
    const isBuyer = c.buyer_id === userId;
    const other   = isBuyer ? c.seller : c.buyer;
    const imgUrl  = (c.product?.productImages ?? [])[0]?.image_url ?? null;

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      id:              c.id,
      product_id:      c.product_id,
      buyer_id:        c.buyer_id,
      seller_id:       c.seller_id,
      created_at:      c.created_at,
      last_message_at: c.last_message_at,
      product:  {
        title:    c.product?.title   ?? '',
        price:    c.product?.price   ?? 0,
        image_url: imgUrl,
        is_sold:  c.product?.is_sold ?? false,
      },
      otherUser:   { id: other?.id ?? '', username: other?.username ?? null, avatar_url: other?.avatar_url ?? null },
      lastMessage: lastMsg ?? null,
      unreadCount: 0,
    };
  },

  getMessages: async (conversationId: string, page: number, limit: number): Promise<{ rows: MessageWithSender[]; total: number }> => {
    const from = (page - 1) * limit;
    const to   = page * limit - 1;

    const { data, error, count } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(id, username, avatar_url)', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw new Error(error.message);

    const rows: MessageWithSender[] = (data ?? []).map((m: any) => ({
      id:              m.id,
      conversation_id: m.conversation_id,
      sender_id:       m.sender_id,
      content:         m.content,
      is_read:         m.is_read,
      created_at:      m.created_at,
      message_type:    m.message_type  ?? 'text',
      offer_price:     m.offer_price   ?? null,
      offer_status:    m.offer_status  ?? null,
      sender: {
        id:         m.sender?.id         ?? '',
        username:   m.sender?.username   ?? null,
        avatar_url: m.sender?.avatar_url ?? null,
      },
    }));

    return { rows, total: count ?? 0 };
  },

  markMessagesRead: async (conversationId: string, readerUserId: string): Promise<void> => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', readerUserId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    if (convErr) throw new Error(convErr.message);

    const convIds = (convs ?? []).map((c: any) => c.id as string);
    if (convIds.length === 0) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', userId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};
