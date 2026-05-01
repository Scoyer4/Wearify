import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types/notification';
import '../../styles/NotificationsPanel.css';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function notifText(n: Notification): string {
  const who = n.from_user?.username ? `@${n.from_user.username}` : 'Alguien';
  switch (n.type) {
    case 'follow':          return `${who} te está siguiendo`;
    case 'follow_request':  return `${who} quiere seguirte`;
    case 'follow_accepted': return `${who} aceptó tu solicitud`;
    case 'new_product':     return `${who} publicó: ${n.product?.title ?? 'un nuevo producto'}`;
  }
}

function notifLink(n: Notification): string {
  if (n.type === 'new_product' && n.product_id) return `/producto/${n.product_id}`;
  if (n.from_user_id) return `/usuario/${n.from_user_id}`;
  return '/';
}

interface Props {
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
}

export default function NotificationsPanel({ notifications, loading, hasMore, onLoadMore, onClose, panelRef }: Props) {
  const navigate = useNavigate();

  const handleClick = (n: Notification) => {
    navigate(notifLink(n));
    onClose();
  };

  return (
    <div className="notif-panel" ref={panelRef}>
      <div className="notif-panel__header">
        <span className="notif-panel__title">Notificaciones</span>
      </div>

      {loading && notifications.length === 0 ? (
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
      ) : notifications.length === 0 ? (
        <p className="notif-panel__empty">No tienes notificaciones</p>
      ) : (
        <ul className="notif-list">
          {notifications.map(n => (
            <li
              key={n.id}
              className={`notif-item${!n.is_read ? ' notif-item--unread' : ''}`}
              onClick={() => handleClick(n)}
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

      {hasMore && (
        <button className="notif-panel__more" onClick={onLoadMore} disabled={loading}>
          {loading ? 'Cargando...' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
