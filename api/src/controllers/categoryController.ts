import { Request, Response } from 'express';
import { categoryRepository } from '../repositories/categoryRepository';

export const categoryController = {
  getAll: async (req: Request, res: Response) => {
    const categories = await categoryRepository.getAll();
    return res.json(categories);
  },

  create: async (req: Request, res: Response) => {
    const { name } = req.body;

    const category = await categoryRepository.create({ name });
    return res.status(201).json(category);
  }
}