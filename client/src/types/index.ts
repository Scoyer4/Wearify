export interface Producto {
  id: string;
  title?: string;      // En App.tsx usas title o name
  name?: string;
  description: string; // En lugar de descripcion
  price: number;
  category?: 'camisetas' | 'pantalones' | 'zapatos' | 'accesorios';
  image_url: string;
  size?: string;
  seller_id?: string;
  created_at?: string;
  
  // NUEVOS CAMPOS DEL FORMULARIO:
  brand?: string;
  condition?: string;
  status?: string;

  // NUEVOS CAMPOS EXTRA PARA LA VISTA EN REACT (App.tsx):
  nombreVendedor?: string;
  error?: boolean;
}


export type NuevoProducto = Omit<Producto, 'id' | 'created_at' | 'seller_id' | 'nombreVendedor' | 'error'>;

export interface Usuario {
  id: string;
  email: string;
  nombre_completo?: string;
  avatar_url?: string;
}