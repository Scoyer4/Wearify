import supabaseTyped from '../config/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseTyped as any;

export const adminRepository = {

  // ── Stats ──────────────────────────────────────────────────────────────────

  getStats: async () => {
    const [products, users, reports] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    return {
      totalProducts:  products.count ?? 0,
      totalUsers:     users.count    ?? 0,
      pendingReports: reports.count  ?? 0,
    };
  },

  // ── Products ───────────────────────────────────────────────────────────────

  getProducts: async (page: number, limit: number, search?: string, status?: string) => {
    let query = supabase
      .from('products')
      .select(`
        id, title, price, status, is_sold, created_at,
        seller:users!seller_id(id, username),
        categories(name),
        productImages(image_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) query = query.ilike('title', `%${search}%`);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  },

  deleteProduct: async (productId: string) => {
    const db = supabase as any;

    // Swap messages can't have swap_product_id nullified (check constraint requires it non-null
    // when message_type='swap'), so we delete them outright.
    const { error: swapErr } = await db
      .from('messages')
      .delete()
      .eq('swap_product_id', productId);
    if (swapErr) throw new Error('Error limpiando mensajes swap: ' + swapErr.message);

    const { error } = await db.from('products').delete().eq('id', productId);
    if (error) throw new Error(error.message);
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  getUsers: async (page: number, limit: number, search?: string, banned?: boolean) => {
    let query = supabase
      .from('users')
      .select('id, username, avatar_url, is_admin, is_banned, ban_reason, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search)              query = query.ilike('username', `%${search}%`);
    if (banned !== undefined) query = query.eq('is_banned', banned);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  },

  banUser: async (userId: string, reason: string) => {
    const { error } = await supabase
      .from('users')
      .update({ is_banned: true, ban_reason: reason })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  unbanUser: async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ is_banned: false, ban_reason: null })
      .eq('id', userId);
    if (error) throw new Error(error.message);
  },

  // ── Reports ────────────────────────────────────────────────────────────────

  getReports: async (page: number, limit: number, status?: string) => {
    let query = supabase
      .from('reports')
      .select(`
        id, reason, details, status, created_at,
        reporter:users!reporter_id(id, username),
        reported_product:products!reported_product_id(id, title),
        reported_user:users!reported_user_id(id, username)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  },

  updateReportStatus: async (reportId: string, status: 'resolved' | 'ignored') => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
    if (error) throw new Error(error.message);
  },

  createReport: async (
    reporterId: string,
    reason: string,
    details?: string,
    productId?: string,
    userId?: string,
  ) => {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id:         reporterId,
        reason,
        details:             details ?? null,
        reported_product_id: productId ?? null,
        reported_user_id:    userId   ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
