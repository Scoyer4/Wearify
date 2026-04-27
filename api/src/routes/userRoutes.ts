import { Router } from 'express';
import { userController } from '../controllers/userController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Rutas estáticas PRIMERO (antes de /:id)
router.post("/", userController.create);

router.get("/me", verifyAuth, userController.getMe);
router.put("/me", verifyAuth, userController.updateMe);

router.get("/public/:id", userController.getPublicProfile);
router.get("/email/:username", userController.getEmailByUsername);
router.get("/is-following/:followerId/:followingId", userController.checkIsFollowing);

router.post("/follow", verifyAuth, userController.followUser);
router.post("/unfollow", verifyAuth, userController.unfollowUser);

// Ruta dinámica AL FINAL (captura cualquier /:id)
router.get("/:id", userController.getById);

export default router;