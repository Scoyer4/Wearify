import {
  StartConversationResponse,
  PaginatedConversations,
  ConversationWithDetails,
  PaginatedMessages,
  MessageWithSender,
  UnreadCountResponse,
  CreateOrderResponse,
} from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Error HTTP ${response.status}`);
  return body as T;
}

const authHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// ── Conversaciones ──────────────────────────────────────────────────────────────

export const startConversation = async (
  productId: string,
  initialMessage: string,
  token: string,
): Promise<StartConversationResponse | null> => {
  try {
    return await apiFetch<StartConversationResponse>(`${API_URL}/chats`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ productId, initialMessage }),
    });
  } catch (error) {
    console.error('Error al iniciar conversación:', error);
    return null;
  }
};

export const getConversations = async (
  token: string,
  page = 1,
): Promise<PaginatedConversations | null> => {
  try {
    return await apiFetch<PaginatedConversations>(`${API_URL}/chats?page=${page}`, {
      headers: authHeaders(token),
    });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return null;
  }
};

export const getConversation = async (
  conversationId: string,
  token: string,
): Promise<ConversationWithDetails | null> => {
  try {
    return await apiFetch<ConversationWithDetails>(`${API_URL}/chats/${conversationId}`, {
      headers: authHeaders(token),
    });
  } catch (error) {
    console.error('Error al obtener conversación:', error);
    return null;
  }
};

export const getMessages = async (
  conversationId: string,
  token: string,
  page = 1,
  limit = 50,
): Promise<PaginatedMessages | null> => {
  try {
    return await apiFetch<PaginatedMessages>(
      `${API_URL}/chats/${conversationId}/messages?page=${page}&limit=${limit}`,
      { headers: authHeaders(token) },
    );
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return null;
  }
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  token: string,
): Promise<MessageWithSender | null> => {
  try {
    return await apiFetch<MessageWithSender>(
      `${API_URL}/chats/${conversationId}/messages`,
      { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ content }) },
    );
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return null;
  }
};

export const getUnreadCount = async (token: string): Promise<UnreadCountResponse | null> => {
  try {
    return await apiFetch<UnreadCountResponse>(`${API_URL}/chats/unread-count`, {
      headers: authHeaders(token),
    });
  } catch (error) {
    console.error('Error al obtener mensajes no leídos:', error);
    return null;
  }
};

// ── Oferta directa desde la página de producto ─────────────────────────────────

export const makeDirectOffer = async (
  productId: string,
  offerPrice: number,
  token: string,
): Promise<StartConversationResponse> => {
  return apiFetch<StartConversationResponse>(`${API_URL}/chats/direct-offer`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, offerPrice }),
  });
};

// ── Ofertas — lanzan Error con el mensaje del servidor para poder mostrarlo ────

export const makeOffer = async (
  conversationId: string,
  offerPrice: number,
  token: string,
): Promise<MessageWithSender> => {
  return apiFetch<MessageWithSender>(
    `${API_URL}/chats/${conversationId}/offer`,
    { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ offerPrice }) },
  );
};

export const acceptOffer = async (
  conversationId: string,
  messageId: string,
  token: string,
): Promise<{ ok: boolean; orderId: string }> => {
  return apiFetch<{ ok: boolean; orderId: string }>(
    `${API_URL}/chats/${conversationId}/offer/${messageId}/accept`,
    { method: 'PATCH', headers: authHeaders(token) },
  );
};

export const rejectOffer = async (
  conversationId: string,
  messageId: string,
  token: string,
): Promise<{ ok: boolean }> => {
  return apiFetch<{ ok: boolean }>(
    `${API_URL}/chats/${conversationId}/offer/${messageId}/reject`,
    { method: 'PATCH', headers: authHeaders(token) },
  );
};

export const counterOffer = async (
  conversationId: string,
  messageId: string,
  counterPrice: number,
  token: string,
): Promise<MessageWithSender> => {
  return apiFetch<MessageWithSender>(
    `${API_URL}/chats/${conversationId}/offer/${messageId}/counter`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ counterPrice }) },
  );
};

// ── Intercambio (swap) ─────────────────────────────────────────────────────────

export const makeDirectSwap = async (
  productId: string,
  swapProductIds: string[],
  token: string,
): Promise<StartConversationResponse> => {
  return apiFetch<StartConversationResponse>(`${API_URL}/chats/direct-swap`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, swapProductIds }),
  });
};

export const makeSwap = async (
  conversationId: string,
  swapProductIds: string[],
  token: string,
): Promise<MessageWithSender> => {
  return apiFetch<MessageWithSender>(
    `${API_URL}/chats/${conversationId}/swap`,
    { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ swapProductIds }) },
  );
};

export const acceptSwap = async (
  conversationId: string,
  messageId: string,
  token: string,
): Promise<{ ok: boolean }> => {
  return apiFetch<{ ok: boolean }>(
    `${API_URL}/chats/${conversationId}/swap/${messageId}/accept`,
    { method: 'PATCH', headers: authHeaders(token) },
  );
};

export const rejectSwap = async (
  conversationId: string,
  messageId: string,
  token: string,
): Promise<{ ok: boolean }> => {
  return apiFetch<{ ok: boolean }>(
    `${API_URL}/chats/${conversationId}/swap/${messageId}/reject`,
    { method: 'PATCH', headers: authHeaders(token) },
  );
};

// ── Compra directa ─────────────────────────────────────────────────────────────

export const createOrder = async (
  productId: string,
  token: string,
): Promise<CreateOrderResponse> => {
  return apiFetch<CreateOrderResponse>(`${API_URL}/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId }),
  });
};
