import supabase from "../config/db";
import { User, UserInsert, UserUpdate } from "../models/users";

export const userRepository = {
  create: async (user: UserInsert): Promise<User> => {
    const { data, error } = await supabase
      .from("users")
      .upsert(user)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  findById: async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as User | null;
  },

  update: async (id: string, updates: UserUpdate): Promise<User> => {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  getPublicProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, bio, created_at')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // 2. Seguir a un usuario
  followUser: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('followers')
      .insert([{ follower_id: followerId, following_id: followingId }]);

    if (error) throw new Error(error.message);
    return data;
  },

  // 3. Dejar de seguir a un usuario
  unfollowUser: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('followers')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw new Error(error.message);
    return data;
  },

  getFollowStats: async (userId: string) => {
    const { count: followersCount, error: err1 } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    const { count: followingCount, error: err2 } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (err1 || err2) throw new Error((err1 || err2)?.message);
    
    return {
      followers: followersCount || 0,
      following: followingCount || 0
    };
  },

  // 5. Comprobar si yo ya sigo a esta persona
  isFollowing: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .match({ follower_id: followerId, following_id: followingId })
      .maybeSingle();

    if (error) throw new Error(error.message);
    return !!data; 
  }
};