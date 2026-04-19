import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/cartContext';

export default function Navbar() {
  const { carrito } = useCart();
  const location = useLocation();

  return (
    <header className="main-header">
      <Link to="/" className="logo-title" style={{ textDecoration: 'none', color: 'inherit' }}>
        Wearify
      </Link>
      
      <nav className="nav-menu">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Productos
        </Link>
        <Link to="/perfil" className={`nav-link ${location.pathname === '/perfil' ? 'active' : ''}`}>
          Mi Perfil
        </Link>
        <Link to="/carrito" 
          className={`nav-link ${location.pathname === '/carrito' ? 'active' : ''}`}
          style={{ fontWeight: 'bold', color: carrito.length > 0 ? '#28a745' : 'inherit' }}
        >
          Carrito ({carrito.reduce((total, item) => total + item.cantidad, 0)})
        </Link>
      </nav>
    </header>
  );
}