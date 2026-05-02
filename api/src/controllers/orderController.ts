import { Request, Response } from 'express';
import { orderRepository } from '../repositories/orderRepository';

export const orderController = {

  createOrder: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { productId } = req.body as { productId?: string };

      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'productId es obligatorio' });
      }

      const product = await orderRepository.findProductForOrder(productId);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      if (product.is_sold) return res.status(400).json({ error: 'Este producto ya ha sido vendido' });
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

      await orderRepository.markProductSold(productId);

      return res.status(201).json({ orderId: order.id });
    } catch (error: any) {
      console.error('Error en createOrder:', error);
      return res.status(500).json({ error: 'Error al procesar la compra' });
    }
  },
};
