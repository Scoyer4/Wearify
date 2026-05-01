import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Ruta estática PRIMERO (evita que "unread-count" sea interpretado como :conversationId)
router.get('/unread-count', verifyAuth, chatController.getUnreadCount);

// Rutas raíz
router.post('/', verifyAuth, chatController.startConversation);
router.get('/',  verifyAuth, chatController.getConversations);

// Rutas dinámicas
router.get( '/:conversationId',          verifyAuth, chatController.getConversation);
router.get( '/:conversationId/messages', verifyAuth, chatController.getMessages);
router.post('/:conversationId/messages', verifyAuth, chatController.sendMessage);

export default router;
