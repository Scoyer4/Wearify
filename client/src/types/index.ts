export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'camisetas' | 'pantalones' | 'zapatos' | 'accesorios';
  imagen_url: string;
  vendedor_id: string;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre_completo?: string;
  avatar_url?: string;
}