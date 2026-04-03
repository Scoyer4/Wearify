// client/src/services/api.ts

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// 1. OBTENER PRODUCTOS (GET)
// ==========================================
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

// ==========================================
// 2. CREAR PRODUCTO (POST)
// ==========================================
export const createProduct = async (productData: any, token: string) => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ¡SUPER IMPORTANTE! Pasamos el token del usuario para que el backend nos deje pasar
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