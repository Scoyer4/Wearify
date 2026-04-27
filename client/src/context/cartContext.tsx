/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, ReactNode, useContext } from 'react';
import { Producto } from '../types';

interface CartContextType {
  carrito: Producto[];
  añadirAlCarrito: (producto: Producto) => void;
  eliminarDelCarrito: (id: string) => void;
}

const CartContext = createContext<CartContextType>({
  carrito: [],
  añadirAlCarrito: () => { },
  eliminarDelCarrito: () => { },
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [carrito, setCarrito] = useState<Producto[]>([]);

  const añadirAlCarrito = (producto: Producto) => {
    // En segunda mano, cada artículo es único: no permitir duplicados
    const yaExiste = carrito.some(item => item.id === producto.id);
    if (yaExiste) {
      return; // El producto ya está en el carrito
    }
    setCarrito([...carrito, producto]);
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  return (
    <CartContext.Provider value={{ carrito, añadirAlCarrito, eliminarDelCarrito }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};