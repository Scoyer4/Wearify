import { Router } from 'express';
import { userController } from '../controllers/userController';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Rutas estáticas PRIMERO (antes de /:id)
router.post("/", userController.create);

// Ban status check — no usa verifyAuth para que los usuarios baneados puedan leer su estado
router.get("/ban-status", async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const { data: { user }, error } = await (await import('../config/db')).default.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });
    const db = (await import('../config/db')).default as any;
    const { data } = await db
      .from('users')
      .select('is_banned, ban_reason')
      .eq('id', user.id)
      .maybeSingle();
    return res.json({
      isBanned:  data?.is_banned  ?? false,
      banReason: data?.ban_reason ?? null,
    });
  } catch {
    return res.status(500).json({ error: 'Error al comprobar estado de la cuenta' });
  }
});

router.get("/me", verifyAuth, userController.getMe);
router.put("/me", verifyAuth, userController.updateMe);
router.patch("/me/privacy", verifyAuth, userController.updatePrivacy);

router.get("/public/:id", userController.getPublicProfile);
router.get("/email/:username", userController.getEmailByUsername);
router.get("/is-following/:followerId/:followingId", userController.checkIsFollowing);

router.post("/follow", verifyAuth, userController.followUser);
router.post("/unfollow", verifyAuth, userController.unfollowUser);

// Rutas de followers/following (requieren auth por la privacy gate)
router.get("/:userId/followers", verifyAuth, userController.getFollowers);
router.get("/:userId/following", verifyAuth, userController.getFollowing);
router.get("/:userId/follow-counts", userController.getFollowCounts);

// Ruta dinámica AL FINAL (captura cualquier /:id)
router.get("/:id", userController.getById);

export default router;