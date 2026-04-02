export interface Category {
  id: number;
  name: string;
  slug: string | null;
}

export type CategoryInsert = {
  id?: never;
  name: string;
  slug: string;
};