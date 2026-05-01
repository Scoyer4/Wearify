import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { getFollowers, getFollowing } from '../../services/followerService';
import { PublicUser } from '../../types';
import FollowButton from '../FollowButton/FollowButton';
import '../../styles/FollowList.css';

interface Props {
  userId: string;
  mode: 'followers' | 'following';
  session: Session | null;
}

export default function FollowList({ userId, mode, session }: Props) {
  const [items, setItems] = useState<PublicUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = session?.access_token ?? '';

  const load = useCallback(async (p: number, reset = false) => {
    if (!token) return;
    setLoading(true);
    const fn = mode === 'followers' ? getFollowers : getFollowing;
    const data = await fn(userId, token, p);
    if (data) {
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [userId, mode, token]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    load(1, true);
  }, [load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  if (loading && items.length === 0) {
    return (
      <div className="follow-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="follow-list-item follow-list-item--skeleton">
            <div className="follow-list-avatar skeleton" />
            <div className="follow-list-info">
              <div className="skeleton skeleton-line" style={{ width: '120px' }} />
              <div className="skeleton skeleton-line" style={{ width: '80px', marginTop: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <p className="follow-list-empty">
        {mode === 'followers' ? 'Aún no tiene seguidores.' : 'Aún no sigue a nadie.'}
      </p>
    );
  }

  return (
    <div className="follow-list">
      {items.map(user => (
        <div key={user.id} className="follow-list-item">
          <div
            className="follow-list-avatar"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.username ?? ''} />
              : <span>{(user.username ?? '?')[0].toUpperCase()}</span>
            }
          </div>
          <div
            className="follow-list-info"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <p className="follow-list-name">{user.full_name ?? user.username}</p>
            <p className="follow-list-username">@{user.username}</p>
          </div>
          <FollowButton userId={user.id} session={session} />
        </div>
      ))}
      {page < totalPages && (
        <button className="follow-list-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando...' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
