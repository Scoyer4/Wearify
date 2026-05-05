import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Rutas estáticas primero (evitar colisión con /:orderId)
router.get('/buying',  verifyAuth, orderController.getBuyingOrders);
router.get('/selling', verifyAuth, orderController.getSellingOrders);

// Legado
router.post('/', verifyAuth, orderController.createOrder);

// Rutas dinámicas
router.get   ('/:orderId',          verifyAuth, orderController.getOrder);
router.patch ('/:orderId/ship',     verifyAuth, orderController.shipOrder);
router.patch ('/:orderId/receive',  verifyAuth, orderController.receiveOrder);
router.patch ('/:orderId/complete', verifyAuth, orderController.completeOrder);

export default router;
