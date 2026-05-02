import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Rutas estáticas PRIMERO (evita colisión con :conversationId)
router.get('/unread-count', verifyAuth, chatController.getUnreadCount);

// Rutas raíz y estáticas de segundo nivel
router.post('/direct-offer', verifyAuth, chatController.makeDirectOffer);
router.post('/', verifyAuth, chatController.startConversation);
router.get('/',  verifyAuth, chatController.getConversations);

// Rutas de conversación
router.get( '/:conversationId',          verifyAuth, chatController.getConversation);
router.get( '/:conversationId/messages', verifyAuth, chatController.getMessages);
router.post('/:conversationId/messages', verifyAuth, chatController.sendMessage);

// Rutas de ofertas — static (/offer) antes que dynamic (/:messageId/...)
router.post(  '/:conversationId/offer',                    verifyAuth, chatController.makeOffer);
router.patch( '/:conversationId/offer/:messageId/accept',  verifyAuth, chatController.acceptOffer);
router.patch( '/:conversationId/offer/:messageId/reject',  verifyAuth, chatController.rejectOffer);
router.patch( '/:conversationId/offer/:messageId/counter', verifyAuth, chatController.counterOffer);

export default router;
