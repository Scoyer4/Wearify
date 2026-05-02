import { Request, Response } from 'express';
import { checkoutRepository } from '../repositories/checkoutRepository';
import { chatRepository } from '../repositories/chatRepository';
import { ShippingOption, CreateCheckoutOrderDTO, ShippingType } from '../models/checkout';

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
      if (product.is_sold) return res.status(400).json({ error: 'Este producto ya ha sido vendido' });
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
      if (product.is_sold) return res.status(400).json({ error: 'Lo sentimos, este producto acaba de ser vendido' });
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

      // ── Marcar producto como vendido ─────────────────────────────────────────
      await checkoutRepository.markProductSold(body.productId);

      // ── Guardar dirección si se solicitó ─────────────────────────────────────
      if (body.saveAddress) {
        await checkoutRepository.saveUserAddress(me, addr);
      }

      // ── Notificar en el chat (best-effort) ───────────────────────────────────
      try {
        const existing = await chatRepository.findConversation(body.productId, me, product.seller_id);
        const conv = existing ?? await chatRepository.createConversation(body.productId, me, product.seller_id);
        await chatRepository.createMessage(
          conv.id,
          me,
          `✅ Compra completada · ${confirmation.finalPrice.toFixed(2)} € · Envío ${body.shippingType === 'express' ? 'express' : 'estándar'}.`,
        );
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
