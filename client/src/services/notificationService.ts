import { PaginatedNotificationsResponse, UnreadCountResponse } from '../types/notification';

const API_URL = import.meta.env.VITE_API_URL;

export async function getNotifications(token: string, page = 1): Promise<PaginatedNotificationsResponse | null> {
  try {
    const res = await fetch(`${API_URL}/notifications?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return null;
  }
}

export async function getUnreadCount(token: string): Promise<UnreadCountResponse | null> {
  try {
    const res = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching notification count:', err);
    return null;
  }
}

export async function markAllRead(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markRead(notificationId: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
