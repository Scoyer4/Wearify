export type NotificationType =
  | 'follow' | 'follow_request' | 'follow_accepted'
  | 'new_product' | 'price_drop'
  | 'new_sale' | 'order_shipped' | 'order_received';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  from_user_id: string | null;
  product_id: string | null;
  is_read: boolean;
  created_at: string;
  from_user?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  product?: {
    id: string;
    title: string;
  } | null;
}

export interface PaginatedNotificationsResponse {
  items: Notification[];
  page: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
