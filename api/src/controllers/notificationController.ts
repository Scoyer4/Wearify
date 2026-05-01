import { Request, Response } from 'express';
import { notificationRepository } from '../repositories/notificationRepository';

export const notificationController = {
  getNotifications: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const [{ items, total }, unreadCount] = await Promise.all([
        notificationRepository.getForUser(userId, page, limit),
        notificationRepository.getUnreadCount(userId),
      ]);

      return res.json({ items, page, total, totalPages: Math.ceil(total / limit), unreadCount });
    } catch (error: any) {
      console.error('Error en getNotifications:', error);
      return res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
  },

  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const unreadCount = await notificationRepository.getUnreadCount(userId);
      return res.json({ unreadCount });
    } catch (error: any) {
      console.error('Error en getUnreadCount:', error);
      return res.status(500).json({ error: 'Error al obtener conteo' });
    }
  },

  markRead: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await notificationRepository.markRead(id, userId);
      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en markRead:', error);
      return res.status(500).json({ error: 'Error al marcar notificación' });
    }
  },

  markAllRead: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await notificationRepository.markAllRead(userId);
      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en markAllRead:', error);
      return res.status(500).json({ error: 'Error al marcar notificaciones' });
    }
  },
};
