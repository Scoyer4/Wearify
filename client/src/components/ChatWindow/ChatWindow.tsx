import { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import '../../styles/ChatWindow.css';

interface Props {
  conversationId: string;
  session: Session;
}

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatWindow({ conversationId, session }: Props) {
  const navigate = useNavigate();
  const { messages, conversation, sendMessage, loading, error } = useChat(conversationId, session);
  const [draft, setDraft]     = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);
  const myId = session.user.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(text);
    setSending(false);
    textareaRef.current?.focus();
  }, [draft, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (loading) {
    return (
      <div className="chat-window">
        <div className="chat-window-header chat-window-header--skeleton">
          <div className="skeleton" style={{ width: 34, height: 34, borderRadius: '50%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton skeleton-line" style={{ width: 140 }} />
            <div className="skeleton skeleton-line" style={{ width: 90 }} />
          </div>
        </div>
        <div className="chat-window-messages" />
        <div className="chat-window-input-area" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-window chat-window--error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* ── Header ── */}
      <div className="chat-window-header">
        <button
          className="chat-window-back-btn"
          onClick={() => navigate('/chats')}
          aria-label="Volver a mensajes"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {conversation && (
          <>
            <Link to={`/producto/${conversation.product_id}`} className="chat-window-product-link">
              {conversation.product.image_url
                ? <img src={conversation.product.image_url} alt={conversation.product.title} className="chat-window-product-thumb" />
                : <div className="chat-window-product-thumb chat-window-product-thumb--placeholder" />
              }
              <div className="chat-window-product-info">
                <span className="chat-window-product-title">{conversation.product.title}</span>
                <span className="chat-window-product-price">{conversation.product.price} €</span>
              </div>
            </Link>

            <div className="chat-window-header-sep" />

            <div className="chat-window-other-user">
              <div className="chat-window-other-avatar">
                {conversation.otherUser.avatar_url
                  ? <img src={conversation.otherUser.avatar_url} alt={conversation.otherUser.username ?? ''} />
                  : <span>{(conversation.otherUser.username ?? '?')[0].toUpperCase()}</span>
                }
              </div>
              <span className="chat-window-other-name">
                {conversation.otherUser.username ?? 'Usuario'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Mensajes ── */}
      <div className="chat-window-messages">
        {messages.length === 0 && (
          <p className="chat-window-empty">Escribe un mensaje para iniciar la conversación.</p>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === myId;
          return (
            <div
              key={msg.id}
              className={`chat-bubble-row${isMine ? ' chat-bubble-row--mine' : ''}`}
            >
              {!isMine && (
                <div className="chat-bubble-avatar">
                  {msg.sender.avatar_url
                    ? <img src={msg.sender.avatar_url} alt={msg.sender.username ?? ''} />
                    : <span>{(msg.sender.username ?? '?')[0].toUpperCase()}</span>
                  }
                </div>
              )}
              <div className={`chat-bubble${isMine ? ' chat-bubble--mine' : ' chat-bubble--theirs'}`}>
                <p className="chat-bubble-text">{msg.content}</p>
                <span className="chat-bubble-time">{formatBubbleTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-window-input-area">
        <textarea
          ref={textareaRef}
          className="chat-window-textarea"
          placeholder="Escribe un mensaje…"
          value={draft}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={1000}
          disabled={sending}
        />
        <button
          className="chat-window-send-btn"
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          aria-label="Enviar mensaje"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
