import supabase from "../config/db";
import { Product, ProductInsert, ProductUpdate } from "../models/product";

export const productRepository = {
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as Product[]) ?? [];
  },

  getById: async (id: string): Promise<Product | null> => { 
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Product | null;
  },

  create: async (product: ProductInsert): Promise<Product> => {  
    const { data, error } = await supabase
      .from("products")
      .insert(product) 
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating product:", error);
      throw new Error(error.message);
    }
    return data as Product;
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

  getBySellerId: async (sellerId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId) 
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as Product[]) ?? [];
  }
};