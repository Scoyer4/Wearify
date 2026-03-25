import { Router } from "express";
import { favoriteController } from "../controllers/favoriteController";
import { verifyAuth } from "../middlewares/auth";

const router = Router();

router.post("/", verifyAuth, favoriteController.add);
router.delete("/", verifyAuth, favoriteController.remove);
router.get("/me", verifyAuth, favoriteController.getMyFavorites);

export default router;