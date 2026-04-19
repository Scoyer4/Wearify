export interface User {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string | null;
}

export type UserInsert = {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string | null;
};

export type UserUpdate = {
  username?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
};