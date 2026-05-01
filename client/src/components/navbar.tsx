import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/cartContext';
import { Session } from '@supabase/supabase-js';
import { getPending } from '../services/followerService';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useNotifications } from '../hooks/useNotifications';
import NavMenu from './NavMenu';
import NotificationsPanel from './NotificationsPanel/NotificationsPanel';
import logoImage from '../assets/logoWearify2.png';

export default function Navbar({ session }: { session: Session | null }) {
  const { carrito } = useCart();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const { unreadCount: chatUnread } = useUnreadCount(session);
  const {
    unreadCount: notifUnread,
    notifications,
    isOpen: notifOpen,
    loading: notifLoading,
    hasMore: notifHasMore,
    panelRef,
    toggle: toggleNotif,
    close: closeNotif,
    loadMore: loadMoreNotif,
  } = useNotifications(session);

  useEffect(() => {
    if (!session?.access_token) { setPendingCount(0); return; }
    getPending(session.access_token, 1).then(data => {
      if (data) setPendingCount(data.total);
    });
  }, [session]);

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
          <Link to="/" className="logo-title">
            <img src={logoImage} alt="logoWearify" />
          </Link>
        </div>

        <div className="nav-section right">
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
                <button
                  className="icon-btn"
                  aria-label="Notificaciones"
                  onClick={toggleNotif}
                >
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
                    hasMore={notifHasMore}
                    onLoadMore={loadMoreNotif}
                    onClose={closeNotif}
                    panelRef={panelRef}
                  />
                )}
              </div>

              {pendingCount > 0 && (
                <Link to="/solicitudes" className="icon-btn" aria-label="Solicitudes de seguimiento">
                  <div className="cart-badge-wrapper">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                    <span className="cart-count">{pendingCount > 9 ? '9+' : pendingCount}</span>
                  </div>
                </Link>
              )}

              <Link to="/chats" className={`icon-btn ${location.pathname.startsWith('/chats') ? 'active' : ''}`} aria-label="Mensajes">
                <div className="cart-badge-wrapper">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {chatUnread > 0 && (
                    <span className="cart-count">{chatUnread > 9 ? '9+' : chatUnread}</span>
                  )}
                </div>
              </Link>

              <Link to="/perfil" className={`icon-btn ${location.pathname === '/perfil' ? 'active' : ''}`}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Link>

              <Link to="/carrito" className="icon-btn cart-link">
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
