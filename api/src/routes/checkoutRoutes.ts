import { Router } from 'express';
import { checkoutController } from '../controllers/checkoutController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// POST /api/checkout/create-stripe-session  — crear sesión de pago en Stripe
// GET  /api/checkout/session/:sessionId     — recuperar sesión tras pago + creación idempotente de pedido
// GET  /api/checkout/:productId             — resumen del producto + dirección guardada
// POST /api/checkout                        — confirmar pedido (legado / sin Stripe)
router.post('/create-stripe-session',  verifyAuth, checkoutController.createStripeSession);
router.get('/session/:sessionId',      verifyAuth, checkoutController.getStripeSession);
router.get('/:productId',              verifyAuth, checkoutController.getCheckoutSummary);
router.post('/',                       verifyAuth, checkoutController.confirmOrder);

export default router;
