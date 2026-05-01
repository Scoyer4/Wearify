import { Request, Response } from 'express';
import { followerRepository } from '../repositories/followerRepository';

export const followerController = {
  follow: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { userId } = req.params;

      if (me === userId) {
        return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
      }

      const target = await followerRepository.findTarget(userId);
      if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

      const existing = await followerRepository.findRelation(me, userId);
      if (existing) {
        return res.status(409).json({ error: 'Ya sigues o tienes una solicitud pendiente', status: existing.status });
      }

      const status = target.is_private ? 'pending' : 'accepted';
      await followerRepository.insert(me, userId, status);
      return res.status(201).json({ status });
    } catch (error: any) {
      console.error('Error en follow:', error);
      return res.status(500).json({ error: 'Error al seguir al usuario' });
    }
  },

  unfollow: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { userId } = req.params;
      await followerRepository.delete(me, userId);
      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en unfollow:', error);
      return res.status(500).json({ error: 'Error al dejar de seguir' });
    }
  },

  acceptRequest: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { userId } = req.params;
      const affected = await followerRepository.acceptPending(userId, me);
      if (affected === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en acceptRequest:', error);
      return res.status(500).json({ error: 'Error al aceptar solicitud' });
    }
  },

  rejectRequest: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { userId } = req.params;
      const affected = await followerRepository.deletePending(userId, me);
      if (affected === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en rejectRequest:', error);
      return res.status(500).json({ error: 'Error al rechazar solicitud' });
    }
  },

  getPendingRequests: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { items, total } = await followerRepository.getPending(me, page, limit);
      const totalPages = Math.ceil(total / limit);
      return res.json({ items, page, total, totalPages });
    } catch (error: any) {
      console.error('Error en getPendingRequests:', error);
      return res.status(500).json({ error: 'Error al obtener solicitudes pendientes' });
    }
  },

  getStatus: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { userId } = req.params;

      const [iFollowRow, followsMeRow] = await Promise.all([
        followerRepository.findRelation(me, userId),
        followerRepository.findRelation(userId, me),
      ]);

      return res.json({
        iFollow: iFollowRow?.status ?? 'none',
        followsMe: followsMeRow?.status ?? 'none',
      });
    } catch (error: any) {
      console.error('Error en getStatus:', error);
      return res.status(500).json({ error: 'Error al obtener estado de seguimiento' });
    }
  },
};
