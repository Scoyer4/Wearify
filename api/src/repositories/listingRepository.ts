import supabase from "../config/db";
import { Listing, ListingInsert, ListingUpdate } from "../models/Listing";

export const listingRepository = {
  getAll: async (): Promise<Listing[]> => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },


  getById: async (id: number): Promise<Listing | null> => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },



  create: async (listing: ListingInsert): Promise<Listing> => {  
    const { data, error } = await supabase
      .from("listings")
      .insert([listing])
      .select()
      .single();

      if (error) {
        console.error("Supabase error creating listing:", error);
        throw new Error(error.message);
      }
    return data;
  },

  update: async (id: number, updates: ListingUpdate): Promise<Listing> => {
    const { data, error } = await supabase
      .from("listings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return data!;
  },



  
  delete: async (id: number): Promise<boolean> => {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    return true;
  },
  
};