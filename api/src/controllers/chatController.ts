import { Request, Response } from 'express';
import { chatRepository } from '../repositories/chatRepository';
import { orderRepository } from '../repositories/orderRepository';

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

      const user = req.user!;
      return res.status(201).json({
        ...message,
        sender: {
          id:         user.id,
          username:   user.user_metadata?.username   ?? null,
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

  // ── Oferta directa desde el producto (sin conversación previa) ──────────────

  makeDirectOffer: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { productId, offerPrice } = req.body as { productId?: string; offerPrice?: number };

      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'productId es obligatorio' });
      }
      if (offerPrice === undefined || typeof offerPrice !== 'number' || offerPrice <= 0) {
        return res.status(400).json({ error: 'El precio de la oferta debe ser un número positivo' });
      }

      const product = await chatRepository.findProductDetails(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });
      if (product.seller_id === me) {
        return res.status(400).json({ error: 'No puedes hacer una oferta sobre tu propio producto' });
      }
      if (offerPrice >= product.price) {
        return res.status(400).json({ error: `La oferta debe ser menor que el precio original (${product.price} €)` });
      }

      let conversationId: string;
      let isNew = false;

      const existing = await chatRepository.findConversation(productId, me, product.seller_id);
      if (existing) {
        conversationId = existing.id;
        const pendingOffer = await chatRepository.findPendingOffer(conversationId);
        if (pendingOffer) {
          return res.status(409).json({ error: 'Ya hay una oferta pendiente en esta conversación' });
        }
      } else {
        const conv = await chatRepository.createConversation(productId, me, product.seller_id);
        conversationId = conv.id;
        isNew = true;
      }

      await chatRepository.createOfferMessage(conversationId, me, offerPrice);

      return res.status(isNew ? 201 : 200).json({ conversationId, isNew });
    } catch (error: any) {
      console.error('Error en makeDirectOffer:', error);
      return res.status(500).json({ error: 'Error al enviar la oferta' });
    }
  },

  // ── Ofertas desde el chat ──────────────────────────────────────────────────

  makeOffer: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId } = req.params;
      const { offerPrice } = req.body as { offerPrice?: number };

      if (offerPrice === undefined || typeof offerPrice !== 'number' || offerPrice <= 0) {
        return res.status(400).json({ error: 'El precio de la oferta debe ser un número positivo' });
      }

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      // Solo el comprador puede iniciar una oferta con este endpoint
      if (conv.buyer_id !== me) {
        return res.status(403).json({ error: 'Solo el comprador puede hacer una oferta' });
      }

      // Verificar que el producto sigue disponible
      const product = await chatRepository.findProductDetails(conv.product_id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });

      // La oferta no puede ser mayor o igual al precio original (no tendría sentido)
      if (offerPrice >= product.price) {
        return res.status(400).json({ error: `La oferta debe ser menor que el precio original (${product.price} €)` });
      }

      // Solo puede haber una oferta pendiente por conversación
      const pending = await chatRepository.findPendingOffer(conversationId);
      if (pending) {
        return res.status(409).json({ error: 'Ya hay una oferta pendiente en esta conversación' });
      }

      const message = await chatRepository.createOfferMessage(conversationId, me, offerPrice);

      const user = req.user!;
      return res.status(201).json({
        ...message,
        sender: {
          id:         user.id,
          username:   user.user_metadata?.username   ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
      });
    } catch (error: any) {
      console.error('Error en makeOffer:', error);
      return res.status(500).json({ error: 'Error al enviar la oferta' });
    }
  },

  acceptOffer: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId, messageId } = req.params;

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      const offerMsg = await chatRepository.findMessageById(messageId);
      if (!offerMsg || offerMsg.message_type !== 'offer') {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }
      if (offerMsg.offer_status !== 'pending') {
        return res.status(400).json({ error: 'Esta oferta ya no está pendiente' });
      }

      // El destinatario es quien NO envió la oferta
      const recipientId = offerMsg.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
      if (me !== recipientId) {
        return res.status(403).json({ error: 'No puedes aceptar tu propia oferta' });
      }

      const product = await chatRepository.findProductDetails(conv.product_id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });

      // 1. Marcar oferta como aceptada
      await chatRepository.updateOfferStatus(messageId, 'accepted');

      // 2. Mensaje informativo — el comprador verá el botón de pago en la tarjeta de oferta
      await chatRepository.createSystemMessage(
        conversationId,
        me,
        '✅ Oferta aceptada. El comprador puede proceder al pago para completar la compra.',
      );

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en acceptOffer:', error);
      return res.status(500).json({ error: 'Error al aceptar la oferta' });
    }
  },

  rejectOffer: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId, messageId } = req.params;

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      const offerMsg = await chatRepository.findMessageById(messageId);
      if (!offerMsg || offerMsg.message_type !== 'offer') {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }
      if (offerMsg.offer_status !== 'pending') {
        return res.status(400).json({ error: 'Esta oferta ya no está pendiente' });
      }

      const recipientId = offerMsg.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
      if (me !== recipientId) {
        return res.status(403).json({ error: 'No puedes rechazar tu propia oferta' });
      }

      await chatRepository.updateOfferStatus(messageId, 'rejected');

      await chatRepository.createMessage(
        conversationId,
        me,
        '❌ Oferta rechazada.',
      );

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en rejectOffer:', error);
      return res.status(500).json({ error: 'Error al rechazar la oferta' });
    }
  },

  // ── Intercambio (swap) ────────────────────────────────────────────────────

  makeDirectSwap: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { productId, swapProductIds } = req.body as { productId?: string; swapProductIds?: string[] };

      if (!productId || !swapProductIds || swapProductIds.length === 0) {
        return res.status(400).json({ error: 'productId y swapProductIds son obligatorios' });
      }
      if (swapProductIds.length > 4) {
        return res.status(400).json({ error: 'Puedes ofrecer como máximo 4 prendas' });
      }
      if (swapProductIds.includes(productId)) {
        return res.status(400).json({ error: 'No puedes intercambiar un producto consigo mismo' });
      }

      // Validar producto destino (del vendedor)
      const targetProduct = await chatRepository.findProductDetails(productId);
      if (!targetProduct) return res.status(404).json({ error: 'Producto no encontrado' });
      if (targetProduct.is_sold || targetProduct.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });
      if (targetProduct.seller_id === me) {
        return res.status(400).json({ error: 'No puedes proponer un intercambio sobre tu propio producto' });
      }

      // Validar cada producto ofrecido
      for (const id of swapProductIds) {
        const offered = await chatRepository.findProductDetails(id);
        if (!offered) return res.status(404).json({ error: 'Producto ofrecido no encontrado' });
        if (offered.is_sold || offered.is_reserved) return res.status(400).json({ error: 'Uno de los productos que ofreces ya no está disponible' });
        if (offered.seller_id !== me) {
          return res.status(403).json({ error: 'Solo puedes ofrecer tus propios productos' });
        }
      }

      let conversationId: string;
      let isNew = false;

      const existing = await chatRepository.findConversation(productId, me, targetProduct.seller_id);
      if (existing) {
        conversationId = existing.id;
        const pending = await chatRepository.findPendingOffer(conversationId);
        if (pending) {
          return res.status(409).json({ error: 'Ya hay una oferta o intercambio pendiente en esta conversación' });
        }
      } else {
        const conv = await chatRepository.createConversation(productId, me, targetProduct.seller_id);
        conversationId = conv.id;
        isNew = true;
      }

      await chatRepository.createSwapMessage(conversationId, me, swapProductIds);

      return res.status(isNew ? 201 : 200).json({ conversationId, isNew });
    } catch (error: any) {
      console.error('Error en makeDirectSwap:', error);
      return res.status(500).json({ error: 'Error al proponer el intercambio' });
    }
  },

  makeSwap: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId } = req.params;
      const { swapProductIds } = req.body as { swapProductIds?: string[] };

      if (!swapProductIds || swapProductIds.length === 0) {
        return res.status(400).json({ error: 'swapProductIds es obligatorio' });
      }
      if (swapProductIds.length > 4) {
        return res.status(400).json({ error: 'Puedes ofrecer como máximo 4 prendas' });
      }

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      if (conv.buyer_id !== me) {
        return res.status(403).json({ error: 'Solo el comprador puede proponer un intercambio' });
      }

      const targetProduct = await chatRepository.findProductDetails(conv.product_id);
      if (!targetProduct) return res.status(404).json({ error: 'Producto no encontrado' });
      if (targetProduct.is_sold || targetProduct.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });

      for (const id of swapProductIds) {
        const offered = await chatRepository.findProductDetails(id);
        if (!offered) return res.status(404).json({ error: 'Producto ofrecido no encontrado' });
        if (offered.is_sold || offered.is_reserved) return res.status(400).json({ error: 'Uno de los productos que ofreces ya no está disponible' });
        if (offered.seller_id !== me) {
          return res.status(403).json({ error: 'Solo puedes ofrecer tus propios productos' });
        }
      }

      const pending = await chatRepository.findPendingOffer(conversationId);
      if (pending) {
        return res.status(409).json({ error: 'Ya hay una oferta o intercambio pendiente' });
      }

      const message = await chatRepository.createSwapMessage(conversationId, me, swapProductIds);

      const user = req.user!;
      return res.status(201).json({
        ...message,
        swap_products: [],
        sender: {
          id:         user.id,
          username:   user.user_metadata?.username   ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
      });
    } catch (error: any) {
      console.error('Error en makeSwap:', error);
      return res.status(500).json({ error: 'Error al proponer el intercambio' });
    }
  },

  acceptSwap: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId, messageId } = req.params;

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      const swapMsg = await chatRepository.findMessageById(messageId);
      if (!swapMsg || swapMsg.message_type !== 'swap') {
        return res.status(404).json({ error: 'Propuesta de intercambio no encontrada' });
      }
      if (swapMsg.offer_status !== 'pending') {
        return res.status(400).json({ error: 'Esta propuesta ya no está pendiente' });
      }

      // Solo el receptor (no el que envió) puede aceptar
      const recipientId = swapMsg.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
      if (me !== recipientId) {
        return res.status(403).json({ error: 'No puedes aceptar tu propia propuesta de intercambio' });
      }

      // Determinar todos los IDs ofrecidos (soporta tanto nuevo array como legado single)
      const offeredIds: string[] = swapMsg.swap_product_ids?.length
        ? swapMsg.swap_product_ids
        : (swapMsg.swap_product_id ? [swapMsg.swap_product_id] : []);

      if (offeredIds.length === 0) {
        return res.status(400).json({ error: 'La propuesta no tiene productos ofrecidos' });
      }

      // Verificar producto principal sigue disponible
      const targetProduct = await chatRepository.findProductDetails(conv.product_id);
      if (!targetProduct || targetProduct.is_sold || targetProduct.is_reserved) {
        return res.status(400).json({ error: 'El producto principal ya no está disponible' });
      }

      // Verificar todos los productos ofrecidos siguen disponibles y cachear su precio
      const offeredDetails: Array<{ id: string; price: number }> = [];
      for (const id of offeredIds) {
        const p = await chatRepository.findProductDetails(id);
        if (!p || p.is_sold || p.is_reserved) {
          return res.status(400).json({ error: 'Uno de los productos ofrecidos ya no está disponible' });
        }
        offeredDetails.push({ id, price: p.price });
      }

      // Marcar swap como aceptado
      await chatRepository.updateOfferStatus(messageId, 'accepted');

      // Marcar TODOS los productos como reservados (se marcarán vendidos al enviar)
      await orderRepository.markProductReserved(conv.product_id);
      for (const { id } of offeredDetails) {
        await orderRepository.markProductReserved(id);
      }

      // Generar un ID de grupo compartido por todas las órdenes de este intercambio
      const swapGroupId = crypto.randomUUID();

      // Orden para el producto anunciado: propusor recibe el producto del vendedor
      const order1 = await orderRepository.createOrder({
        buyer_id:          conv.buyer_id,
        seller_id:         conv.seller_id,
        product_id:        conv.product_id,
        price_at_purchase: targetProduct.price,
        status:            'completado',
        swap_group_id:     swapGroupId,
      });

      // Órdenes para cada producto ofrecido: vendedor original recibe cada prenda
      const extraOrderIds: string[] = [];
      for (const { id, price } of offeredDetails) {
        const o = await orderRepository.createOrder({
          buyer_id:          conv.seller_id,
          seller_id:         conv.buyer_id,
          product_id:        id,
          price_at_purchase: price,
          status:            'completado',
          swap_group_id:     swapGroupId,
        });
        extraOrderIds.push(o.id);
      }

      // Mensaje informativo
      await chatRepository.createSystemMessage(
        conversationId,
        me,
        '🔄 ¡Intercambio aceptado! Accede a "Mis ventas" para enviar tu prenda con número de seguimiento.',
      );

      return res.json({ ok: true, order1Id: order1.id, extraOrderIds });
    } catch (error: any) {
      console.error('Error en acceptSwap:', error);
      return res.status(500).json({ error: 'Error al aceptar el intercambio' });
    }
  },

  rejectSwap: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId, messageId } = req.params;

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      const swapMsg = await chatRepository.findMessageById(messageId);
      if (!swapMsg || swapMsg.message_type !== 'swap') {
        return res.status(404).json({ error: 'Propuesta de intercambio no encontrada' });
      }
      if (swapMsg.offer_status !== 'pending') {
        return res.status(400).json({ error: 'Esta propuesta ya no está pendiente' });
      }

      const recipientId = swapMsg.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
      if (me !== recipientId) {
        return res.status(403).json({ error: 'No puedes rechazar tu propia propuesta' });
      }

      await chatRepository.updateOfferStatus(messageId, 'rejected');
      await chatRepository.createSystemMessage(conversationId, me, '❌ Propuesta de intercambio rechazada.');

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en rejectSwap:', error);
      return res.status(500).json({ error: 'Error al rechazar el intercambio' });
    }
  },

  counterOffer: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { conversationId, messageId } = req.params;
      const { counterPrice } = req.body as { counterPrice?: number };

      if (counterPrice === undefined || typeof counterPrice !== 'number' || counterPrice <= 0) {
        return res.status(400).json({ error: 'El precio de la contraoferta debe ser un número positivo' });
      }

      const conv = await chatRepository.getConversationRaw(conversationId);
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

      const offerMsg = await chatRepository.findMessageById(messageId);
      if (!offerMsg || offerMsg.message_type !== 'offer') {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }
      if (offerMsg.offer_status !== 'pending') {
        return res.status(400).json({ error: 'Esta oferta ya no está pendiente' });
      }

      const recipientId = offerMsg.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
      if (me !== recipientId) {
        return res.status(403).json({ error: 'No puedes contraofertar tu propia oferta' });
      }

      const product = await chatRepository.findProductDetails(conv.product_id);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });

      // 1. Marcar la oferta anterior como superada
      await chatRepository.updateOfferStatus(messageId, 'countered');

      // 2. Crear la nueva oferta del otro participante
      const newOffer = await chatRepository.createOfferMessage(conversationId, me, counterPrice);

      const user = req.user!;
      return res.status(201).json({
        ...newOffer,
        sender: {
          id:         user.id,
          username:   user.user_metadata?.username   ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
        },
      });
    } catch (error: any) {
      console.error('Error en counterOffer:', error);
      return res.status(500).json({ error: 'Error al enviar la contraoferta' });
    }
  },
};
