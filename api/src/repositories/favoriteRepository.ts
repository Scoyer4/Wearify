import supabase from '../config/db';
import { Favorite } from '../models/Favorite';

export const favoriteRepository = {
  add: async (user_Id: number, listing_Id: number): Promise<Favorite> => {
    const { data, error } = await supabase
    .from('favorites')
    .insert([
      { user_id: user_Id, listing_id: listing_Id }
    ])
    .select()
    .single();

    if (error) {
      throw new Error(error.message);
    }
      return data!;
  },

  remove: async (user_Id: number, listing_Id: number): Promise<boolean> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user_Id)
      .eq('listing_id', listing_Id)

    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  },

  getByUser: async (user_Id: number): Promise<Favorite[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user_Id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    
    return data ?? [];
  }
}