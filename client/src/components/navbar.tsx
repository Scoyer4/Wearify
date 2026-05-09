import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/cartContext';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getPending } from '../services/followerService';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsPanel from './NotificationsPanel/NotificationsPanel';
import logoImage from '../assets/logoWearify2_nombre.png';
import '../styles/Navbar.css';

const CAT_LINKS = [
  { label: 'Hombre',        href: '/?categoria=Hombre'    },
  { label: 'Mujer',         href: '/?categoria=Mujer'     },
  { label: 'Zapatillas',    href: '/?categoria=Calzado'   },
  { label: 'Marcas',        href: '/?categoria=Marcas'    },
  { label: 'Nuevo',         href: '/?categoria=Sin%20usar'},
  { label: 'Ofertas',       href: '/?orden=precio-asc'    },
  { label: 'Recién subido', href: '/?orden=reciente'      },
];

export default function Navbar({ session, isAdmin }: { session: Session | null; isAdmin?: boolean }) {
  const { carrito }        = useCart();
  const location           = useLocation();
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();

  const [pendingCount, setPendingCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue,  setSearchValue]  = useState(searchParams.get('search') ?? '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { unreadCount: chatUnread } = useUnreadCount(session);
  const {
    unreadCount: notifUnread,
    notifications,
    isOpen:  notifOpen,
    loading: notifLoading,
    panelRef,
    toggle:  toggleNotif,
    close:   closeNotif,
  } = useNotifications(session);

  useEffect(() => {
    if (!session?.access_token) { setPendingCount(0); return; }
    getPending(session.access_token, 1).then(data => {
      if (data) setPendingCount(data.total);
    });
  }, [session]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    setSearchValue(searchParams.get('search') ?? '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
  };

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  const closeDropdown = () => setDropdownOpen(false);

  const avatarUrl   = session?.user.user_metadata?.avatar_url as string | undefined;
  const userInitial = (
    session?.user.user_metadata?.full_name as string
    ?? session?.user.email
    ?? '?'
  )[0].toUpperCase();

  const catParam   = searchParams.get('categoria');
  const ordenParam = searchParams.get('orden');
  const searchParam = searchParams.get('search');

  function isCatActive(href: string) {
    const u   = new URL(href, window.location.origin);
    const cat = u.searchParams.get('categoria');
    const ord = u.searchParams.get('orden');
    if (cat) return catParam === cat;
    if (ord) return ordenParam === ord;
    return false;
  }

  const isHome = location.pathname === '/' && !catParam && !ordenParam && !searchParam;

  return (
    <header className="main-header">

      {/* ── FILA 1 ──────────────────────────────────────────── */}
      <div className="nav-top">

        <Link to="/" className="logo-title">
          <img src={logoImage} alt="logoWearify" />
        </Link>

        <form className="nav-search" onSubmit={handleSearch}>
          <svg className="nav-search-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="nav-search-input"
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Busca por marca, estilo, talla..."
          />
        </form>

        <div className="nav-actions">
          {session ? (
            <>
              {/* Notificaciones */}
              <div style={{ position: 'relative' }}>
                <button className="icon-btn" aria-label="Notificaciones" onClick={toggleNotif}>
                  <div className="cart-badge-wrapper">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {notifUnread > 0 && (
                      <span className="cart-count">{notifUnread > 9 ? '9+' : notifUnread}</span>
                    )}
                  </div>
                </button>
                {notifOpen && (
                  <NotificationsPanel
                    notifications={notifications}
                    loading={notifLoading}
                    onClose={closeNotif}
                    panelRef={panelRef}
                  />
                )}
              </div>

              {/* Chat */}
              <Link
                to="/chats"
                className={`icon-btn ${location.pathname.startsWith('/chats') ? 'active' : ''}`}
                aria-label="Mensajes"
              >
                <div className="cart-badge-wrapper">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {chatUnread > 0 && (
                    <span className="cart-count">{chatUnread > 9 ? '9+' : chatUnread}</span>
                  )}
                </div>
              </Link>

              {/* Carrito */}
              <Link
                to="/carrito"
                className={`icon-btn cart-link ${location.pathname === '/carrito' ? 'active' : ''}`}
                aria-label="Carrito"
              >
                <div className="cart-badge-wrapper">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {carrito.length > 0 && (
                    <span className="cart-count">{carrito.length}</span>
                  )}
                </div>
              </Link>

              {/* Avatar con dropdown */}
              <div className="nav-avatar-wrapper" ref={dropdownRef}>
                <button
                  className={`nav-avatar-btn${dropdownOpen ? ' nav-avatar-btn--open' : ''}`}
                  onClick={() => setDropdownOpen(prev => !prev)}
                  aria-label="Menú de usuario"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="nav-avatar-img" />
                  ) : (
                    <span className="nav-avatar-initials">{userInitial}</span>
                  )}
                  <svg className="nav-avatar-chevron" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <Link to="/perfil" className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">👤</span> Mi perfil
                    </Link>
                    <Link to="/pedidos" className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">📦</span> Mis pedidos
                    </Link>
                    <Link to="/pedidos" className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">🏷️</span> Mis ventas
                    </Link>
                    <Link to="/carrito" className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">🛒</span>
                      Mi carrito
                      {carrito.length > 0 && (
                        <span className="nav-dropdown-badge">{carrito.length}</span>
                      )}
                    </Link>
                    {pendingCount > 0 && (
                      <Link to="/solicitudes" className="nav-dropdown-item" onClick={closeDropdown}>
                        <span className="nav-dropdown-icon">👥</span>
                        Solicitudes
                        <span className="nav-dropdown-badge">{pendingCount}</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="nav-dropdown-item" onClick={closeDropdown}>
                        <span className="nav-dropdown-icon">🛡️</span> Panel Admin
                      </Link>
                    )}
                    <Link to="/perfil" className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">⚙️</span> Ajustes
                    </Link>
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleSignOut}>
                      <span className="nav-dropdown-icon">🚪</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth-btns">
              <Link to="/login" className="btn-secondary nav-auth-btn">Iniciar sesión</Link>
              <Link to="/login" className="btn-primary  nav-auth-btn">Registrarse</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── FILA 2 ──────────────────────────────────────────── */}
      <nav className="nav-cats">
        <button
          className={`nav-cat-item${isHome ? ' nav-cat-item--active' : ''}`}
          onClick={() => navigate('/')}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          Todo
        </button>

        {CAT_LINKS.map(item => (
          <button
            key={item.label}
            className={`nav-cat-item${isCatActive(item.href) ? ' nav-cat-item--active' : ''}`}
            onClick={() => navigate(item.href)}
          >
            {item.label}
          </button>
        ))}
      </nav>

    </header>
  );
}
