import supabase from '../config/db';
import { OrderWithDetails } from '../models/orderLifecycle';

const ORDER_SELECT = `
  *,
  product:products!product_id(id, title, price, productImages(image_url)),
  buyer:users!buyer_id(id, username, avatar_url),
  seller:users!seller_id(id, username, avatar_url)
`;

function mapOrder(raw: any): OrderWithDetails {
  const images = raw.product?.productImages ?? [];
  return {
    ...raw,
    product: {
      id:        raw.product?.id        ?? '',
      title:     raw.product?.title     ?? '',
      price:     raw.product?.price     ?? 0,
      image_url: images[0]?.image_url   ?? null,
    },
    buyer: {
      id:         raw.buyer?.id         ?? '',
      username:   raw.buyer?.username   ?? null,
      avatar_url: raw.buyer?.avatar_url ?? null,
    },
    seller: {
      id:         raw.seller?.id         ?? '',
      username:   raw.seller?.username   ?? null,
      avatar_url: raw.seller?.avatar_url ?? null,
    },
  };
}

export const orderLifecycleRepository = {

  findById: async (orderId: string): Promise<OrderWithDetails | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapOrder(data);
  },

  findBuyingOrders: async (userId: string): Promise<OrderWithDetails[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const orders = (data ?? []).map(mapOrder);
    if (orders.length === 0) return orders;

    const productIds = orders.map(o => o.product_id);
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, product_id')
      .eq('buyer_id', userId)
      .in('product_id', productIds);
    const convMap: Record<string, string> = {};
    for (const c of (convs ?? [])) convMap[c.product_id] = c.id;
    return orders.map(o => ({ ...o, conversation_id: convMap[o.product_id] ?? null }));
  },

  findSellingOrders: async (userId: string): Promise<OrderWithDetails[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const orders = (data ?? []).map(mapOrder);
    if (orders.length === 0) return orders;

    const productIds = orders.map(o => o.product_id);
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, product_id')
      .eq('seller_id', userId)
      .in('product_id', productIds);
    const convMap: Record<string, string> = {};
    for (const c of (convs ?? [])) convMap[c.product_id] = c.id;
    return orders.map(o => ({ ...o, conversation_id: convMap[o.product_id] ?? null }));
  },

  shipOrder: async (orderId: string, trackingNumber: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({
        order_status:    'shipped',
        tracking_number: trackingNumber,
        shipped_at:      new Date().toISOString(),
      })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  receiveOrder: async (orderId: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({
        order_status: 'received',
        received_at:  new Date().toISOString(),
      })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  completeOrder: async (orderId: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({
        order_status:  'completed',
        completed_at:  new Date().toISOString(),
      })
      .eq('id', orderId);
    if (error) throw new Error(error.message);
  },

  cancelOrder: async (orderId: string, productId: string): Promise<void> => {
    const { error: orderErr } = await supabase
      .from('orders')
      .update({ order_status: 'cancelled' })
      .eq('id', orderId);
    if (orderErr) throw new Error(orderErr.message);

    const { error: productErr } = await supabase
      .from('products')
      .update({ status: 'Disponible', is_sold: false })
      .eq('id', productId);
    if (productErr) throw new Error(productErr.message);
  },

  getRoles: async (orderId: string, userId: string): Promise<{ isBuyer: boolean; isSeller: boolean }> => {
    const { data, error } = await supabase
      .from('orders')
      .select('buyer_id, seller_id')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { isBuyer: false, isSeller: false };
    return {
      isBuyer:  data.buyer_id  === userId,
      isSeller: data.seller_id === userId,
    };
  },
};
