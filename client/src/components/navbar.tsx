import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getPending } from '../services/followerService';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useNotifications } from '../hooks/useNotifications';
import NavMenu from './NavMenu';
import NotificationsPanel from './NotificationsPanel/NotificationsPanel';
import logoImage from '../assets/logoWearify2.png';

const NAV_CATEGORIES = [
  { label: 'Hombre',     filter: 'Hombre'  },
  { label: 'Mujer',      filter: 'Mujer'   },
  { label: 'Zapatillas', filter: 'Calzado' },
  { label: 'Marcas',     filter: 'Marcas'  },
];

export default function Navbar({ session }: { session: Session | null }) {
  const { carrito } = useCart();
  const location    = useLocation();
  const navigate    = useNavigate();

  const [pendingCount,  setPendingCount]  = useState(0);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
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

  // Cerrar dropdown al hacer click fuera
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

  return (
    <header className="main-header">
      <nav className="nav-menu">

        {/* ── IZQUIERDA ─────────────────────────────────────── */}
        <div className="nav-section left">
          <NavMenu />
          <div className="nav-categories">
            {NAV_CATEGORIES.map(cat => (
              <button
                key={cat.label}
                className="nav-cat-link"
                onClick={() => navigate(`/?categoria=${encodeURIComponent(cat.filter)}`)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTRO ────────────────────────────────────────── */}
        <div className="nav-section center">
          <Link to="/" className="logo-title">
            <img src={logoImage} alt="logoWearify" />
          </Link>
        </div>

        {/* ── DERECHA ───────────────────────────────────────── */}
        <div className="nav-section right">

          {/* Buscar */}
          <button className="icon-btn search-btn" aria-label="Buscar">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

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

              {/* Avatar + Dropdown */}
              <div className="nav-avatar-wrapper" ref={dropdownRef}>
                <button
                  className={`nav-avatar-btn${dropdownOpen ? ' nav-avatar-btn--open' : ''}`}
                  onClick={() => setDropdownOpen(d => !d)}
                  aria-label="Menú de usuario"
                  aria-expanded={dropdownOpen}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="nav-avatar-img" />
                    : <span className="nav-avatar-initials">{userInitial}</span>
                  }
                  <svg
                    className="nav-avatar-chevron"
                    viewBox="0 0 24 24" width="11" height="11"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <Link to="/perfil"    className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">👤</span> Mi perfil
                    </Link>
                    <Link to="/pedidos"   className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">📦</span> Mis pedidos
                    </Link>
                    <Link to="/pedidos"   className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">🏷️</span> Mis ventas
                    </Link>
                    <Link to="/carrito"   className="nav-dropdown-item" onClick={closeDropdown}>
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
                    <Link to="/perfil"    className="nav-dropdown-item" onClick={closeDropdown}>
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
      </nav>
    </header>
  );
}
