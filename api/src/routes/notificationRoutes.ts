import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.get('/unread-count', verifyAuth, notificationController.getUnreadCount);
router.get('/', verifyAuth, notificationController.getNotifications);
router.patch('/mark-all-read', verifyAuth, notificationController.markAllRead);
router.patch('/:id/read', verifyAuth, notificationController.markRead);

export default router;
