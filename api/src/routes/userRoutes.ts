import { Router } from 'express';
import { userController } from '../controllers/userController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.post("/", userController.create);

router.get("/me", verifyAuth, userController.getMe);
router.put("/me", verifyAuth, userController.updateMe);

export default router;