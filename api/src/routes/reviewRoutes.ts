import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Estática primero para evitar conflictos
router.get('/status/:conversationId', verifyAuth, reviewController.getStatus);
router.post('/', verifyAuth, reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);

export default router;
