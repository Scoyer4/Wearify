import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/cartContext';
// 1. Importamos el tipo Session de Supabase
import { Session } from '@supabase/supabase-js';

// 2. Le decimos al Navbar que ahora recibe la sesión como parámetro
export default function Navbar({ session }: { session: Session | null }) {
  const { carrito } = useCart();
  const location = useLocation();

  return (
    <header className="main-header">
      <Link to="/" className="logo-title" >
        Wearify
      </Link>
      
      <nav className="nav-menu">
        {/* El catálogo lo ve todo el mundo siempre */}
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Productos
        </Link>

        {/* 3. LÓGICA CONDICIONAL: ¿Hay usuario o es invitado? */}
        {session ? (
          // SI HAY SESIÓN: Mostramos sus enlaces privados
          <>
            <Link to="/carrito" 
              className={`nav-link ${location.pathname === '/carrito' ? 'active' : ''}`}
              style={{ fontWeight: 'bold', color: carrito.length > 0 ? '#28a745' : 'inherit' }}
            >
              Carrito ({carrito.reduce((total, item) => total + item.cantidad, 0)})
            </Link>
            
            <Link to="/perfil" className={`nav-link ${location.pathname === '/perfil' ? 'active' : ''}`}>
              Mi Perfil
            </Link>
          </>
        ) : (
          // SI ES INVITADO (No hay sesión): Mostramos el botón de Entrar
          <Link 
            to="/login" 
            className="btn-primary" 
            style={{ padding: '8px 20px', textDecoration: 'none', marginLeft: '10px' }}
          >
            Iniciar Sesión
          </Link>
        )}
      </nav>
    </header>
  );
}