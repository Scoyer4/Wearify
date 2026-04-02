import supabase from '../config/db';
import { Favorite } from '../models/favorite';

export const favoriteRepository = {
  add: async (userId: string, productId: string): Promise<Favorite> => {
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Favorite;
  },

  remove: async (userId: string, productId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw new Error(error.message);
    return true;
  },

  getByUser: async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, products(*)') 
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data ?? [];
  }
};