import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types/notification';
import '../../styles/NotificationsPanel.css';

const MAX_PANEL = 5;

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

function notifText(n: Notification): string {
  const who = n.from_user?.username ? `@${n.from_user.username}` : 'Alguien';
  switch (n.type) {
    case 'follow':          return `${who} te está siguiendo`;
    case 'follow_request':  return `${who} quiere seguirte`;
    case 'follow_accepted': return `${who} aceptó tu solicitud`;
    case 'new_product':     return `${who} publicó: ${n.product?.title ?? 'un nuevo producto'}`;
    case 'price_drop':      return `Bajada de precio en "${n.product?.title ?? 'un producto'}" que tienes en favoritos`;
    case 'new_sale':        return `${who} compró tu producto${n.product?.title ? `: "${n.product.title}"` : ''}`;
    case 'order_shipped':   return `Tu pedido${n.product?.title ? ` "${n.product.title}"` : ''} ha sido enviado`;
    case 'order_received':  return `${who} confirmó la recepción de "${n.product?.title ?? 'tu producto'}"`;
    default:                return 'Nueva notificación';
  }
}

function NotifAvatar({ n }: { n: Notification }) {
  if (n.type === 'new_sale' || n.type === 'order_received') {
    return (
      <div className="notif-avatar notif-avatar--icon notif-avatar--success">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (n.type === 'order_shipped') {
    return (
      <div className="notif-avatar notif-avatar--icon notif-avatar--brand">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      </div>
    );
  }
  if (n.type === 'price_drop') {
    return (
      <div className="notif-avatar notif-avatar--icon notif-avatar--warning">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>
    );
  }
  if (n.type === 'new_product') {
    return (
      <div className="notif-avatar notif-avatar--icon notif-avatar--teal">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>
    );
  }
  // follow / follow_request / follow_accepted → avatar del usuario
  return (
    <div className="notif-avatar">
      {n.from_user?.avatar_url
        ? <img src={n.from_user.avatar_url} alt={n.from_user.username ?? ''} />
        : <span>{(n.from_user?.username ?? '?')[0].toUpperCase()}</span>
      }
    </div>
  );
}

interface Props {
  notifications: Notification[];
  loading:       boolean;
  onClose:       () => void;
  panelRef:      React.RefObject<HTMLDivElement>;
}

export default function NotificationsPanel({ notifications, loading, onClose, panelRef }: Props) {
  const navigate = useNavigate();
  const visible  = notifications.slice(0, MAX_PANEL);

  const handleClick = () => {
    navigate('/notifications');
    onClose();
  };

  return (
    <div className="notif-panel" ref={panelRef}>

      <div className="notif-panel__header">
        <span className="notif-panel__title">Notificaciones</span>
      </div>

      {loading && visible.length === 0 ? (
        <div className="notif-panel__loading">
          {[1, 2, 3].map(i => (
            <div key={i} className="notif-item notif-item--skeleton">
              <div className="notif-avatar skeleton" />
              <div className="notif-body">
                <div className="skeleton-line" style={{ width: '70%' }} />
                <div className="skeleton-line" style={{ width: '35%', marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="notif-panel__empty">No tienes notificaciones</p>
      ) : (
        <ul className="notif-list">
          {visible.map(n => (
            <li
              key={n.id}
              className={`notif-item${!n.is_read ? ' notif-item--unread' : ''}`}
              onClick={handleClick}
            >
              <NotifAvatar n={n} />
              <div className="notif-body">
                <p className="notif-text">{notifText(n)}</p>
                <span className="notif-time">{timeAgo(n.created_at)}</span>
              </div>
              {!n.is_read && <span className="notif-dot" />}
            </li>
          ))}
        </ul>
      )}

      <button className="notif-panel__footer" onClick={handleClick}>
        Ver todas las notificaciones →
      </button>

    </div>
  );
}
