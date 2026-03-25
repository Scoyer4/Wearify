import { Request, Response } from 'express';
import admin from '../services/firebase';
import { userRepository } from '../repositories/userRepository';

export const userController = {
  create: async (req: Request, res: Response) => {
    const { firebase_uid, username, email, password } = req.body;

    try {
      const firebaseUser = await admin.auth().createUser({
        password,
        email
      })

      const user = await userRepository.create({
        firebase_uid: firebaseUser.uid,
        username,
        email
      });

      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ error: "Error creating user." })
    }
  },

  getMe: async (req: Request, res: Response) => {
    const firebaseUid = (req as any).user.uid;

    const user = await userRepository.findByFirebaseUid(firebaseUid);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  }
}