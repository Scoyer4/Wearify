import { Request, Response } from "express";
import { productRepository } from "../repositories/productRepository";
import { notificationRepository } from "../repositories/notificationRepository";

export const productController = {
  getAll: async (_req: Request, res: Response) => {
    try {
      const products = await productRepository.getAll();
      return res.json(products);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching products" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const product = await productRepository.getById(id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      return res.json(product);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching product" });
    }
  },

  getBySeller: async (req: Request, res: Response) => {
    try {
      const { sellerId } = req.params;
      const products = await productRepository.getBySellerId(sellerId);
      return res.json(products);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching seller products" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; 

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const newProduct = await productRepository.create({
        ...req.body,
        seller_id: userId
      });

      notificationRepository.insertForAllFollowers(userId, newProduct.id).catch(console.error);

      return res.status(201).json({
        message: "Product created successfully",
        product: newProduct
      });
    } catch (error: any) {
      console.error("Error en create product:", error);
      return res.status(500).json({ error: error.message || "Error creating product" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = req.user!.id;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const product = await productRepository.getById(id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      if (product.seller_id !== userId) {
        return res.status(403).json({ error: "Unauthorized to update this product" }); 
      }

      const updated = await productRepository.update(id, req.body);
      return res.json(updated);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || "Error updating product" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = req.user!.id;

      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const product = await productRepository.getById(id);
      if (!product) return res.status(404).json({ error: "Product not found" });

      if (product.seller_id !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this product" }); 
      }

      await productRepository.delete(id);
      return res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: error.message || "Error deleting product" });
    }
  }
};