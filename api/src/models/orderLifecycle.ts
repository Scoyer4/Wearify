export type OrderStatus = 'paid' | 'shipped' | 'received' | 'completed' | 'cancelled';

export interface OrderRow {
  id:                   string;
  buyer_id:             string;
  seller_id:            string | null;
  product_id:           string;
  status:               string;
  order_status:         OrderStatus;
  swap_group_id:        string | null;
  price_at_purchase:    number | null;
  final_price:          number | null;
  shipping_cost:        number;
  shipping_type:        string | null;
  shipping_name:        string | null;
  shipping_address:     string | null;
  shipping_city:        string | null;
  shipping_postal_code: string | null;
  shipping_country:     string | null;
  tracking_number:      string | null;
  shipped_at:           string | null;
  received_at:          string | null;
  completed_at:         string | null;
  created_at:           string;
}

export interface OrderWithDetails extends OrderRow {
  product: {
    id:        string;
    title:     string;
    price:     number;
    image_url: string | null;
  };
  buyer: {
    id:         string;
    username:   string | null;
    avatar_url: string | null;
  };
  seller: {
    id:         string;
    username:   string | null;
    avatar_url: string | null;
  };
  conversation_id?: string | null;
}

export interface ShipOrderDTO {
  trackingNumber: string;
}

export interface OrderTimelineStep {
  status:      OrderStatus;
  label:       string;
  completedAt: string | null;
  isCurrent:   boolean;
}
