import { NuevoProducto } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

// 1. OBTENER PRODUCTOS (GET)
export const getProducts = async () => {
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
    return data;
  } catch (error) {
    console.error("Error al conectar con la API:", error);
    return null;
  }
};

// 2. CREAR PRODUCTO (POST)
export const createProduct = async (productData: NuevoProducto, token: string) => {
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
    return data;
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return null;
  }
};

// 3. OBTENER PRODUCTO POR ID (GET)
export const getProductById = async (id: string) => {
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
    return data;
  } catch (error) {
    console.error(`Error al conectar con la API para el producto ${id}:`, error);
    return null;
  }
}
// 4. OBTENER USUARIO POR ID (GET)
export const getUserById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/users/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
}
// 5. CREAR PERFIL DE USUARIO EN LA BD (POST)
export const createUserProfile = async (userData: { id: string, username: string, email: string }) => {
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
    return data;
  } catch (error) {
    console.error("Error al guardar el usuario en la base de datos:", error);
    return null;
  }
};

// 6. OBTENER PERFIL PÚBLICO Y ESTADÍSTICAS (GET)
export const getPublicProfile = async (id: string) => {
  try {
    // Usamos la nueva ruta pública que creamos en el backend
    const response = await fetch(`${API_URL}/users/public/${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al obtener el perfil público:", error);
    return null;
  }
};

// 7. COMPROBAR SI SIGO A UN USUARIO (GET)
export const checkIsFollowing = async (followerId: string, followingId: string) => {
  try {
    const response = await fetch(`${API_URL}/users/is-following/${followerId}/${followingId}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.isFollowing; // Devuelve un booleano (true/false)
  } catch (error) {
    console.error("Error al comprobar seguimiento:", error);
    return false;
  }
};

// 8. SEGUIR A UN USUARIO (POST)
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

// 9. DEJAR DE SEGUIR A UN USUARIO (POST)
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