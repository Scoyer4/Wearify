import { Router } from 'express';
import { checkoutController } from '../controllers/checkoutController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// GET /api/checkout/:productId  — resumen del producto + dirección guardada
// POST /api/checkout            — confirmar pedido
router.get('/:productId', verifyAuth, checkoutController.getCheckoutSummary);
router.post('/',          verifyAuth, checkoutController.confirmOrder);

export default router;
