import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { getPending, acceptRequest, rejectRequest } from '../../services/followerService';
import { PublicUser } from '../../types';
import '../../styles/PendingRequestsInbox.css';

interface Props {
  session: Session;
}

export default function PendingRequestsInbox({ session }: Props) {
  const [items, setItems] = useState<PublicUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = session.access_token;

  const load = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    const data = await getPending(token, p);
    if (data) {
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(1, true); }, [load]);

  const handleAccept = async (userId: string) => {
    setActing(userId);
    const res = await acceptRequest(userId, token);
    if (res) setItems(prev => prev.filter(u => u.id !== userId));
    setActing(null);
  };

  const handleReject = async (userId: string) => {
    setActing(userId);
    const res = await rejectRequest(userId, token);
    if (res) setItems(prev => prev.filter(u => u.id !== userId));
    setActing(null);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  if (loading && items.length === 0) {
    return (
      <div className="pending-inbox">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="pending-item pending-item--skeleton">
            <div className="pending-avatar skeleton" />
            <div className="pending-info">
              <div className="skeleton skeleton-line" style={{ width: '130px' }} />
              <div className="skeleton skeleton-line" style={{ width: '90px', marginTop: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="pending-empty">
        <p>No tienes solicitudes pendientes.</p>
      </div>
    );
  }

  return (
    <div className="pending-inbox">
      {items.map(user => (
        <div key={user.id} className="pending-item">
          <div
            className="pending-avatar"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.username ?? ''} />
              : <span>{(user.username ?? '?')[0].toUpperCase()}</span>
            }
          </div>
          <div
            className="pending-info"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <p className="pending-name">{user.full_name ?? user.username}</p>
            <p className="pending-username">@{user.username}</p>
          </div>
          <div className="pending-actions">
            <button
              className="pending-btn pending-btn--accept"
              onClick={() => handleAccept(user.id)}
              disabled={acting === user.id}
            >
              Aceptar
            </button>
            <button
              className="pending-btn pending-btn--reject"
              onClick={() => handleReject(user.id)}
              disabled={acting === user.id}
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
      {page < totalPages && (
        <button className="pending-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando...' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
