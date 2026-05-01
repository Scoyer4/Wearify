import { Request, Response } from 'express';
import { chatRepository } from '../repositories/chatRepository';

export const chatController = {

  startConversation: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { productId, initialMessage } = req.body as { productId?: string; initialMessage?: string };

      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'productId es obligatorio' });
      }
      if (!initialMessage || typeof initialMessage !== 'string' || initialMessage.trim().length === 0) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      }
      if (initialMessage.length > 1000) {
        return res.status(400).json({ error: 'El mensaje no puede superar 1000 caracteres' });
      }

      const product = await chatRepository.findProductSeller(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

      if (product.seller_id === me) {
        return res.status(400).json({ error: 'No puedes chatear sobre tu propio producto' });
      }

      const existing = await chatRepository.findConversation(productId, me, product.seller_id);

      if (existing) {
        await chatRepository.createMessage(existing.id, me, initialMessage.trim());
        return res.status(200).json({ conversationId: existing.id, isNew: false });
      }

      const conversation = await chatRepository.createConversation(productId, me, product.seller_id);
      await chatRepository.createMessage(conversation.id, me, initialMessage.trim());
      return res.status(201).json({ conversationId: conversation.id, isNew: true });
    } catch (error: any) {
      console.error('Error en startConversation:', error);
      return res.status(500).json({ error: 'Error al iniciar conversación' });
    }
  },

  getConversations: async (req: Request, res: Response) => {
    try {
      const me    = req.user!.id;
      const page  = parseInt(req.query.page  as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { rows, total } = await chatRepository.getConversations(me, page, limit);
      const totalPages = Math.ceil(total / limit);
      return res.json({ items: rows, page, total, totalPages });
    } catch (error: any) {
      console.error('Error en getConversations:', error);
      return res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
  },

  getConversation: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId } = req.params;

      const allowed = await chatRepository.isParticipant(conversationId, me);
      if (!allowed) return res.status(403).json({ error: 'No tienes acceso a esta conversación' });

      const conversation = await chatRepository.getConversation(conversationId, me);
      if (!conversation) return res.status(404).json({ error: 'Conversación no encontrada' });

      return res.json(conversation);
    } catch (error: any) {
      console.error('Error en getConversation:', error);
      return res.status(500).json({ error: 'Error al obtener la conversación' });
    }
  },

  getMessages: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId } = req.params;
      const page  = parseInt(req.query.page  as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const allowed = await chatRepository.isParticipant(conversationId, me);
      if (!allowed) return res.status(403).json({ error: 'No tienes acceso a esta conversación' });

      const { rows, total } = await chatRepository.getMessages(conversationId, page, limit);
      const totalPages = Math.ceil(total / limit);

      // Marcar como leídos los mensajes del otro participante
      await chatRepository.markMessagesRead(conversationId, me);

      return res.json({ items: rows, page, total, totalPages });
    } catch (error: any) {
      console.error('Error en getMessages:', error);
      return res.status(500).json({ error: 'Error al obtener mensajes' });
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId } = req.params;
      const { content } = req.body as { content?: string };

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
      }
      if (content.length > 1000) {
        return res.status(400).json({ error: 'El mensaje no puede superar 1000 caracteres' });
      }

      const allowed = await chatRepository.isParticipant(conversationId, me);
      if (!allowed) return res.status(403).json({ error: 'No tienes acceso a esta conversación' });

      const message = await chatRepository.createMessage(conversationId, me, content.trim());

      // Devolver con sender incluido para consistencia con MessageWithSender
      const user = req.user!;
      return res.status(201).json({
        ...message,
        sender: {
          id:         user.id,
          username:   user.user_metadata?.username ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
      });
    } catch (error: any) {
      console.error('Error en sendMessage:', error);
      return res.status(500).json({ error: 'Error al enviar mensaje' });
    }
  },

  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const unreadCount = await chatRepository.getUnreadCount(me);
      return res.json({ unreadCount });
    } catch (error: any) {
      console.error('Error en getUnreadCount:', error);
      return res.status(500).json({ error: 'Error al obtener mensajes no leídos' });
    }
  },
};
