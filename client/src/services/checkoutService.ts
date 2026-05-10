import { CheckoutSummary, CreateCheckoutOrderDTO, OrderConfirmation, StripeSessionInfo } from '../types/checkout';

const API_URL = import.meta.env.VITE_API_URL;

async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Error HTTP ${response.status}`);
  return body as T;
}

const authHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const getCheckoutSummary = async (
  productId: string,
  token: string,
): Promise<CheckoutSummary> => {
  return apiFetch<CheckoutSummary>(`${API_URL}/checkout/${productId}`, {
    headers: authHeaders(token),
  });
};

export const confirmOrder = async (
  dto: CreateCheckoutOrderDTO,
  token: string,
): Promise<OrderConfirmation> => {
  return apiFetch<OrderConfirmation>(`${API_URL}/checkout`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(dto),
  });
};

export const getStripeSession = async (
  sessionId: string,
  token: string,
): Promise<StripeSessionInfo> => {
  return apiFetch<StripeSessionInfo>(`${API_URL}/checkout/session/${sessionId}`, {
    headers: authHeaders(token),
  });
};

export const createStripeSession = async (
  dto: CreateCheckoutOrderDTO,
  token: string,
): Promise<{ url: string }> => {
  return apiFetch<{ url: string }>(`${API_URL}/checkout/create-stripe-session`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(dto),
  });
};
