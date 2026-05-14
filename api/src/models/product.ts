// src/models/Product.ts

export type ProductStatus = 'Disponible' | 'Reservado' | 'Vendido';
export type ClothingCondition = 'Sin usar' | 'Usado' | 'Buen estado' | 'Excelente' | 'Como nuevo';
export type ClothingGender = 'Mujer' | 'Hombre' | 'Niños' | 'Unisex';

export interface Product {
  id: string;
  seller_id: string;
  category_id: number;
  title: string;
  description: string | null;
  price: number;
  brand: string;
  size: string;
  condition: ClothingCondition;
  gender?: ClothingGender | null;
  status: ProductStatus;
  image_url?: string | null;
  images?: string[];
  favorites_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ProductInsert = {
  seller_id: string;
  category_id: number;
  title: string;
  description?: string | null;
  price: number;
  brand: string;
  size: string;
  condition: ClothingCondition;
  gender?: ClothingGender | null;
  status?: ProductStatus;
  id?: never;
  created_at?: never;
  updated_at?: never;
};

export type ProductUpdate = {
  category_id?: number;
  title?: string;
  description?: string | null;
  price?: number;
  brand?: string;
  size?: string;
  condition?: ClothingCondition;
  gender?: ClothingGender | null;
  status?: ProductStatus;
  image_url?: string | null;
};