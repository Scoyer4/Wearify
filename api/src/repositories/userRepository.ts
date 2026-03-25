import supabase from "../config/db";
import { User, UserInsert } from "../models/User";

export const userRepository = {
  create: async (user: UserInsert): Promise<User> => {
    const { data, error } = await supabase
      .from("users")
      .insert([user]) // SIEMPRE array
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data!;
  },

  findByFirebaseUid: async (firebase_uid: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("firebase_uid", firebase_uid)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

};