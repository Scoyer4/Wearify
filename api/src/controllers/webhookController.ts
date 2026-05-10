import { Request, Response } from 'express';
import stripeClient from '../lib/stripe';
import { checkoutRepository } from '../repositories/checkoutRepository';
import { chatRepository } from '../repositories/chatRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { ShippingAddress, ShippingType } from '../models/checkout';

export const webhookController = {

  handleStripeWebhook: async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !secret) {
      return res.status(400).json({ error: 'Falta la firma o el secreto del webhook' });
    }

    let event: ReturnType<typeof stripeClient.webhooks.constructEvent>;
    try {
      event = stripeClient.webhooks.constructEvent(req.body as Buffer, sig, secret);
    } catch (err: any) {
      console.error('Webhook: verificación de firma fallida:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Extract<typeof event.data.object, { object: 'checkout.session' }>;
      const meta = session.metadata;

      if (!meta?.productId) {
        console.error('Webhook: metadata incompleta en session', session.id);
        return res.sendStatus(200);
      }

      try {
        const shippingAddress: ShippingAddress = JSON.parse(meta.shippingAddress);
        const productPrice = parseFloat(meta.productPrice);
        const shippingCost = parseFloat(meta.shippingCost);

        await checkoutRepository.createOrder(
          {
            productId:       meta.productId,
            shippingAddress,
            shippingType:    meta.shippingType as ShippingType,
            saveAddress:     meta.saveAddress === 'true',
          },
          meta.buyerId,
          meta.sellerId,
          productPrice,
          shippingCost,
        );

        await checkoutRepository.markProductSold(meta.productId);

        if (meta.saveAddress === 'true') {
          await checkoutRepository.saveUserAddress(meta.buyerId, shippingAddress);
        }

        try {
          const conv = await chatRepository.findOrCreateConversation(meta.productId, meta.buyerId, meta.sellerId);
          await chatRepository.createMessage(
            conv.id,
            meta.buyerId,
            `✅ Pago completado · ${(productPrice + shippingCost).toFixed(2)} € · Envío ${meta.shippingType === 'express' ? 'express' : 'estándar'}.`,
          );
          await notificationRepository.insert(meta.sellerId, 'new_sale', meta.buyerId, meta.productId);
        } catch (chatErr) {
          console.error('Error al registrar mensaje de compra en el chat:', chatErr);
        }

      } catch (err: any) {
        console.error('Error procesando checkout.session.completed:', err);
        // Devolvemos 200 igualmente para que Stripe no reintente indefinidamente
      }
    }

    return res.sendStatus(200);
  },
};
