import { Router } from "express";
import { listingController } from "../controllers/listingController";
import { verifyAuth } from "../middlewares/auth";

const router = Router();

router.get("/", listingController.getAll);
router.get("/:id", listingController.getById);

router.post("/", verifyAuth, listingController.create);
router.put("/:id", verifyAuth, listingController.update);
router.delete("/:id", verifyAuth, listingController.delete);

export default router;