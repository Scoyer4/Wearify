import { NuevoProducto, Producto, Usuario, PerfilPublico, Favorito, Categoria } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

// 1. OBTENER PRODUCTOS (GET)
export const getProducts = async (): Promise<Producto[] | null> => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Producto[];
  } catch (error) {
    console.error("Error al conectar con la API:", error);
    return null;
  }
};

// 2. CREAR PRODUCTO (POST)
export const createProduct = async (productData: NuevoProducto, token: string): Promise<Producto | null> => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Producto;
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return null;
  }
};

// 3. OBTENER PRODUCTO POR ID (GET)
export const getProductById = async (id: string): Promise<Producto | null> => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Producto;
  } catch (error) {
    console.error(`Error al conectar con la API para el producto ${id}:`, error);
    return null;
  }
};

// 4. OBTENER PRODUCTOS POR VENDEDOR (GET)
export const getProductsBySeller = async (sellerId: string): Promise<Producto[] | null> => {
  try {
    const response = await fetch(`${API_URL}/products/seller/${sellerId}`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Producto[];
  } catch (error) {
    console.error("Error al obtener productos del vendedor:", error);
    return null;
  }
};

// 5. OBTENER USUARIO POR ID (GET)
export const getUserById = async (id: string): Promise<Usuario | null> => {
  try {
    const response = await fetch(`${API_URL}/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Usuario;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
};

// 6. CREAR PERFIL DE USUARIO EN LA BD (POST)
export const createUserProfile = async (userData: { id: string, username: string, email: string }): Promise<Usuario | null> => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Usuario;
  } catch (error) {
    console.error("Error al guardar el usuario en la base de datos:", error);
    return null;
  }
};

// 6b. ACTUALIZAR PERFIL DE USUARIO (PUT)
export const updateUserProfile = async (
  updates: { username?: string; avatar_url?: string; bio?: string | null },
  token: string
): Promise<Usuario | null> => {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.user as Usuario;
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    return null;
  }
};

// 7. OBTENER PERFIL PÚBLICO Y ESTADÍSTICAS (GET)
export const getPublicProfile = async (id: string): Promise<PerfilPublico | null> => {
  try {
    const response = await fetch(`${API_URL}/users/public/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as PerfilPublico;
  } catch (error) {
    console.error("Error al obtener el perfil público:", error);
    return null;
  }
};

// 8. COMPROBAR SI SIGO A UN USUARIO (GET)
export const checkIsFollowing = async (followerId: string, followingId: string) => {
  try {
    const response = await fetch(`${API_URL}/users/is-following/${followerId}/${followingId}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.isFollowing;
  } catch (error) {
    console.error("Error al comprobar seguimiento:", error);
    return false;
  }
};

// 9. SEGUIR A UN USUARIO (POST)
export const followUser = async (followingId: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/users/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ followingId }), 
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al seguir al usuario:", error);
    return null;
  }
};

// 10. DEJAR DE SEGUIR A UN USUARIO (POST)
export const unfollowUser = async (followingId: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/users/unfollow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ followingId }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al dejar de seguir al usuario:", error);
    return null;
  }
};

// 11. OBTENER CATEGORÍAS (GET)
export const getCategories = async (): Promise<Categoria[] | null> => {
  try {
    const response = await fetch(`${API_URL}/categories`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json() as Categoria[];
    const EXCLUDED = ['Ropa interior', 'Electrónica', 'Ropa'];
    return data.filter(c => !EXCLUDED.includes(c.name));
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return null;
  }
};

// 12. AÑADIR FAVORITO (POST)
export const addFavorite = async (productId: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: productId }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al añadir a favoritos:", error);
    return null;
  }
};

// 13. ELIMINAR FAVORITO (DELETE)
export const removeFavorite = async (productId: string, token: string) => {
  try {
    const response = await fetch(`${API_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: productId }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al eliminar de favoritos:", error);
    return null;
  }
};

// 14. ACTUALIZAR PRODUCTO (PATCH)
export const updateProduct = async (id: string, updates: Partial<NuevoProducto>, token: string): Promise<Producto | null> => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json() as Producto;
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    return null;
  }
};

// 15. ELIMINAR PRODUCTO (DELETE)
export const deleteProduct = async (id: string, token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    return false;
  }
};

// 16. OBTENER MIS FAVORITOS (GET)
export const getMyFavorites = async (token: string): Promise<Favorito[] | null> => {
  try {
    const response = await fetch(`${API_URL}/favorites/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data as Favorito[];
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    return null;
  }
};