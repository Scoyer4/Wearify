import supabase from '../config/db';
import { Favorite } from '../models/favorites';
import { Product } from '../models/product';

type ProductRow = Omit<Product, 'image_url'> & { productImages?: { image_url: string }[] };
type FavoriteWithProduct = Favorite & { products: Product | null };

function flattenProduct(row: ProductRow): Product {
  const { productImages, ...rest } = row;
  return { ...rest, image_url: productImages?.[0]?.image_url ?? null };
}

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

  getByUser: async (userId: string): Promise<FavoriteWithProduct[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, products(*, productImages(image_url))')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return (data ?? []).map((fav: any) => ({
      ...fav,
      products: fav.products ? flattenProduct(fav.products as ProductRow) : null,
    })) as FavoriteWithProduct[];
  }
};