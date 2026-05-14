import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getPending } from '../services/followerService';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { useNotifications } from '../hooks/useNotifications';
import { getCategories } from '../services/api';
import { Categoria } from '../types';
import NotificationsPanel from './NotificationsPanel/NotificationsPanel';
import logoImage from '../assets/logoWearify2_nombre.png';
import '../styles/Navbar.css';

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  const props = { viewBox: "0 0 24 24", width: 15, height: 15, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (n.includes('camiseta')) return (
    <svg {...props}>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57h1.14v13h16v-13h1.14l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
    </svg>
  );
  if (n.includes('sudadera')) return (
    <svg {...props}>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57h1.14v13h16v-13h1.14l.58-3.57a2 2 0 0 0-1.34-2.23z"/>
      <line x1="9" y1="14" x2="15" y2="14"/>
    </svg>
  );
  if (n.includes('abrigo')) return (
    <svg {...props}>
      <path d="M16 2c0 2.2-1.8 4-4 4S8 4.2 8 2L3 5.5V22h6v-9h6v9h6V5.5L16 2z"/>
    </svg>
  );
  if (n.includes('pantalon')) return (
    <svg {...props}>
      <path d="M5 3h14v9l-4 10H9L5 12V3z"/>
      <line x1="12" y1="12" x2="12" y2="22"/>
    </svg>
  );
  if (n.includes('zapatilla')) return (
    <svg {...props}>
      <path d="M3 17h18v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2z"/>
      <path d="M3 17l3-7h4l1 3h4l3-3h2l1 7"/>
    </svg>
  );
  if (n.includes('calzado')) return (
    <svg {...props}>
      <path d="M7 4v10h10v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3h4V4z"/>
      <path d="M7 4h4"/>
    </svg>
  );
  if (n.includes('accesorio')) return (
    <svg {...props}>
      <circle cx="12" cy="13" r="6"/>
      <polyline points="12 10 12 13 13.5 14.5"/>
      <path d="M15.4 17.9l-.3 3.3a2 2 0 0 1-2 1.8H10.9a2 2 0 0 1-2-1.8l-.3-3.3m.1-9.8l.3-3.3A2 2 0 0 1 10.9 3h2.2a2 2 0 0 1 2 1.8l.3 3.3"/>
    </svg>
  );
  if (n.includes('interior')) return (
    <svg {...props}>
      <path d="M4 7h16l-3 5-3-2v1H9V12l-3 2-3-5z"/>
      <path d="M7 12l-3 9h16l-3-9"/>
    </svg>
  );
  if (n.includes('traje')) return (
    <svg {...props}>
      <path d="M8 3L4 7v14h16V7l-4-4"/>
      <path d="M8 3l4 4 4-4"/>
      <path d="M12 7l1.5 5-1.5 1.5L10.5 12 12 7z"/>
    </svg>
  );
  return (
    <svg {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
}

const CAT_LINKS = [
  { label: 'Hombre', href: '/?categoria=Hombre' },
  { label: 'Mujer',  href: '/?categoria=Mujer'  },
  { label: 'Unisex', href: '/?categoria=Unisex' },
  { label: 'Niños',  href: '/?categoria=Niños'  },
];

export default function Navbar({ session, isAdmin }: { session: Session | null; isAdmin?: boolean }) {
  const location           = useLocation();
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();

  const [pendingCount, setPendingCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories,   setCategories]   = useState<Categoria[]>([]);
  const [activeCat,    setActiveCat]    = useState<string | null>(null);
  const [catDropPos,   setCatDropPos]   = useState({ top: 0, left: 0, width: 0 });
  const catCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

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

  const catParam    = searchParams.get('categoria');
  const catIdParam  = searchParams.get('catId');
  const ordenParam  = searchParams.get('orden');
  const searchParam = searchParams.get('search');

  function isCatActive(href: string) {
    const u   = new URL(href, window.location.origin);
    const cat = u.searchParams.get('categoria');
    const ord = u.searchParams.get('orden');
    const cid = u.searchParams.get('catId');
    if (cid) return catIdParam === cid;
    if (cat) return catParam === cat;
    if (ord) return ordenParam === ord;
    return false;
  }

  const zapatillasId = categories.find(c => c.name.toLowerCase().includes('zapatilla'))?.id;
  const accesoriosId = categories.find(c => c.name.toLowerCase().includes('accesorio'))?.id;

  const isHome      = location.pathname === '/' && !catParam && !ordenParam && !searchParam;
  const isLoginPage = location.pathname === '/login';

  return (
    <header className="main-header">

      {/* ── FILA 1 ──────────────────────────────────────────── */}
      <div className={`nav-top${isLoginPage ? ' nav-top--login' : ''}`}>

        <Link to="/" className="logo-title">
          <img src={logoImage} alt="logoWearify" />
        </Link>

        {!isLoginPage && <form className="nav-search" onSubmit={handleSearch}>
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
        </form>}

        {!isLoginPage && <div className="nav-actions">
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
                      <span className="nav-dropdown-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                      </span>
                      Perfil
                    </Link>
                    <Link to="/pedidos" className="nav-dropdown-item" onClick={closeDropdown}>
                      <span className="nav-dropdown-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 8h14M5 8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </span>
                      Pedidos
                    </Link>
                    {pendingCount > 0 && (
                      <Link to="/solicitudes" className="nav-dropdown-item" onClick={closeDropdown}>
                        <span className="nav-dropdown-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                        </span>
                        Solicitudes
                        <span className="nav-dropdown-badge">{pendingCount}</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className="nav-dropdown-item" onClick={closeDropdown}>
                        <span className="nav-dropdown-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </span>
                        Panel administración
                      </Link>
                    )}
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={handleSignOut}>
                      <span className="nav-dropdown-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      </span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth-btns">
              <Link to="/login" className="btn-secondary nav-auth-btn">Iniciar sesión</Link>
              <Link to="/login?register=true" className="btn-primary  nav-auth-btn">Registrarse</Link>
            </div>
          )}
        </div>}
      </div>

      {/* ── FILA 2 ──────────────────────────────────────────── */}
      {!isLoginPage && <nav className="nav-cats">

        {/* Todo — sin dropdown */}
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

        {/* Género — con dropdown de categorías */}
        {CAT_LINKS.map(item => (
          <div
            key={item.label}
            className="nav-cat-dropdown-wrapper"
            onMouseEnter={e => {
              if (catCloseTimer.current) clearTimeout(catCloseTimer.current);
              const rect = e.currentTarget.getBoundingClientRect();
              setCatDropPos({ top: rect.bottom, left: rect.left, width: rect.width });
              setActiveCat(item.label);
            }}
            onMouseLeave={() => {
              catCloseTimer.current = setTimeout(() => setActiveCat(null), 120);
            }}
          >
            <button
              className={`nav-cat-item${isCatActive(item.href) || activeCat === item.label ? ' nav-cat-item--active' : ''}`}
              onClick={() => { setActiveCat(null); navigate(item.href); }}
            >
              {item.label}
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`nav-cat-chevron${activeCat === item.label ? ' nav-cat-chevron--open' : ''}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        ))}

        {/* Separador */}
        <span className="nav-cat-sep" />

        {/* Atajos de descubrimiento */}
        <button
          className={`nav-cat-item${isCatActive('/?orden=reciente') ? ' nav-cat-item--active' : ''}`}
          onClick={() => navigate('/?orden=reciente')}
        >
          Nuevo
        </button>
        <button
          className={`nav-cat-item${isCatActive('/?orden=favoritos') ? ' nav-cat-item--active' : ''}`}
          onClick={() => navigate('/?orden=favoritos')}
        >
          En Tendencia
        </button>
      </nav>}

      {/* ── Dropdown de categorías (fixed, fuera del overflow) ── */}
      {activeCat && categories.length > 0 && (
        <div
          className="nav-cat-dropdown"
          style={{ top: catDropPos.top, left: catDropPos.left }}
          onMouseEnter={() => { if (catCloseTimer.current) clearTimeout(catCloseTimer.current); }}
          onMouseLeave={() => { catCloseTimer.current = setTimeout(() => setActiveCat(null), 120); }}
        >
          {(() => {
            const item = CAT_LINKS.find(c => c.label === activeCat)!;
            return (
              <>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className="nav-cat-dropdown-item"
                    onClick={() => { setActiveCat(null); navigate(`${item.href}&catId=${cat.id}`); }}
                  >
                    {getCategoryIcon(cat.name)}
                    {cat.name}
                  </button>
                ))}
              </>
            );
          })()}
        </div>
      )}

    </header>
  );
}
