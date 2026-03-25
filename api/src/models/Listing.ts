export interface Listing {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  description: string | null;
  price: number;
  image_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ListingInsert = {
  category_id: number;
  created_at?: string | null;
  description?: string | null;
  id?: never;
  image_url?: string | null;
  price: number;
  title: string;
  updated_at?: string | null;
  user_id: number;
};

export type ListingUpdate = {
  category_id?: number;
  created_at?: string | null;
  description?: string | null;
  id?: never;
  image_url?: string | null;
  price?: number;
  title?: string;
  updated_at?: string | null;
  user_id?: number;
};