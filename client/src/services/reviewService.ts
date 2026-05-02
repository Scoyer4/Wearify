const API_URL = import.meta.env.VITE_API_URL;

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as any).error ?? `Error HTTP ${response.status}`);
  return body as T;
}

const authHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export interface ReviewStatus {
  canReview:   boolean;
  hasReviewed: boolean;
  orderId:     string | null;
  sellerId:    string | null;
  existing:    { id: string; rating: number; comment?: string } | null;
}

export interface ReviewWithReviewer {
  id:          string;
  order_id:    string;
  reviewer_id: string;
  reviewee_id: string;
  rating:      number;
  comment?:    string;
  created_at:  string;
  reviewer: {
    id:         string;
    username:   string | null;
    avatar_url: string | null;
  };
  product: {
    id:        string;
    title:     string;
    image_url: string | null;
  } | null;
}

export const getReviewStatus = async (
  conversationId: string,
  token: string,
): Promise<ReviewStatus> => {
  return apiFetch<ReviewStatus>(`${API_URL}/reviews/status/${conversationId}`, {
    headers: authHeaders(token),
  });
};

export const createReview = async (
  orderId: string,
  rating: number,
  comment: string,
  token: string,
): Promise<void> => {
  await apiFetch<unknown>(`${API_URL}/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ orderId, rating, comment: comment.trim() || undefined }),
  });
};

export const getUserReviews = async (userId: string): Promise<ReviewWithReviewer[]> => {
  const response = await fetch(`${API_URL}/reviews/user/${userId}`);
  if (!response.ok) return [];
  return response.json();
};
