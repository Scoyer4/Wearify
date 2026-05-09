import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Notification } from '../../types/notification';
import * as notifService from '../../services/notificationService';
import './Notifications.css';

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)   return 'ahora';
  if (mins < 60)  return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'ayer';
  if (days < 7)   return `hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function exactDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function notifText(n: Notification): string {
  const who = n.from_user?.username ? `@${n.from_user.username}` : 'Alguien';
  switch (n.type) {
    case 'follow':          return `${who} te está siguiendo`;
    case 'follow_request':  return `${who} quiere seguirte`;
    case 'follow_accepted': return `${who} aceptó tu solicitud de seguimiento`;
    case 'new_product':     return `${who} publicó un nuevo producto: "${n.product?.title ?? 'sin título'}"`;
    case 'price_drop':      return `Bajada de precio en "${n.product?.title ?? 'un producto'}" que tienes en favoritos`;
    case 'new_sale':        return `${who} compró tu producto${n.product?.title ? `: "${n.product.title}"` : ''}`;
    case 'order_shipped':   return `Tu pedido${n.product?.title ? ` "${n.product.title}"` : ''} ha sido enviado. Revisa el número de seguimiento en Mis pedidos`;
    case 'order_received':   return `${who} confirmó la recepción de "${n.product?.title ?? 'tu producto'}". Puedes ver el estado del pedido en Mis ventas`;
    case 'product_deleted':  return n.message ?? `Tu producto ha sido eliminado por el equipo de moderación`;
    default:                 return 'Nueva notificación';
  }
}

function notifContextLink(n: Notification): string {
  switch (n.type) {
    case 'follow':
    case 'follow_request':
    case 'follow_accepted':
      return n.from_user_id ? `/usuario/${n.from_user_id}` : '/';
    case 'new_product':
    case 'price_drop':
      return n.product_id ? `/producto/${n.product_id}` : '/';
    case 'new_sale':
    case 'order_shipped':
    case 'order_received':
      return '/pedidos';
    case 'product_deleted':
      return '/perfil';
    default:
      return '/';
  }
}

type DateGroup = 'Hoy' | 'Ayer' | 'Esta semana' | 'Anteriores';
const GROUP_ORDER: DateGroup[] = ['Hoy', 'Ayer', 'Esta semana', 'Anteriores'];

function getDateGroup(dateStr: string): DateGroup {
  const now  = new Date();
  const date = new Date(dateStr);
  if (now.toDateString() === date.toDateString()) return 'Hoy';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return 'Ayer';
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) return 'Esta semana';
  return 'Anteriores';
}

function groupNotifications(items: Notification[]): { label: DateGroup; items: Notification[] }[] {
  const map: Partial<Record<DateGroup, Notification[]>> = {};
  for (const n of items) {
    const g = getDateGroup(n.created_at);
    if (!map[g]) map[g] = [];
    map[g]!.push(n);
  }
  return GROUP_ORDER.filter(g => map[g]?.length).map(label => ({ label, items: map[label]! }));
}

// ── Avatar por tipo ────────────────────────────────────────────────────────

function NotifAvatar({ n }: { n: Notification }) {
  if (n.type === 'new_sale' || n.type === 'order_received') {
    return (
      <div className="nf-avatar nf-avatar--icon nf-avatar--success">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (n.type === 'order_shipped') {
    return (
      <div className="nf-avatar nf-avatar--icon nf-avatar--brand">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      </div>
    );
  }
  if (n.type === 'price_drop') {
    return (
      <div className="nf-avatar nf-avatar--icon nf-avatar--warning">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>
    );
  }
  if (n.type === 'new_product') {
    return (
      <div className="nf-avatar nf-avatar--icon nf-avatar--teal">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
    );
  }
  if (n.type === 'product_deleted') {
    return (
      <div className="nf-avatar nf-avatar--icon nf-avatar--danger">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </div>
    );
  }
  return (
    <div className="nf-avatar">
      {n.from_user?.avatar_url
        ? <img src={n.from_user.avatar_url} alt={n.from_user.username ?? ''} />
        : <span>{(n.from_user?.username ?? '?')[0].toUpperCase()}</span>
      }
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

interface Props {
  session: Session | null;
}

export default function Notifications({ session }: Props) {
  const navigate = useNavigate();

  const [items,       setItems]       = useState<Notification[]>([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const token = session?.access_token ?? null;

  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    if (!token) return;
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    const data = await notifService.getNotifications(token, pageNum);
    if (data) {
      setItems(prev => append ? [...prev, ...data.items] : data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setUnreadCount(data.unreadCount);
    } else {
      setError('Error al cargar las notificaciones');
    }
    append ? setLoadingMore(false) : setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    fetchPage(1);
  }, [session]);

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0) return;
    await notifService.markAllRead(token);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read && token) {
      notifService.markRead(n.id, token);
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    navigate(notifContextLink(n));
  };

  const groups = groupNotifications(items);

  return (
    <div className="nf-page">

      {/* Header */}
      <div className="nf-header">
        <button className="nf-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="nf-title">Notificaciones</h1>
        {unreadCount > 0 && (
          <button className="nf-mark-all-btn" onClick={handleMarkAllRead}>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="nf-skeleton">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="nf-skeleton-item">
              <div className="skeleton nf-skeleton-avatar" />
              <div className="nf-skeleton-body">
                <div className="skeleton nf-skeleton-line" style={{ width: '75%' }} />
                <div className="skeleton nf-skeleton-line" style={{ width: '50%' }} />
                <div className="skeleton nf-skeleton-line" style={{ width: '30%', marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="nf-error">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => fetchPage(1)}>Reintentar</button>
        </div>
      ) : items.length === 0 ? (
        <div className="nf-empty">
          <div className="nf-empty-icon">
            <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M32 8a16 16 0 0 0-16 16c0 18-8 24-8 24h48s-8-6-8-24A16 16 0 0 0 32 8z" />
              <path d="M36.73 56a4 4 0 0 1-9.46 0" />
            </svg>
          </div>
          <p className="nf-empty-title">No tienes notificaciones todavía</p>
          <p className="nf-empty-sub">Aquí aparecerán tus notificaciones de compras, seguidores y más.</p>
        </div>
      ) : (
        <div className="nf-list">
          {groups.map(group => (
            <div key={group.label} className="nf-group">

              <div className="nf-group-label">{group.label}</div>

              {group.items.map(n => (
                <div
                  key={n.id}
                  className={`nf-row${n.is_read ? '' : ' nf-row--unread'}`}
                  onClick={() => handleClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleClick(n)}
                >
                  {/* Indicador izquierda */}
                  <div className={`nf-indicator${n.is_read ? ' nf-indicator--hidden' : ''}`} />

                  {/* Avatar */}
                  <NotifAvatar n={n} />

                  {/* Cuerpo */}
                  <div className="nf-row-body">
                    <p className="nf-row-text">{notifText(n)}</p>
                    <div className="nf-row-time">
                      <span className="nf-time-relative">{timeAgo(n.created_at)}</span>
                      <span className="nf-time-exact">{exactDate(n.created_at)}</span>
                    </div>
                  </div>

                  {/* Acción */}
                  <span className="nf-row-action" aria-hidden="true">Ver →</span>
                </div>
              ))}

            </div>
          ))}

          {/* Cargar más */}
          {page < totalPages && (
            <button
              className="nf-load-more"
              onClick={() => fetchPage(page + 1, true)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Cargando...' : 'Cargar más'}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
