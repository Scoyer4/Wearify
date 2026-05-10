import { Router } from 'express';
import express from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

// express.raw es obligatorio para que stripe.webhooks.constructEvent pueda verificar la firma
router.post('/', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

export default router;
