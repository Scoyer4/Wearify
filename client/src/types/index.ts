export interface Producto {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  size?: string;
  seller_id?: string;
  category_id?: number;
  created_at?: string;
  brand?: string;
  condition?: string;
  status?: string;

  // Campos extra para la vista en React (no vienen de la API directamente):
  nombreVendedor?: string;
}

export type NuevoProducto = {
  title: string;
  description?: string | null;
  price: number;
  image_url?: string;
  size: string;
  category_id: number;
  brand: string;
  condition: string;
  status?: string;
};

export interface Usuario {
  id: string;
  email: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface PerfilPublico {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  stats: {
    followers: number;
    following: number;
  };
}

export interface Favorito {
  user_id: string;
  product_id: string;
  created_at?: string;
  products?: Producto;
}

export interface Categoria {
  id: number;
  name: string;
  slug: string | null;
}