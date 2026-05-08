import { Router } from 'express';
import { verifyAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/admin';
import { adminController } from '../controllers/adminController';

const router = Router();
router.use(verifyAuth, requireAdmin);

router.get('/me',      adminController.getMe);
router.get('/stats',   adminController.getStats);

router.get   ('/products',            adminController.getProducts);
router.delete('/products/:productId', adminController.deleteProduct);

router.get  ('/users',              adminController.getUsers);
router.patch('/users/:userId/ban',  adminController.banUser);
router.patch('/users/:userId/unban',adminController.unbanUser);

router.get  ('/reports',                       adminController.getReports);
router.patch('/reports/:reportId/resolve',     adminController.resolveReport);
router.patch('/reports/:reportId/ignore',      adminController.ignoreReport);

export default router;
