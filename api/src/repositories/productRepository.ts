import supabase from "../config/db";
import { Product, ProductInsert, ProductUpdate } from "../models/product";

type ProductRow = Omit<Product, 'image_url'> & {
  productImages?: { image_url: string }[];
};

function flattenProduct(row: ProductRow): Product {
  const { productImages, ...rest } = row;
  return { ...rest, image_url: productImages?.[0]?.image_url ?? null };
}

export const productRepository = {
  
  // 1. ACTUALIZADO: Traer los productos junto con su primera imagen
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      // Le pedimos a Supabase que traiga todo de products y también la columna image_url de productImages
      .select(`
        *,
        productImages ( image_url )
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data as ProductRow[] || []).map(flattenProduct);
  },

  // 2. ACTUALIZADO: Traer un producto por ID con su imagen
  getById: async (id: string): Promise<Product | null> => { 
    const { data, error } = await supabase
      .from("products")
      .select(`*, productImages ( image_url )`)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return flattenProduct(data as ProductRow);
  },

  // 3. ACTUALIZADO: Guardar el producto y la imagen por separado
  create: async (product: ProductInsert & { image_url?: string | null }): Promise<Product> => {
    // Separamos la URL de la imagen del resto de los datos del producto
    const { image_url, ...productData } = product;

    // A) Insertamos el producto en la tabla "products"
    const { data, error } = await supabase
      .from("products")
      .insert(productData) 
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating product:", error);
      throw new Error(error.message);
    }

    const nuevoProducto = data as Omit<Product, 'image_url'>;

    // B) Si el usuario envió una imagen, la guardamos en la tabla "productImages"
    if (image_url) {
      const { error: imageError } = await supabase
        .from("productImages")
        .insert({
          product_id: nuevoProducto.id, // Relacionamos la imagen con el ID del producto que acabamos de crear
          image_url: image_url
        });

      if (imageError) {
        console.error("Error al guardar la imagen en productImages:", imageError);
      }
    }

    // C) Devolvemos el producto completo al Frontend para que pinte la tarjeta de inmediato
    return { ...nuevoProducto, image_url } as Product;
  },

  update: async (id: string, updates: ProductUpdate): Promise<Product> => { 
    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id);

    if (error) throw new Error(error.message);

    // Re-fetch con la imagen para devolver el producto completo
    const { data: updated, error: fetchError } = await supabase
      .from("products")
      .select(`*, productImages ( image_url )`)
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
      .select(`*, productImages ( image_url )`)
      .eq("seller_id", sellerId) 
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data as ProductRow[] || []).map(flattenProduct);
  }
};