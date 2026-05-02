import supabase from '../config/db';

export const reviewRepository = {

  getStatus: async (conversationId: string, buyerId: string) => {
    const { data: conv } = await supabase
      .from('conversations')
      .select('product_id, seller_id')
      .eq('id', conversationId)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (!conv) return { canReview: false, hasReviewed: false, orderId: null, sellerId: null, existing: null };

    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('product_id', conv.product_id)
      .eq('buyer_id', buyerId)
      .maybeSingle();

    if (!order) return { canReview: false, hasReviewed: false, orderId: null, sellerId: null, existing: null };

    const { data: existing } = await supabase
      .from('reviews')
      .select('id, rating, comment')
      .eq('order_id', order.id)
      .maybeSingle();

    return {
      canReview:   !existing,
      hasReviewed: !!existing,
      orderId:     order.id as string,
      sellerId:    conv.seller_id as string,
      existing:    existing ?? null,
    };
  },

  verifyOrder: async (orderId: string, buyerId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, seller_id, buyer_id')
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as { id: string; seller_id: string; buyer_id: string } | null;
  },

  hasReviewedOrder: async (orderId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();
    return !!data;
  },

  create: async (dto: {
    order_id:    string;
    reviewer_id: string;
    reviewee_id: string;
    rating:      number;
    comment?:    string;
  }) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert(dto)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getByUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviewer_id(id, username, avatar_url),
        order:orders!order_id(
          product:products!product_id(id, title, productImages(image_url))
        )
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      ...r,
      product: r.order?.product ? {
        id:        r.order.product.id,
        title:     r.order.product.title,
        image_url: (r.order.product.productImages ?? [])[0]?.image_url ?? null,
      } : null,
    }));
  },
};
