import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { getConversations } from '../../services/chatService';
import { ConversationWithDetails } from '../../types/chat';
import '../../styles/ChatInbox.css';

interface Props {
  session: Session;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === yesterday.toDateString())
    return 'Ayer';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function ChatInbox({ session }: Props) {
  const [items, setItems]         = useState<ConversationWithDetails[]>([]);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();
  const token = session.access_token;

  const load = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    const data = await getConversations(token, p);
    if (data) {
      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(1, true); }, [load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  if (loading && items.length === 0) {
    return (
      <div className="chat-inbox">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="chat-inbox-item chat-inbox-item--skeleton">
            <div className="chat-inbox-avatar skeleton" />
            <div className="chat-inbox-body">
              <div className="skeleton skeleton-line" style={{ width: '120px' }} />
              <div className="skeleton skeleton-line" style={{ width: '80px', marginTop: '6px' }} />
              <div className="skeleton skeleton-line" style={{ width: '160px', marginTop: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="chat-inbox-empty">
        <p>Aún no tienes conversaciones.</p>
        <span>Cuando contactes con un vendedor aparecerá aquí.</span>
      </div>
    );
  }

  return (
    <div className="chat-inbox">
      {items.map(conv => {
        const initial = (conv.otherUser.username ?? '?')[0].toUpperCase();
        return (
          <div
            key={conv.id}
            className={`chat-inbox-item${conv.unreadCount > 0 ? ' chat-inbox-item--unread' : ''}`}
            onClick={() => navigate(`/chats/${conv.id}`)}
          >
            {/* Avatar otro participante */}
            <div className="chat-inbox-avatar">
              {conv.otherUser.avatar_url
                ? <img src={conv.otherUser.avatar_url} alt={conv.otherUser.username ?? ''} />
                : <span>{initial}</span>
              }
              {conv.unreadCount > 0 && (
                <span className="chat-inbox-badge">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </div>

            {/* Contenido central */}
            <div className="chat-inbox-body">
              <p className="chat-inbox-name">
                {conv.otherUser.username ?? 'Usuario'}
              </p>
              <p className="chat-inbox-product">
                {conv.product.image_url && (
                  <img
                    src={conv.product.image_url}
                    alt={conv.product.title}
                    className="chat-inbox-product-thumb"
                  />
                )}
                <span>{conv.product.title}</span>
              </p>
              {conv.lastMessage && (
                <p className="chat-inbox-preview">
                  {truncate(conv.lastMessage.content)}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <div className="chat-inbox-meta">
              {conv.lastMessage && (
                <span className="chat-inbox-time">
                  {formatTimestamp(conv.lastMessage.created_at)}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {page < totalPages && (
        <button className="chat-inbox-more" onClick={loadMore} disabled={loading}>
          {loading ? 'Cargando…' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
