import supabase from "../config/db";
import { Category, CategoryInsert } from "../models/Category";

export const categoryRepository = {
  getAll: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);

    return data ?? [];
  },


  create: async (category: CategoryInsert): Promise<Category> => {
    const { data, error } = await supabase
      .from("categories")
      .insert([category]) // SIEMPRE array
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data!;
  }

};