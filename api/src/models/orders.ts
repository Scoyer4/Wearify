export interface Order {
  id: string;
  buyer_id: string;
  product_id: string;
  status: 'completado' | 'pendiente' | 'cancelado';
  price_at_purchase: number;
  created_at?: string;
}