export interface Category {
  id?: number;
  name: string;
  created_at?: string;
}

export type CategoryInsert = {
  name: string;
  created_at?: string | null;
};
