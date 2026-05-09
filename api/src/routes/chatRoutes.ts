import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Rutas estáticas PRIMERO (evita colisión con :conversationId)
router.get('/unread-count', verifyAuth, chatController.getUnreadCount);

// Rutas raíz y estáticas de segundo nivel
router.post('/direct-offer', verifyAuth, chatController.makeDirectOffer);
router.post('/direct-swap',  verifyAuth, chatController.makeDirectSwap);
router.post('/', verifyAuth, chatController.startConversation);
router.get('/',  verifyAuth, chatController.getConversations);

// Rutas de conversación
router.get( '/:conversationId',          verifyAuth, chatController.getConversation);
router.get( '/:conversationId/messages', verifyAuth, chatController.getMessages);
router.post('/:conversationId/messages', verifyAuth, chatController.sendMessage);

// Rutas de ofertas
router.post(  '/:conversationId/offer',                    verifyAuth, chatController.makeOffer);
router.patch( '/:conversationId/offer/:messageId/accept',  verifyAuth, chatController.acceptOffer);
router.patch( '/:conversationId/offer/:messageId/reject',  verifyAuth, chatController.rejectOffer);
router.patch( '/:conversationId/offer/:messageId/counter', verifyAuth, chatController.counterOffer);

// Rutas de intercambio (swap)
router.post(  '/:conversationId/swap',                    verifyAuth, chatController.makeSwap);
router.patch( '/:conversationId/swap/:messageId/accept',  verifyAuth, chatController.acceptSwap);
router.patch( '/:conversationId/swap/:messageId/reject',  verifyAuth, chatController.rejectSwap);

export default router;
