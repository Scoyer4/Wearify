import supabase from '../config/db';
import { Notification, NotificationType } from '../models/notification';

export const notificationRepository = {
  insert: async (
    userId: string,
    type: NotificationType,
    fromUserId: string | null,
    productId?: string | null,
    message?: string | null,
  ): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, from_user_id: fromUserId, product_id: productId ?? null, message: message ?? null });
    if (error) throw new Error(error.message);
  },

  insertForAllFollowers: async (fromUserId: string, productId: string): Promise<void> => {
    const { data: followers, error: followerError } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', fromUserId)
      .eq('status', 'accepted');

    if (followerError) throw new Error(followerError.message);
    if (!followers || followers.length === 0) return;

    const rows = (followers ?? []).map((f) => ({
      user_id: f.follower_id,
      type: 'new_product' as NotificationType,
      from_user_id: fromUserId,
      product_id: productId,
    }));

    const { error } = await supabase.from('notifications').insert(rows);
    if (error) throw new Error(error.message);
  },

  insertForProductFavorites: async (sellerId: string, productId: string): Promise<void> => {
    const { data: favUsers, error } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('product_id', productId)
      .neq('user_id', sellerId);

    if (error) throw new Error(error.message);
    if (!favUsers || favUsers.length === 0) return;

    const rows = favUsers.map((f) => ({
      user_id: f.user_id,
      type: 'price_drop' as NotificationType,
      from_user_id: sellerId,
      product_id: productId,
    }));

    const { error: insertError } = await supabase.from('notifications').insert(rows);
    if (insertError) throw new Error(insertError.message);
  },

  getForUser: async (userId: string, page: number, limit: number) => {
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    const { data, error, count } = await supabase
      .from('notifications')
      .select(
        `id, user_id, type, from_user_id, product_id, message, is_read, created_at,
        from_user:users!from_user_id(id, username, avatar_url),
        product:products!product_id(id, title)`,
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { items: (data ?? []) as unknown as Notification[], total: count ?? 0 };
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  markRead: async (notificationId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  markAllRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
  },
};
