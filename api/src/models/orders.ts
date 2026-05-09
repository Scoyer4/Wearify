export type OrderStatus = 'completado' | 'pendiente' | 'cancelado';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string | null;
  product_id: string;
  status: OrderStatus;
  price_at_purchase: number;
  swap_group_id?: string | null;
  created_at?: string;
}

export interface CreateOrderDTO {
  buyer_id: string;
  seller_id: string;
  product_id: string;
  price_at_purchase: number;
  status?: OrderStatus;
  swap_group_id?: string | null;
}
