import supabase from "../config/db";
import { Product, ProductInsert, ProductUpdate } from "../models/product";

type ProductRow = Omit<Product, 'image_url' | 'favorites_count'> & {
  productImages?: { image_url: string }[];
  favorites?: { product_id: string }[];
};

function flattenProduct(row: ProductRow): Product {
  const { productImages, favorites, ...rest } = row;
  const images = (productImages ?? []).map(img => img.image_url);
  return {
    ...rest,
    image_url: images[0] ?? null,
    images,
    favorites_count: favorites?.length ?? 0,
  };
}

export const productRepository = {
  
  // 1. ACTUALIZADO: Traer los productos junto con su primera imagen
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      // Le pedimos a Supabase que traiga todo de products y también la columna image_url de productImages
      .select(`
        *,
        productImages ( image_url ),
        favorites ( product_id )
      `)
      .not("is_sold", "is", true)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data as ProductRow[] || []).map(flattenProduct);
  },

  // 2. ACTUALIZADO: Traer un producto por ID con su imagen
  getById: async (id: string): Promise<Product | null> => { 
    const { data, error } = await supabase
      .from("products")
      .select(`*, productImages ( image_url ), favorites ( product_id )`)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return flattenProduct(data as ProductRow);
  },

  create: async (product: ProductInsert & { image_url?: string | null; image_urls?: string[] }): Promise<Product> => {
    const { image_url, image_urls, ...productData } = product;

    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating product:", error);
      throw new Error(error.message);
    }

    const nuevoProducto = data as Omit<Product, 'image_url' | 'images'>;
    const urls = image_urls?.length ? image_urls : (image_url ? [image_url] : []);

    if (urls.length > 0) {
      const rows = urls.map(url => ({ product_id: nuevoProducto.id, image_url: url }));
      const { error: imageError } = await supabase.from("productImages").insert(rows);
      if (imageError) console.error("Error al guardar imágenes:", imageError);
    }

    return { ...nuevoProducto, image_url: urls[0] ?? null, images: urls } as Product;
  },

  update: async (id: string, updates: ProductUpdate & { image_urls?: string[] }): Promise<Product> => {
    const { image_url, image_urls, ...productUpdates } = updates;

    if (Object.keys(productUpdates).length > 0) {
      const { error } = await supabase
        .from("products")
        .update(productUpdates)
        .eq("id", id);
      if (error) throw new Error(error.message);
    }

    if (image_url !== undefined || image_urls !== undefined) {
      await supabase.from("productImages").delete().eq("product_id", id);
      const urls = image_urls?.length ? image_urls : (image_url ? [image_url] : []);
      if (urls.length > 0) {
        const rows = urls.map(url => ({ product_id: id, image_url: url }));
        await supabase.from("productImages").insert(rows);
      }
    }

    const { data: updated, error: fetchError } = await supabase
      .from("products")
      .select(`*, productImages ( image_url ), favorites ( product_id )`)
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    return flattenProduct(updated as ProductRow);
  },

  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
    return true;
  },

  // 4. ACTUALIZADO: Traer los productos del vendedor con su imagen
  getBySellerId: async (sellerId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(`*, productImages ( image_url ), favorites ( product_id )`)
      .eq("seller_id", sellerId) 
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data as ProductRow[] || []).map(flattenProduct);
  }
};