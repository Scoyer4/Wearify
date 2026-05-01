import { Router } from 'express';
import { followerController } from '../controllers/followerController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Rutas estáticas PRIMERO (antes de /:userId)
router.get('/pending', verifyAuth, followerController.getPendingRequests);
router.get('/status/:userId', verifyAuth, followerController.getStatus);

// Rutas dinámicas
router.post('/:userId', verifyAuth, followerController.follow);
router.delete('/:userId', verifyAuth, followerController.unfollow);
router.post('/:userId/accept', verifyAuth, followerController.acceptRequest);
router.post('/:userId/reject', verifyAuth, followerController.rejectRequest);

export default router;
