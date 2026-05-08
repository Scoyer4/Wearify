import { Router } from 'express';
import { verifyAuth } from '../middlewares/auth';
import { reportController } from '../controllers/adminController';

const router = Router();
router.post('/', verifyAuth, reportController.createReport);

export default router;
