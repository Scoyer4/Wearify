import supabase from '../config/db';
import { Follower, FollowStatus, PublicUser } from '../models/followers';

type TargetUser = { id: string; is_private: boolean };
type RelationRow = Pick<Follower, 'id' | 'status'>;

export const followerRepository = {
  findTarget: async (userId: string): Promise<TargetUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, is_private')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as TargetUser | null;
  },

  findRelation: async (followerId: string, followingId: string): Promise<RelationRow | null> => {
    const { data, error } = await supabase
      .from('followers')
      .select('id, status')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as RelationRow | null;
  },

  insert: async (followerId: string, followingId: string, status: FollowStatus): Promise<void> => {
    const { error } = await supabase
      .from('followers')
      .insert({ follower_id: followerId, following_id: followingId, status });
    if (error) throw new Error(error.message);
  },

  delete: async (followerId: string, followingId: string): Promise<void> => {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw new Error(error.message);
  },

  acceptPending: async (requesterId: string, ownerId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('followers')
      .update({ status: 'accepted' })
      .eq('follower_id', requesterId)
      .eq('following_id', ownerId)
      .eq('status', 'pending')
      .select('id');
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },

  deletePending: async (requesterId: string, ownerId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', requesterId)
      .eq('following_id', ownerId)
      .eq('status', 'pending')
      .select('id');
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },

  getFollowers: async (userId: string, page: number, limit: number) => {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, error, count } = await supabase
      .from('followers')
      .select('follower:users!follower_id(id, username, full_name, avatar_url)', { count: 'exact' })
      .eq('following_id', userId)
      .eq('status', 'accepted')
      .range(from, to);
    if (error) throw new Error(error.message);
    const items = (data ?? []).map((row: any) => row.follower as PublicUser);
    return { items, total: count ?? 0 };
  },

  getFollowing: async (userId: string, page: number, limit: number) => {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, error, count } = await supabase
      .from('followers')
      .select('following:users!following_id(id, username, full_name, avatar_url)', { count: 'exact' })
      .eq('follower_id', userId)
      .eq('status', 'accepted')
      .range(from, to);
    if (error) throw new Error(error.message);
    const items = (data ?? []).map((row: any) => row.following as PublicUser);
    return { items, total: count ?? 0 };
  },

  getPending: async (userId: string, page: number, limit: number) => {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, error, count } = await supabase
      .from('followers')
      .select('requester:users!follower_id(id, username, full_name, avatar_url)', { count: 'exact' })
      .eq('following_id', userId)
      .eq('status', 'pending')
      .range(from, to);
    if (error) throw new Error(error.message);
    const items = (data ?? []).map((row: any) => row.requester as PublicUser);
    return { items, total: count ?? 0 };
  },

  getFollowCounts: async (userId: string): Promise<{ followers: number; following: number }> => {
    const { count: followersCount, error: err1 } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
      .eq('status', 'accepted');

    const { count: followingCount, error: err2 } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
      .eq('status', 'accepted');

    if (err1 || err2) throw new Error((err1 || err2)?.message);
    return { followers: followersCount ?? 0, following: followingCount ?? 0 };
  },

  promoteAllPending: async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('followers')
      .update({ status: 'accepted' })
      .eq('following_id', userId)
      .eq('status', 'pending')
      .select('id');
    if (error) throw new Error(error.message);
    return (data ?? []).length;
  },
};
