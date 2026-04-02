import { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository';

export const userController = {
  // 1. Registro de perfil 
  create: async (req: Request, res: Response) => {
    const { id, username, email } = req.body; 

    try {
      const user = await userRepository.create({
        id, 
        username,
        email
      });

      return res.status(201).json({
        message: "Profile created successfully",
        user
      });
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      return res.status(500).json({ error: error.message || "Error creating user profile." });
    }
  },

  // 2. Obtener mi perfil
  getMe: async (req: Request, res: Response) => {
    try {
      const supabaseId = (req as any).user.id;
      const user = await userRepository.findById(supabaseId);

      if (!user) {
        return res.status(404).json({ error: "User profile not found in DB" });
      }

      return res.json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching user data." });
    }
  },

  updateMe: async (req: Request, res: Response) => {
    try {
      const supabaseId = (req as any).user.id;
      
      const existingUser = await userRepository.findById(supabaseId);
      if (!existingUser) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const updatedUser = await userRepository.update(supabaseId, req.body);
      
      return res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: error.message || "Error updating user data." });
    }
  }
};