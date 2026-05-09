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
    case 'follow':           return `${who} te está siguiendo`;
    case 'follow_request':   return `${who} quiere seguirte`;
    case 'follow_accepted':  return `${who} aceptó tu solicitud`;
    case 'new_product':      return `${who} publicó: ${n.product?.title ?? 'un nuevo producto'}`;
    case 'price_drop':       return `Bajada de precio en "${n.product?.title ?? 'un producto'}" que tienes en favoritos`;
    case 'new_sale':         return `${who} compró tu producto${n.product?.title ? `: "${n.product.title}"` : ''}`;
    case 'order_shipped':    return `Tu pedido${n.product?.title ? ` "${n.product.title}"` : ''} ha sido enviado`;
    case 'order_received':   return `${who} confirmó la recepción de "${n.product?.title ?? 'tu producto'}"`;
    case 'product_deleted':  return n.message ?? 'Uno de tus productos ha sido eliminado por moderación';
    default:                 return 'Nueva notificación';
  }
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
              <div className="notif-avatar">
                {n.from_user?.avatar_url
                  ? <img src={n.from_user.avatar_url} alt={n.from_user.username ?? ''} />
                  : <span>{(n.from_user?.username ?? '?')[0].toUpperCase()}</span>
                }
              </div>
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
