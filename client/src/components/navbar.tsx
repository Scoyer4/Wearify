import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/cartContext';
// 1. Importamos el tipo Session de Supabase
import { Session } from '@supabase/supabase-js';

import NavMenu from './NavMenu';

import logoImage from '../assets/logoWearify2.png';

// 2. Le decimos al Navbar que ahora recibe la sesión como parámetro
export default function Navbar({ session }: { session: Session | null }) {
  const { carrito } = useCart();
  const location = useLocation();

  return (
    <header className="main-header">
      
      <nav className="nav-menu">
        <div className="nav-section left">

          <NavMenu />

          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Productos
          </Link>
        </div>

        <div className="nav-section center">
          <Link to="/" className="logo-title" >
            <img src={logoImage} alt="logoWearify" />
          </Link>
        </div>
        
        <div className="nav-section right">
          <button className="icon-btn search-btn" aria-label="Buscar">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {session ? (
            <>
              <Link to="/perfil" className={`icon-btn ${location.pathname === '/perfil' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
              
              <Link to="/carrito" className="icon-btn cart-link">
                <div className="cart-badge-wrapper">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {carrito.length > 0 && (
                    <span className="cart-count">
                      {carrito.reduce((total, item) => total + item.cantidad, 0)}
                    </span>
                  )}
                </div>
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '8px 20px', textDecoration: 'none', marginLeft: '10px' }}>
              Iniciar Sesión
            </Link>
          )}
        </div>
        
      </nav>
    </header>
  );
}