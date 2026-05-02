import { Request, Response } from 'express';
import { reviewRepository } from '../repositories/reviewRepository';

export const reviewController = {

  getStatus: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId } = req.params;
      const result = await reviewRepository.getStatus(conversationId, me);
      return res.json(result);
    } catch (error: any) {
      console.error('Error en getStatus:', error);
      return res.status(500).json({ error: 'Error al obtener estado de reseña' });
    }
  },

  createReview: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { orderId, rating, comment } = req.body as { orderId?: string; rating?: number; comment?: string };

      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ error: 'orderId es obligatorio' });
      }
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'La valoración debe ser entre 1 y 5' });
      }

      const order = await reviewRepository.verifyOrder(orderId, me);
      if (!order) return res.status(403).json({ error: 'No tienes permiso para reseñar esta compra' });

      const already = await reviewRepository.hasReviewedOrder(orderId);
      if (already) return res.status(409).json({ error: 'Ya has dejado una reseña para esta compra' });

      const review = await reviewRepository.create({
        order_id:    orderId,
        reviewer_id: me,
        reviewee_id: order.seller_id,
        rating,
        comment:     comment?.trim() || undefined,
      });

      return res.status(201).json(review);
    } catch (error: any) {
      console.error('Error en createReview:', error);
      return res.status(500).json({ error: 'Error al crear la reseña' });
    }
  },

  getUserReviews: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const reviews = await reviewRepository.getByUser(userId);
      return res.json(reviews);
    } catch (error: any) {
      console.error('Error en getUserReviews:', error);
      return res.status(500).json({ error: 'Error al obtener reseñas' });
    }
  },
};
