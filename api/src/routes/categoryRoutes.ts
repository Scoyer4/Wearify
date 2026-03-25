import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { verifyAuth } from "../middlewares/auth";

const router = Router();

router.get("/", categoryController.getAll);
router.post("/", verifyAuth, categoryController.create);

export default router;