export interface User {
  id?: number;
  firebase_uid: string;
  username: string;
  email: string;
  created_at?: string | null;
};

export type UserInsert = {
  firebase_uid: string;
  email: string;
  username: string;
  created_at?: string | null;
};

export type UserUpdate = {
  firebase_uid?: string;
  email?: string;
  username?: string;
  created_at?: string | null;
};
