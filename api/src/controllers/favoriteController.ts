import { Request, Response } from "express";
import { favoriteRepository } from "../repositories/favoriteRepository";

export const favoriteController = {
  add: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { product_id } = req.body;

      if (!product_id) {
        return res.status(400).json({ error: "El product_id es obligatorio" });
      }

      const favorite = await favoriteRepository.add(userId, product_id);
      return res.status(201).json(favorite);
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      if (error.message.includes('23505')) {
         return res.status(409).json({ error: "Este producto ya está en favoritos" });
      }
      return res.status(500).json({ error: "Error al añadir a favoritos" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { product_id } = req.body;

      if (!product_id) {
        return res.status(400).json({ error: "El product_id es obligatorio" });
      }

      await favoriteRepository.remove(userId, product_id);
      return res.json({ message: "Producto eliminado de favoritos" });
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      return res.status(500).json({ error: "Error al eliminar de favoritos" });
    }
  },

  getMyFavorites: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const favorites = await favoriteRepository.getByUser(userId);
      return res.json(favorites);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      return res.status(500).json({ error: "Error al obtener los favoritos" });
    }
  }
};