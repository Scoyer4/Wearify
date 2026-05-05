import { OrderWithDetails, OrderTimelineStep } from '../types/order';

const API_URL = import.meta.env.VITE_API_URL;

export type OrderWithTimeline = OrderWithDetails & { timeline: OrderTimelineStep[] };

export const getBuyingOrders = async (token: string): Promise<OrderWithDetails[] | null> => {
  try {
    const res = await fetch(`${API_URL}/orders/buying`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json() as OrderWithDetails[];
  } catch (e) {
    console.error('Error al obtener compras:', e);
    return null;
  }
};

export const getSellingOrders = async (token: string): Promise<OrderWithDetails[] | null> => {
  try {
    const res = await fetch(`${API_URL}/orders/selling`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json() as OrderWithDetails[];
  } catch (e) {
    console.error('Error al obtener ventas:', e);
    return null;
  }
};

export const getOrder = async (orderId: string, token: string): Promise<OrderWithTimeline | null> => {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    return await res.json() as OrderWithTimeline;
  } catch (e) {
    console.error('Error al obtener pedido:', e);
    return null;
  }
};

export const shipOrder = async (
  orderId: string,
  trackingNumber: string,
  token: string,
): Promise<{ ok: boolean } | null> => {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/ship`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackingNumber }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `Error HTTP: ${res.status}`);
    }
    return await res.json() as { ok: boolean };
  } catch (e) {
    console.error('Error al marcar envío:', e);
    throw e;
  }
};

export const receiveOrder = async (
  orderId: string,
  token: string,
): Promise<{ ok: boolean; conversationId: string | null } | null> => {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/receive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `Error HTTP: ${res.status}`);
    }
    return await res.json() as { ok: boolean; conversationId: string | null };
  } catch (e) {
    console.error('Error al confirmar recepción:', e);
    throw e;
  }
};

export const completeOrder = async (orderId: string, token: string): Promise<{ ok: boolean } | null> => {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `Error HTTP: ${res.status}`);
    }
    return await res.json() as { ok: boolean };
  } catch (e) {
    console.error('Error al completar pedido:', e);
    throw e;
  }
};
