import supabase from "../config/db";
import { User, UserInsert, UserUpdate } from "../models/users";

export const userRepository = {
  create: async (user: UserInsert): Promise<User> => {
    const { data, error } = await supabase
      .from("users")
      .insert(user)
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
  }
};