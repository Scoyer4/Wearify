import { Request, Response } from 'express';
import { userRepository } from '../repositories/userRepository';
import { followerRepository } from '../repositories/followerRepository';

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
      const supabaseId = req.user!.id;
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

  // 3. Actualizar mi perfil
  updateMe: async (req: Request, res: Response) => {
    try {
      const supabaseId = req.user!.id;
      
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
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await userRepository.findById(id);
      if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: "Error al obtener usuario." });
    }
  },

  // Buscar email por username (para login con username)
  getEmailByUsername: async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const user = await userRepository.findByUsername(username);

      if (!user) {
        return res.status(404).json({ error: "No se ha encontrado ninguna cuenta con ese nombre de usuario." });
      }

      return res.json({ email: user.email });
    } catch (error) {
      console.error("Error buscando usuario por username:", error);
      return res.status(500).json({ error: "Error al buscar usuario." });
    }
  },

  checkEmailExists: async (req: Request, res: Response) => {
    try {
      const email = (req.query.email as string) ?? '';
      if (!email) return res.status(400).json({ error: 'Email requerido' });
      const exists = await userRepository.existsByEmail(email);
      return res.json({ exists });
    } catch (error) {
      return res.status(500).json({ error: 'Error al verificar el correo.' });
    }
  },

  getPublicProfile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const profile = await userRepository.getPublicProfile(id);
      const stats = await userRepository.getFollowStats(id);
      
      return res.status(200).json({ ...profile, stats });
    } catch (error: any) {
      console.error("Error fetching public profile:", error);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
  },

  // 5. Seguir a un usuario
  followUser: async (req: Request, res: Response) => {
    try {
      const followerId = req.user!.id; 
      const { followingId } = req.body; 

      if (!followingId) {
        return res.status(400).json({ error: 'Falta el ID del usuario a seguir' });
      }

      if (followerId === followingId) {
        return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
      }

      await userRepository.followUser(followerId, followingId);
      return res.status(200).json({ message: 'Ahora sigues a este usuario' });
    } catch (error: any) {
      return res.status(400).json({ error: 'Error al intentar seguir al usuario (¿Quizás ya lo sigues?)' });
    }
  },

  // 6. Dejar de seguir a un usuario
  unfollowUser: async (req: Request, res: Response) => {
    try {
      const followerId = req.user!.id;
      const { followingId } = req.body;
      
      await userRepository.unfollowUser(followerId, followingId);
      return res.status(200).json({ message: 'Has dejado de seguir a este usuario' });
    } catch (error: any) {
      return res.status(400).json({ error: 'Error al dejar de seguir' });
    }
  },

  checkIsFollowing: async (req: Request, res: Response) => {
    try {
      const { followerId, followingId } = req.params;

      const isFollowing = await userRepository.isFollowing(followerId, followingId);
      return res.status(200).json({ isFollowing });
    } catch (error: any) {
      return res.status(400).json({ error: 'Error al comprobar estado de seguimiento' });
    }
  },

  getFollowers: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const me = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const target = await followerRepository.findTarget(userId);
      if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (target.is_private && me !== userId) {
        const relation = await followerRepository.findRelation(me, userId);
        if (!relation || relation.status !== 'accepted') {
          return res.status(403).json({ error: 'Perfil privado' });
        }
      }

      const { items, total } = await followerRepository.getFollowers(userId, page, limit);
      const totalPages = Math.ceil(total / limit);
      return res.json({ items, page, total, totalPages });
    } catch (error: any) {
      console.error('Error en getFollowers:', error);
      return res.status(500).json({ error: 'Error al obtener seguidores' });
    }
  },

  getFollowing: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const me = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const target = await followerRepository.findTarget(userId);
      if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (target.is_private && me !== userId) {
        const relation = await followerRepository.findRelation(me, userId);
        if (!relation || relation.status !== 'accepted') {
          return res.status(403).json({ error: 'Perfil privado' });
        }
      }

      const { items, total } = await followerRepository.getFollowing(userId, page, limit);
      const totalPages = Math.ceil(total / limit);
      return res.json({ items, page, total, totalPages });
    } catch (error: any) {
      console.error('Error en getFollowing:', error);
      return res.status(500).json({ error: 'Error al obtener seguidos' });
    }
  },

  getFollowCounts: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const counts = await followerRepository.getFollowCounts(userId);
      return res.json(counts);
    } catch (error: any) {
      console.error('Error en getFollowCounts:', error);
      return res.status(500).json({ error: 'Error al obtener contadores' });
    }
  },

  updatePrivacy: async (req: Request, res: Response) => {
    try {
      const me = req.user!.id;
      const { isPrivate } = req.body;

      if (typeof isPrivate !== 'boolean') {
        return res.status(400).json({ error: 'isPrivate debe ser un booleano' });
      }

      await userRepository.update(me, { is_private: isPrivate });

      let promotedCount = 0;
      if (!isPrivate) {
        promotedCount = await followerRepository.promoteAllPending(me);
      }

      return res.json({ isPrivate, promotedCount });
    } catch (error: any) {
      console.error('Error en updatePrivacy:', error);
      return res.status(500).json({ error: 'Error al actualizar privacidad' });
    }
  },
};