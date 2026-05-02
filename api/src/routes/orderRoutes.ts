import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.post('/', verifyAuth, orderController.createOrder);

export default router;
