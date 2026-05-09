export type MessageType  = 'text' | 'offer' | 'system' | 'swap';
export type OfferStatus  = 'pending' | 'accepted' | 'rejected' | 'countered';
export type OrderStatus  = 'completado' | 'pendiente' | 'cancelado';

export interface ConversationRow {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message_at: string;
}

export interface SwapProduct {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  is_sold: boolean;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type: MessageType;
  offer_price: number | null;
  offer_status: OfferStatus | null;
  swap_product_id: string | null;
  swap_product_ids: string[] | null;
}

export interface OfferMessageRow extends MessageRow {
  message_type: 'offer';
  offer_price: number;
  offer_status: OfferStatus;
}

export interface ConversationProduct {
  title: string;
  price: number;
  image_url: string | null;
  is_sold: boolean;
}

export interface ConversationParticipant {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface ConversationLastMessage {
  content: string;
  created_at: string;
}

export interface ConversationWithDetails extends ConversationRow {
  product: ConversationProduct;
  otherUser: ConversationParticipant;
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
}

export interface MessageSender {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface MessageWithSender extends MessageRow {
  sender: MessageSender;
  swap_product?: SwapProduct | null;
  swap_products?: SwapProduct[];
}

export interface StartConversationResponse {
  conversationId: string;
  isNew: boolean;
}

export interface PaginatedConversations {
  items: ConversationWithDetails[];
  page: number;
  total: number;
  totalPages: number;
}

export interface PaginatedMessages {
  items: MessageWithSender[];
  page: number;
  total: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface OrderRow {
  id: string;
  buyer_id: string;
  seller_id: string | null;
  product_id: string;
  status: OrderStatus;
  price_at_purchase: number;
  created_at: string;
}

export interface CreateOrderResponse {
  orderId: string;
  conversationId: string | null;
}
