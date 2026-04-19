import { Router } from 'express';
import { userController } from '../controllers/userController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

router.post("/", userController.create);

router.get("/me", verifyAuth, userController.getMe);
router.put("/me", verifyAuth, userController.updateMe);

router.get("/:id", userController.getById);

router.get("/public/:id", userController.getPublicProfile);
router.get("/is-following/:followerId/:followingId", userController.checkIsFollowing);

router.post("/follow", verifyAuth, userController.followUser);
router.post("/unfollow", verifyAuth, userController.unfollowUser);

export default router;