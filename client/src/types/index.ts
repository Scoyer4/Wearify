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
  is_sold?: boolean;

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
  is_private?: boolean;
}

export interface PerfilPublico {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string;
  bio?: string;
  is_private?: boolean;
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

export type FollowStatus = 'pending' | 'accepted';

export type FollowRelationStatus = 'none' | 'pending' | 'accepted';

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface FollowActionResponse {
  status: FollowStatus;
}

export interface FollowStatusResponse {
  iFollow: FollowRelationStatus;
  followsMe: FollowRelationStatus;
}

export interface FollowCountsResponse {
  followers: number;
  following: number;
}

export interface PaginatedUsersResponse {
  items: PublicUser[];
  page: number;
  total: number;
  totalPages: number;
}

export interface PendingRequestsResponse {
  items: PublicUser[];
  page: number;
  total: number;
  totalPages: number;
}

export interface PrivacyUpdateResponse {
  isPrivate: boolean;
  promotedCount: number;
}