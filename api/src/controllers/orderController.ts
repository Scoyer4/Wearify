import { Request, Response } from 'express';
import { orderRepository } from '../repositories/orderRepository';
import { orderLifecycleRepository } from '../repositories/orderLifecycleRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { chatRepository } from '../repositories/chatRepository';
import { OrderStatus, OrderTimelineStep, OrderWithDetails, ShipOrderDTO } from '../models/orderLifecycle';

// ── Timeline ───────────────────────────────────────────────────────────────────

const STATUS_ORDER: OrderStatus[] = ['paid', 'shipped', 'received', 'completed'];

function buildTimeline(order: OrderWithDetails): OrderTimelineStep[] {
  const steps: { status: OrderStatus; label: string; completedAt: string | null }[] = [
    { status: 'paid',      label: '💳 Pagado',      completedAt: order.created_at    },
    { status: 'shipped',   label: '📦 Enviado',     completedAt: order.shipped_at    },
    { status: 'received',  label: '📬 Recibido',    completedAt: order.received_at   },
    { status: 'completed', label: '⭐ Completado',  completedAt: order.completed_at  },
  ];
  return steps.map(step => ({
    ...step,
    isCurrent: step.status === order.order_status,
  }));
}

// ── Controller ─────────────────────────────────────────────────────────────────

export const orderController = {

  // ── Legado: usado por el flujo de oferta/compra directa ───────────────────
  createOrder: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { productId } = req.body as { productId?: string };

      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'productId es obligatorio' });
      }

      const product = await orderRepository.findProductForOrder(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });
      if (product.seller_id === me) {
        return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
      }

      const order = await orderRepository.createOrder({
        buyer_id:          me,
        seller_id:         product.seller_id,
        product_id:        productId,
        price_at_purchase: product.price,
        status:            'completado',
      });

      await orderRepository.markProductReserved(productId);

      let conversationId: string | null = null;
      try {
        const conv = await chatRepository.findOrCreateConversation(productId, me, product.seller_id);
        conversationId = conv.id;
        await chatRepository.createSystemMessage(
          conv.id,
          me,
          `✅ Compra completada · ${product.price.toFixed(2)} €. El producto ha sido adquirido.`,
        );
      } catch (chatErr) {
        console.error('Error al registrar mensaje de compra en el chat:', chatErr);
      }

      return res.status(201).json({ orderId: order.id, conversationId });
    } catch (error: any) {
      console.error('Error en createOrder:', error);
      return res.status(500).json({ error: 'Error al procesar la compra' });
    }
  },

  // ── GET /buying ───────────────────────────────────────────────────────────
  getBuyingOrders: async (req: Request, res: Response) => {
    try {
      const orders = await orderLifecycleRepository.findBuyingOrders(req.user!.id);
      return res.json(orders);
    } catch (error: any) {
      console.error('Error en getBuyingOrders:', error);
      return res.status(500).json({ error: 'Error al obtener pedidos' });
    }
  },

  // ── GET /selling ──────────────────────────────────────────────────────────
  getSellingOrders: async (req: Request, res: Response) => {
    try {
      const orders = await orderLifecycleRepository.findSellingOrders(req.user!.id);
      return res.json(orders);
    } catch (error: any) {
      console.error('Error en getSellingOrders:', error);
      return res.status(500).json({ error: 'Error al obtener ventas' });
    }
  },

  // ── GET /:orderId ─────────────────────────────────────────────────────────
  getOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await orderLifecycleRepository.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

      const roles = await orderLifecycleRepository.getRoles(orderId, req.user!.id);
      if (!roles.isBuyer && !roles.isSeller) {
        return res.status(403).json({ error: 'Sin acceso a este pedido' });
      }

      const timeline = buildTimeline(order);
      return res.json({ ...order, timeline });
    } catch (error: any) {
      console.error('Error en getOrder:', error);
      return res.status(500).json({ error: 'Error al obtener el pedido' });
    }
  },

  // ── PATCH /:orderId/ship ──────────────────────────────────────────────────
  shipOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { trackingNumber } = req.body as Partial<ShipOrderDTO>;

      if (!trackingNumber?.trim()) {
        return res.status(400).json({ error: 'El número de seguimiento es obligatorio' });
      }

      const order = await orderLifecycleRepository.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      if (order.seller_id !== req.user!.id) {
        return res.status(403).json({ error: 'Solo el vendedor puede marcar el envío' });
      }
      if (order.order_status !== 'paid') {
        return res.status(400).json({ error: `El pedido está en estado '${order.order_status}', no puede marcarse como enviado` });
      }

      await orderLifecycleRepository.shipOrder(orderId, trackingNumber.trim(), order.product_id);

      // Notificación + mensaje en chat al comprador (best-effort)
      try {
        await notificationRepository.insert(order.buyer_id, 'order_shipped', req.user!.id, order.product_id);
        const conv = await chatRepository.findConversation(order.product_id, order.buyer_id, order.seller_id!);
        if (conv) {
          await chatRepository.createSystemMessage(
            conv.id,
            req.user!.id,
            `Tu pedido está en camino. Nº de seguimiento: ${trackingNumber.trim()}`,
          );
        }
      } catch (notifErr) {
        console.error('Error al notificar envío:', notifErr);
      }

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en shipOrder:', error);
      return res.status(500).json({ error: 'Error al marcar el envío' });
    }
  },

  // ── PATCH /:orderId/receive ───────────────────────────────────────────────
  receiveOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const order = await orderLifecycleRepository.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      if (order.buyer_id !== req.user!.id) {
        return res.status(403).json({ error: 'Solo el comprador puede confirmar la recepción' });
      }
      if (order.order_status !== 'shipped') {
        return res.status(400).json({ error: `El pedido está en estado '${order.order_status}', no puede confirmarse la recepción` });
      }

      await orderLifecycleRepository.receiveOrder(orderId);

      let conversationId: string | null = null;
      try {
        if (order.seller_id) {
          await notificationRepository.insert(order.seller_id, 'order_received', req.user!.id, order.product_id);
        }
        const conv = await chatRepository.findConversation(order.product_id, order.buyer_id, order.seller_id!);
        conversationId = conv?.id ?? null;
      } catch (notifErr) {
        console.error('Error al notificar recepción:', notifErr);
      }

      return res.json({ ok: true, conversationId });
    } catch (error: any) {
      console.error('Error en receiveOrder:', error);
      return res.status(500).json({ error: 'Error al confirmar la recepción' });
    }
  },

  // ── PATCH /:orderId/cancel ────────────────────────────────────────────────
  cancelExpiredOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const order = await orderLifecycleRepository.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      if (order.seller_id !== req.user!.id) {
        return res.status(403).json({ error: 'Solo el vendedor puede cancelar el pedido' });
      }
      if (order.order_status !== 'paid') {
        return res.status(400).json({ error: 'Solo se pueden cancelar pedidos en estado pagado' });
      }

      const DEADLINE_DAYS = order.shipping_type === 'express' ? 2 : 5;
      const deadline = new Date(order.created_at);
      deadline.setDate(deadline.getDate() + DEADLINE_DAYS);
      if (Date.now() < deadline.getTime()) {
        return res.status(400).json({ error: 'El plazo de envío aún no ha vencido' });
      }

      await orderLifecycleRepository.cancelOrder(orderId, order.product_id);

      if (order.swap_group_id) {
        await orderLifecycleRepository.cancelSwapGroup(order.swap_group_id, orderId);
      }

      try {
        const conv = await chatRepository.findConversation(order.product_id, order.buyer_id, order.seller_id!);
        if (conv) {
          await chatRepository.createSystemMessage(
            conv.id,
            order.seller_id!,
            'Pedido cancelado · El vendedor no realizó el envío en el plazo establecido. El producto vuelve a estar disponible.',
          );
        }
      } catch (chatErr) {
        console.error('Error al registrar mensaje de cancelación:', chatErr);
      }

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en cancelExpiredOrder:', error);
      return res.status(500).json({ error: 'Error al cancelar el pedido' });
    }
  },

  // ── PATCH /:orderId/seller-cancel ────────────────────────────────────────
  sellerCancelOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const order = await orderLifecycleRepository.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      if (order.seller_id !== req.user!.id) {
        return res.status(403).json({ error: 'Solo el vendedor puede cancelar la venta' });
      }
      if (order.order_status !== 'paid') {
        return res.status(400).json({ error: 'Solo se pueden cancelar pedidos en estado pagado' });
      }

      await orderLifecycleRepository.cancelOrder(orderId, order.product_id);

      // Si es parte de un intercambio, cancelar también las órdenes relacionadas
      if (order.swap_group_id) {
        await orderLifecycleRepository.cancelSwapGroup(order.swap_group_id, orderId);
      }

      try {
        const conv = await chatRepository.findConversation(order.product_id, order.buyer_id, order.seller_id!);
        if (conv) {
          await chatRepository.createSystemMessage(
            conv.id,
            order.seller_id!,
            'Venta cancelada por el vendedor. El producto vuelve a estar disponible.',
          );
        }
      } catch (chatErr) {
        console.error('Error al registrar mensaje de cancelación:', chatErr);
      }

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en sellerCancelOrder:', error);
      return res.status(500).json({ error: 'Error al cancelar la venta' });
    }
  },

  // ── PATCH /:orderId/complete ──────────────────────────────────────────────
  completeOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const order = await orderLifecycleRepository.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      if (order.buyer_id !== req.user!.id) {
        return res.status(403).json({ error: 'Solo el comprador puede completar el pedido' });
      }
      if (order.order_status !== 'received') {
        return res.status(400).json({ error: `El pedido está en estado '${order.order_status}', no puede completarse` });
      }

      await orderLifecycleRepository.completeOrder(orderId);

      try {
        const conv = await chatRepository.findConversation(order.product_id, order.buyer_id, order.seller_id!);
        if (conv) {
          await chatRepository.createSystemMessage(
            conv.id,
            req.user!.id,
            'Pedido completado · ¡Gracias por tu compra!',
          );
        }
      } catch (chatErr) {
        console.error('Error al registrar mensaje de completado:', chatErr);
      }

      return res.json({ ok: true });
    } catch (error: any) {
      console.error('Error en completeOrder:', error);
      return res.status(500).json({ error: 'Error al completar el pedido' });
    }
  },
};
