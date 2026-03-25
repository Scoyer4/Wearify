import { Request, Response } from "express";
import { favoriteRepository } from "../repositories/favoriteRepository";
import { userRepository } from "../repositories/userRepository";

export const favoriteController = {
  add: async (req: Request, res: Response) => {
    const firebaseUid = (req as any).user.uid;
    const { listing_id } = req.body;

    const user = await userRepository.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favorite = await favoriteRepository.add(user.id!, listing_id);
    return res.status(201).json(favorite);
  },

  remove: async (req: Request, res: Response) => {
    const firebaseUid = (req as any).user.uid;
    const { listing_id } = req.body;

    const user = await userRepository.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const deleted = await favoriteRepository.remove(user.id!, listing_id);

    if (!deleted) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    return res.json({ message: "Favorite removed" });
  },

  getMyFavorites: async (req: Request, res: Response) => {
    const firebaseUid = (req as any).user.uid;

    const user = await userRepository.findByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const favorites = await favoriteRepository.getByUser(user.id!);
    return res.json(favorites);
  }
}