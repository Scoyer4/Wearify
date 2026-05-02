import { CheckoutSummary, CreateCheckoutOrderDTO, OrderConfirmation } from '../types/checkout';

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
