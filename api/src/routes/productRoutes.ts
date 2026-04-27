import { Router } from "express";
import { productController } from "../controllers/productController";
import { verifyAuth } from "../middlewares/auth";

const router = Router();

router.get("/", productController.getAll);
router.get("/seller/:sellerId", productController.getBySeller);
router.get("/:id", productController.getById);

router.post("/", verifyAuth, productController.create);
router.put("/:id", verifyAuth, productController.update);
router.delete("/:id", verifyAuth, productController.delete);

export default router;