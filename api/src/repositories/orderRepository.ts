import supabase from '../config/db';
import { CreateOrderDTO, Order } from '../models/orders';

export const orderRepository = {

  findProductForOrder: async (productId: string): Promise<{ seller_id: string; price: number; is_sold: boolean; is_reserved: boolean } | null> => {
    const { data, error } = await (supabase
      .from('products') as any)
      .select('seller_id, price, is_sold, is_reserved')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { seller_id: data.seller_id, price: data.price, is_sold: data.is_sold ?? false, is_reserved: data.is_reserved ?? false };
  },

  createOrder: async (dto: CreateOrderDTO): Promise<Order> => {
    const payload: Record<string, any> = {
      buyer_id:          dto.buyer_id,
      seller_id:         dto.seller_id,
      product_id:        dto.product_id,
      price_at_purchase: dto.price_at_purchase,
      status:            dto.status ?? 'completado',
    };
    if (dto.swap_group_id) payload.swap_group_id = dto.swap_group_id;

    const { data, error } = await (supabase.from('orders') as any).insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Order;
  },

  markProductReserved: async (productId: string): Promise<void> => {
    const { error } = await (supabase.from('products') as any)
      .update({ is_reserved: true })
      .eq('id', productId);
    if (error) throw new Error(error.message);
  },

  markProductSold: async (productId: string): Promise<void> => {
    const { error } = await (supabase.from('products') as any)
      .update({ is_sold: true, is_reserved: false })
      .eq('id', productId);
    if (error) throw new Error(error.message);
  },
};
