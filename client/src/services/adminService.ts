const API = import.meta.env.VITE_API_URL;

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  pendingReports: number;
}

export interface AdminProduct {
  id: string;
  title: string;
  price: number;
  status: string;
  is_sold: boolean;
  created_at: string;
  seller: { id: string; username: string | null } | null;
  categories: { name: string } | null;
  productImages: { image_url: string }[];
}

export interface AdminUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

export interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
  reporter: { id: string; username: string | null } | null;
  reported_product: { id: string; title: string } | null;
  reported_user: { id: string; username: string | null } | null;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export const checkIsAdmin = (token: string) =>
  req<{ isAdmin: boolean }>(`${API}/admin/me`, { headers: authHeader(token) })
    .then(d => d.isAdmin)
    .catch(() => false);

export const getAdminStats = (token: string) =>
  req<AdminStats>(`${API}/admin/stats`, { headers: authHeader(token) });

export const getAdminProducts = (token: string, page = 1, search?: string, status?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return req<Paginated<AdminProduct>>(`${API}/admin/products?${params}`, { headers: authHeader(token) });
};

export const adminDeleteProduct = (token: string, productId: string, reason: string) =>
  req<{ ok: boolean }>(`${API}/admin/products/${productId}`, {
    method: 'DELETE',
    headers: authHeader(token),
    body: JSON.stringify({ reason }),
  });

export const getAdminUsers = (token: string, page = 1, search?: string, banned?: boolean) => {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('search', search);
  if (banned !== undefined) params.set('banned', String(banned));
  return req<Paginated<AdminUser>>(`${API}/admin/users?${params}`, { headers: authHeader(token) });
};

export const adminBanUser = (token: string, userId: string, reason: string) =>
  req<{ ok: boolean }>(`${API}/admin/users/${userId}/ban`, {
    method: 'PATCH', headers: authHeader(token), body: JSON.stringify({ reason }),
  });

export const adminUnbanUser = (token: string, userId: string) =>
  req<{ ok: boolean }>(`${API}/admin/users/${userId}/unban`, {
    method: 'PATCH', headers: authHeader(token),
  });

export const getAdminReports = (token: string, page = 1, status?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  return req<Paginated<AdminReport>>(`${API}/admin/reports?${params}`, { headers: authHeader(token) });
};

export const adminResolveReport = (
  token: string,
  reportId: string,
  action: 'delete_product' | 'ban_user' | 'none',
  extra?: { productId?: string; userId?: string; banReason?: string; deleteReason?: string },
) =>
  req<{ ok: boolean }>(`${API}/admin/reports/${reportId}/resolve`, {
    method: 'PATCH', headers: authHeader(token), body: JSON.stringify({ action, ...extra }),
  });

export const adminIgnoreReport = (token: string, reportId: string) =>
  req<{ ok: boolean }>(`${API}/admin/reports/${reportId}/ignore`, {
    method: 'PATCH', headers: authHeader(token),
  });
