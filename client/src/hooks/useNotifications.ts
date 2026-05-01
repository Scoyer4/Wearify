import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Notification } from '../types/notification';
import * as notificationService from '../services/notificationService';

export function useNotifications(session: Session | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const token = session?.access_token ?? null;
  const userId = session?.user.id ?? null;
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) { setUnreadCount(0); return; }
    const data = await notificationService.getUnreadCount(token);
    if (data) setUnreadCount(data.unreadCount);
  }, [token]);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    if (!token) return;
    setLoading(true);
    const data = await notificationService.getNotifications(token, pageNum);
    if (data) {
      setNotifications(prev => pageNum === 1 ? data.items : [...prev, ...data.items]);
      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    }
    setLoading(false);
  }, [token]);

  const open = useCallback(async () => {
    setIsOpen(true);
    await fetchNotifications(1);
    if (token && unreadCount > 0) {
      notificationService.markAllRead(token).then(() => setUnreadCount(0));
    }
  }, [fetchNotifications, token, unreadCount]);

  const close = useCallback(() => setIsOpen(false), []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchNotifications(page + 1);
  }, [loading, hasMore, page, fetchNotifications]);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Poll unread count every 60 seconds
  useEffect(() => {
    if (!token) return;
    const id = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(id);
  }, [token, fetchUnreadCount]);

  // Supabase Realtime: increment count on new notification insert
  useEffect(() => {
    if (!token || !userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount(prev => prev + 1);
          if (isOpen) fetchNotifications(1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, userId, isOpen, fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, close]);

  return { unreadCount, notifications, isOpen, loading, hasMore, panelRef, toggle, close, loadMore };
}
