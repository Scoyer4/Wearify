import { Request, Response } from 'express';
import { categoryRepository } from '../repositories/categoryRepository';

export const categoryController = {
  getAll: async (_req: Request, res: Response) => { 
    try {
      const categories = await categoryRepository.getAll();
      return res.status(200).json(categories);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Error al obtener las categorías' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
      }

      const slug = req.body.slug || name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');

      const category = await categoryRepository.create({ name, slug });
      return res.status(201).json(category);
    } catch (error: any) {
      console.error("Error creating category:", error);
      return res.status(500).json({ error: error.message || 'Error al crear la categoría' });
    }
  }
};