/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, ReactNode, useContext } from 'react';
import { Producto } from '../types';

export interface CartItem extends Producto {
  cantidad: number;
}

interface CartContextType {
  carrito: CartItem[];
  añadirAlCarrito: (producto: Producto) => void;
}

const CartContext = createContext<CartContextType>({
  carrito: [],
  añadirAlCarrito: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  const añadirAlCarrito = (producto: Producto) => {
    const productoExistente = carrito.find(item => item.id === producto.id);

    if (productoExistente) {
      setCarrito(carrito.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    
  };

  return (
    <CartContext.Provider value={{ carrito, añadirAlCarrito }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};