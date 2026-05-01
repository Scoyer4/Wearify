import {
  StartConversationResponse,
  PaginatedConversations,
  ConversationWithDetails,
  PaginatedMessages,
  MessageWithSender,
  UnreadCountResponse,
} from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL;

// 1. INICIAR O REUTILIZAR CONVERSACIÓN (POST)
export const startConversation = async (
  productId: string,
  initialMessage: string,
  token: string,
): Promise<StartConversationResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, initialMessage }),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as StartConversationResponse;
  } catch (error) {
    console.error('Error al iniciar conversación:', error);
    return null;
  }
};

// 2. LISTA DE CONVERSACIONES DEL USUARIO (GET)
export const getConversations = async (
  token: string,
  page = 1,
): Promise<PaginatedConversations | null> => {
  try {
    const response = await fetch(`${API_URL}/chats?page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as PaginatedConversations;
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return null;
  }
};

// 3. DETALLE DE UNA CONVERSACIÓN (GET)
export const getConversation = async (
  conversationId: string,
  token: string,
): Promise<ConversationWithDetails | null> => {
  try {
    const response = await fetch(`${API_URL}/chats/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as ConversationWithDetails;
  } catch (error) {
    console.error('Error al obtener conversación:', error);
    return null;
  }
};

// 4. MENSAJES DE UNA CONVERSACIÓN (GET) — marca leídos automáticamente en el backend
export const getMessages = async (
  conversationId: string,
  token: string,
  page = 1,
  limit = 50,
): Promise<PaginatedMessages | null> => {
  try {
    const response = await fetch(
      `${API_URL}/chats/${conversationId}/messages?page=${page}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } },
    );
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as PaginatedMessages;
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return null;
  }
};

// 5. ENVIAR MENSAJE (POST)
export const sendMessage = async (
  conversationId: string,
  content: string,
  token: string,
): Promise<MessageWithSender | null> => {
  try {
    const response = await fetch(`${API_URL}/chats/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as MessageWithSender;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return null;
  }
};

// 6. TOTAL DE MENSAJES NO LEÍDOS DEL USUARIO (GET)
export const getUnreadCount = async (token: string): Promise<UnreadCountResponse | null> => {
  try {
    const response = await fetch(`${API_URL}/chats/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as UnreadCountResponse;
  } catch (error) {
    console.error('Error al obtener mensajes no leídos:', error);
    return null;
  }
};
