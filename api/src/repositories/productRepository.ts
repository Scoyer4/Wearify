import supabase from "../config/db";
import { Product, ProductInsert, ProductUpdate } from "../models/product";

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

    // Formateamos los datos para que el Frontend los entienda como antes
    const productosAplanados = (data || []).map((prod: any) => {
      // Sacamos la primera imagen si es que tiene alguna
      const primeraImagen = prod.productImages && prod.productImages.length > 0 
        ? prod.productImages[0].image_url 
        : null;
        
      // Quitamos el array de productImages y devolvemos image_url directo
      const { productImages, ...restoDelProducto } = prod;
      return { ...restoDelProducto, image_url: primeraImagen };
    });

    return productosAplanados as Product[];
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

    const prod: any = data;
    const primeraImagen = prod.productImages && prod.productImages.length > 0 
        ? prod.productImages[0].image_url 
        : null;
        
    const { productImages, ...restoDelProducto } = prod;
    return { ...restoDelProducto, image_url: primeraImagen } as Product;
  },

  // 3. ACTUALIZADO: Guardar el producto y la imagen por separado
  create: async (product: ProductInsert | any): Promise<Product> => {  
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

    const nuevoProducto = data as any;

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
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
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

    return (data || []).map((prod: any) => {
      const primeraImagen = prod.productImages && prod.productImages.length > 0 
        ? prod.productImages[0].image_url 
        : null;
      const { productImages, ...resto } = prod;
      return { ...resto, image_url: primeraImagen } as Product;
    });
  }
};