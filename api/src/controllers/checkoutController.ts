import { Request, Response } from 'express';
import { checkoutRepository } from '../repositories/checkoutRepository';
import { chatRepository } from '../repositories/chatRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { ShippingOption, CreateCheckoutOrderDTO, ShippingType } from '../models/checkout';
import stripe from '../lib/stripe';

const SHIPPING_OPTIONS: ShippingOption[] = [
  { type: 'standard', label: 'Envío estándar (5-7 días)', price: 0 },
  { type: 'express',  label: 'Envío express (1-2 días)',  price: 3.99 },
];

const SHIPPING_COSTS: Record<ShippingType, number> = {
  standard: 0,
  express:  3.99,
};

export const checkoutController = {

  getCheckoutSummary: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { productId } = req.params;

      const product = await checkoutRepository.findProductForCheckout(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Este producto ya no está disponible' });
      if (product.seller_id === me) {
        return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
      }

      const savedAddress = await checkoutRepository.findSavedAddress(me);

      return res.json({
        product: {
          id:        product.id,
          title:     product.title,
          price:     product.price,
          image_url: product.image_url,
        },
        shippingOptions: SHIPPING_OPTIONS,
        savedAddress,
      });
    } catch (error: any) {
      console.error('Error en getCheckoutSummary:', error);
      return res.status(500).json({ error: 'Error al cargar el checkout' });
    }
  },

  getStripeSession: async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).json({ error: 'Pasarela de pago no configurada' });
    try {
      const me = req.user!.id;
      const { sessionId } = req.params;

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(402).json({ error: 'El pago aún no se ha completado' });
      }

      const meta = session.metadata;
      if (!meta?.buyerId) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }
      if (meta.buyerId !== me) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const product = await checkoutRepository.findProductForCheckout(meta.productId);
      const shippingAddress: import('../models/checkout').ShippingAddress = JSON.parse(meta.shippingAddress);
      const productPrice = parseFloat(meta.productPrice);
      const shippingCost = parseFloat(meta.shippingCost);

      // Creación idempotente: procesar solo si no existe ya una orden para este comprador+producto
      const existingOrder = await checkoutRepository.findOrderByProductAndBuyer(meta.productId, me);
      if (!existingOrder) {
        try {
          await checkoutRepository.createOrder(
            {
              productId:       meta.productId,
              shippingAddress,
              shippingType:    meta.shippingType as import('../models/checkout').ShippingType,
              saveAddress:     meta.saveAddress === 'true',
            },
            me,
            meta.sellerId,
            productPrice,
            shippingCost,
          );
          await checkoutRepository.markProductReserved(meta.productId);
          if (meta.saveAddress === 'true') {
            await checkoutRepository.saveUserAddress(me, shippingAddress);
          }
          const conv = await chatRepository.findOrCreateConversation(meta.productId, me, meta.sellerId);
          await chatRepository.createSystemMessage(
            conv.id,
            me,
            `Pago completado · ${(productPrice + shippingCost).toFixed(2)} € · Envío ${meta.shippingType === 'express' ? 'express' : 'estándar'}.`,
          );
          await notificationRepository.insert(meta.sellerId, 'new_sale', me, meta.productId);
        } catch (processingErr) {
          // Si el webhook ganó la carrera y ya procesó el pedido, ignoramos el error
          console.warn('getStripeSession: pedido ya procesado por webhook', processingErr);
        }
      }

      const order = await checkoutRepository.findOrderByProductAndBuyer(meta.productId, me);

      return res.json({
        orderId:         order?.id ?? null,
        productTitle:    product?.title ?? 'Producto',
        productImage:    product?.image_url ?? null,
        shippingAddress,
        shippingType:    meta.shippingType,
        productPrice,
        shippingCost,
        totalAmount:     (session.amount_total ?? 0) / 100,
      });
    } catch (error: any) {
      console.error('Error en getStripeSession:', error);
      return res.status(500).json({ error: 'Error al recuperar la sesión de pago' });
    }
  },

  createStripeSession: async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).json({ error: 'Pasarela de pago no configurada' });
    try {
      const me = req.user!.id;
      const body = req.body as Partial<CreateCheckoutOrderDTO> & { offerPrice?: number };

      if (!body.productId || typeof body.productId !== 'string') {
        return res.status(400).json({ error: 'productId es obligatorio' });
      }
      if (!body.shippingType || !['standard', 'express'].includes(body.shippingType)) {
        return res.status(400).json({ error: 'Tipo de envío no válido' });
      }

      const addr = body.shippingAddress;
      if (!addr) {
        return res.status(400).json({ error: 'La dirección de entrega es obligatoria' });
      }
      const missingFields = (['name', 'address', 'city', 'postalCode', 'country'] as const)
        .filter(f => !addr[f]?.trim());
      if (missingFields.length > 0) {
        return res.status(400).json({ error: `Faltan campos de dirección: ${missingFields.join(', ')}` });
      }

      const product = await checkoutRepository.findProductForCheckout(body.productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Lo sentimos, este producto ya no está disponible' });
      if (product.seller_id === me) {
        return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
      }

      // Precio efectivo: oferta negociada o precio original
      let effectivePrice = product.price;
      if (body.offerPrice !== undefined) {
        if (typeof body.offerPrice !== 'number' || body.offerPrice <= 0) {
          return res.status(400).json({ error: 'El precio de la oferta no es válido' });
        }
        if (body.offerPrice >= product.price) {
          return res.status(400).json({ error: 'El precio de la oferta debe ser menor que el precio original' });
        }
        effectivePrice = body.offerPrice;
      }

      const shippingCost = SHIPPING_COSTS[body.shippingType];
      const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';

      const lineItems = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: product.title,
              ...(product.image_url ? { images: [product.image_url] } : {}),
            },
            unit_amount: Math.round(effectivePrice * 100),
          },
          quantity: 1,
        },
        ...(shippingCost > 0 ? [{
          price_data: {
            currency: 'eur',
            product_data: { name: 'Envío express (1-2 días)' },
            unit_amount: Math.round(shippingCost * 100),
          },
          quantity: 1,
        }] : []),
      ];

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${clientUrl}/checkout/cancel`,
        metadata: {
          productId:       body.productId,
          buyerId:         me,
          sellerId:        product.seller_id,
          shippingType:    body.shippingType,
          shippingAddress: JSON.stringify(addr),
          saveAddress:     String(body.saveAddress ?? false),
          productPrice:    String(effectivePrice),
          shippingCost:    String(shippingCost),
        },
      });

      return res.json({ url: session.url });
    } catch (error: any) {
      console.error('Error en createStripeSession:', error);
      return res.status(500).json({ error: 'Error al crear la sesión de pago' });
    }
  },

  confirmOrder: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const body = req.body as Partial<CreateCheckoutOrderDTO>;

      // ── Validar productId ────────────────────────────────────────────────────
      if (!body.productId || typeof body.productId !== 'string') {
        return res.status(400).json({ error: 'productId es obligatorio' });
      }

      // ── Validar shippingType ─────────────────────────────────────────────────
      if (!body.shippingType || !['standard', 'express'].includes(body.shippingType)) {
        return res.status(400).json({ error: 'Tipo de envío no válido' });
      }

      // ── Validar shippingAddress ──────────────────────────────────────────────
      const addr = body.shippingAddress;
      if (!addr) {
        return res.status(400).json({ error: 'La dirección de entrega es obligatoria' });
      }
      const missingFields = (['name', 'address', 'city', 'postalCode', 'country'] as const)
        .filter(f => !addr[f]?.trim());
      if (missingFields.length > 0) {
        return res.status(400).json({ error: `Faltan campos de dirección: ${missingFields.join(', ')}` });
      }

      // ── Verificar producto ───────────────────────────────────────────────────
      const product = await checkoutRepository.findProductForCheckout(body.productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold || product.is_reserved) return res.status(400).json({ error: 'Lo sentimos, este producto ya no está disponible' });
      if (product.seller_id === me) {
        return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
      }

      // ── Calcular costes ──────────────────────────────────────────────────────
      const shippingCost = SHIPPING_COSTS[body.shippingType];

      // ── Crear pedido ─────────────────────────────────────────────────────────
      const dto: CreateCheckoutOrderDTO = {
        productId:       body.productId,
        shippingAddress: addr,
        shippingType:    body.shippingType,
        saveAddress:     body.saveAddress ?? false,
      };

      const confirmation = await checkoutRepository.createOrder(
        dto,
        me,
        product.seller_id,
        product.price,
        shippingCost,
      );

      // ── Marcar producto como reservado ──────────────────────────────────────
      await checkoutRepository.markProductReserved(body.productId);

      // ── Guardar dirección si se solicitó ─────────────────────────────────────
      if (body.saveAddress) {
        await checkoutRepository.saveUserAddress(me, addr);
      }

      // ── Notificar en el chat + notificación al vendedor (best-effort) ──────────
      try {
        const conv = await chatRepository.findOrCreateConversation(body.productId, me, product.seller_id);
        await chatRepository.createSystemMessage(
          conv.id,
          me,
          `✅ Compra completada · ${confirmation.finalPrice.toFixed(2)} € · Envío ${body.shippingType === 'express' ? 'express' : 'estándar'}.`,
        );
        await notificationRepository.insert(product.seller_id, 'new_sale', me, body.productId);
      } catch (chatErr) {
        console.error('Error al registrar mensaje de compra en el chat:', chatErr);
      }

      return res.status(201).json(confirmation);
    } catch (error: any) {
      console.error('Error en confirmOrder:', error);
      return res.status(500).json({ error: 'Error al procesar la compra' });
    }
  },
};
