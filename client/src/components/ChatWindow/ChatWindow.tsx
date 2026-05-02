import { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { MessageWithSender } from '../../types/chat';
import '../../styles/ChatWindow.css';

interface Props {
  conversationId: string;
  session: Session;
}

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ── Tarjeta de oferta ──────────────────────────────────────────────────────────

interface OfferCardProps {
  msg: MessageWithSender;
  isMine: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
  actionLoading: boolean;
}

function OfferCard({ msg, isMine, onAccept, onReject, onCounter, actionLoading }: OfferCardProps) {
  const isRecipient = !isMine;
  const canAct      = isRecipient && msg.offer_status === 'pending';

  const statusLabel: Record<string, string> = {
    accepted: '✅ Oferta aceptada',
    rejected: '❌ Oferta rechazada',
    countered: '🔄 Contraoferta enviada — sustituida',
  };

  return (
    <div className={`offer-card offer-card--${msg.offer_status}`}>
      <div className="offer-card-label">
        {msg.offer_status === 'pending' ? (isMine ? 'Tu oferta' : 'Oferta recibida') : statusLabel[msg.offer_status ?? ''] ?? ''}
      </div>
      <div className="offer-card-price">{msg.offer_price?.toFixed(2)} €</div>
      <div className="offer-card-time">{formatBubbleTime(msg.created_at)}</div>

      {canAct && (
        <div className="offer-card-actions">
          <button className="offer-action-btn offer-action-btn--accept" onClick={onAccept} disabled={actionLoading}>
            Aceptar
          </button>
          <button className="offer-action-btn offer-action-btn--counter" onClick={onCounter} disabled={actionLoading}>
            Contraoferta
          </button>
          <button className="offer-action-btn offer-action-btn--reject" onClick={onReject} disabled={actionLoading}>
            Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function ChatWindow({ conversationId, session }: Props) {
  const navigate = useNavigate();
  const {
    messages, conversation, sendMessage,
    makeOffer, acceptOffer, rejectOffer, counterOffer,
    loading, error, isBuyer,
  } = useChat(conversationId, session);

  const [draft, setDraft]               = useState('');
  const [sending, setSending]           = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de oferta
  const [offerModal, setOfferModal]     = useState<{ open: boolean; mode: 'make' | 'counter'; messageId?: string }>({ open: false, mode: 'make' });
  const [offerInput, setOfferInput]     = useState('');
  const [offerError, setOfferError]     = useState('');

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const myId = session.user.id;

  const isSold         = conversation?.product.is_sold ?? false;
  const hasPendingOffer = messages.some(m => m.message_type === 'offer' && m.offer_status === 'pending');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text);
    setSending(false);
    textareaRef.current?.focus();
  }, [draft, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ── Acciones de oferta ─────────────────────────────────────────────────────

  const openOfferModal = (mode: 'make' | 'counter', messageId?: string) => {
    setOfferInput('');
    setOfferError('');
    setOfferModal({ open: true, mode, messageId });
  };

  const closeOfferModal = () => setOfferModal({ open: false, mode: 'make' });

  const handleSubmitOffer = async () => {
    const price = parseFloat(offerInput.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      setOfferError('Introduce un precio válido mayor que 0');
      return;
    }
    if (conversation && price >= conversation.product.price) {
      setOfferError(`La oferta debe ser menor que el precio original (${conversation.product.price} €)`);
      return;
    }

    setActionLoading(true);
    const err = offerModal.mode === 'make'
      ? await makeOffer(price)
      : await counterOffer(offerModal.messageId!, price);
    setActionLoading(false);

    if (err) { setOfferError(err); return; }
    closeOfferModal();
  };

  const handleAccept = async (messageId: string) => {
    setActionLoading(true);
    const result = await acceptOffer(messageId);
    setActionLoading(false);
    if (typeof result === 'string') console.error('Error al aceptar:', result);
  };

  const handleReject = async (messageId: string) => {
    setActionLoading(true);
    await rejectOffer(messageId);
    setActionLoading(false);
  };

  // ── Render burbuja ─────────────────────────────────────────────────────────

  function renderMessage(msg: MessageWithSender) {
    const isMine = msg.sender_id === myId;

    if (msg.message_type === 'offer') {
      return (
        <div key={msg.id} className={`chat-bubble-row${isMine ? ' chat-bubble-row--mine' : ''}`}>
          {!isMine && (
            <div className="chat-bubble-avatar">
              {msg.sender.avatar_url
                ? <img src={msg.sender.avatar_url} alt={msg.sender.username ?? ''} />
                : <span>{(msg.sender.username ?? '?')[0].toUpperCase()}</span>
              }
            </div>
          )}
          <OfferCard
            msg={msg}
            isMine={isMine}
            onAccept={() => handleAccept(msg.id)}
            onReject={() => handleReject(msg.id)}
            onCounter={() => openOfferModal('counter', msg.id)}
            actionLoading={actionLoading}
          />
        </div>
      );
    }

    return (
      <div key={msg.id} className={`chat-bubble-row${isMine ? ' chat-bubble-row--mine' : ''}`}>
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
  }

  // ── Estados de carga / error ────────────────────────────────────────────────

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

  // ── Render principal ───────────────────────────────────────────────────────

  return (
    <div className="chat-window">
      {/* ── Header ── */}
      <div className="chat-window-header">
        <button className="chat-window-back-btn" onClick={() => navigate('/chats')} aria-label="Volver a mensajes">
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
                <span className={`chat-window-product-price${isSold ? ' chat-window-product-price--sold' : ''}`}>
                  {isSold ? 'Vendido' : `${conversation.product.price} €`}
                </span>
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
              <span className="chat-window-other-name">{conversation.otherUser.username ?? 'Usuario'}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Banner vendido ── */}
      {isSold && (
        <div className="chat-sold-banner">
          🏷️ Este producto ya ha sido vendido
        </div>
      )}

      {/* ── Mensajes ── */}
      <div className="chat-window-messages">
        {messages.length === 0 && (
          <p className="chat-window-empty">Escribe un mensaje para iniciar la conversación.</p>
        )}
        {messages.map(renderMessage)}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className={`chat-window-input-area${isSold ? ' chat-window-input-area--disabled' : ''}`}>
        {isBuyer && !isSold && (
          <button
            className="offer-trigger-btn"
            onClick={() => openOfferModal('make')}
            disabled={hasPendingOffer}
            title={hasPendingOffer ? 'Ya tienes una oferta pendiente' : 'Hacer una oferta al vendedor'}
            aria-label="Hacer oferta"
          >
            💰
          </button>
        )}

        <textarea
          ref={textareaRef}
          className="chat-window-textarea"
          placeholder={isSold ? 'Este producto ya no está disponible' : 'Escribe un mensaje…'}
          value={draft}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={1000}
          disabled={sending || isSold}
        />
        <button
          className="chat-window-send-btn"
          onClick={handleSend}
          disabled={!draft.trim() || sending || isSold}
          aria-label="Enviar mensaje"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* ── Modal de oferta ── */}
      {offerModal.open && (
        <div className="offer-modal-overlay" onClick={closeOfferModal}>
          <div className="offer-modal" onClick={e => e.stopPropagation()}>
            <div className="offer-modal-header">
              <span>{offerModal.mode === 'make' ? '💰 Hacer una oferta' : '🔄 Contraoferta'}</span>
              <button className="offer-modal-close" onClick={closeOfferModal} aria-label="Cerrar">✕</button>
            </div>

            {conversation && (
              <p className="offer-modal-ref">
                Precio original: <strong>{conversation.product.price} €</strong>
              </p>
            )}

            <div className="offer-modal-input-row">
              <input
                type="number"
                className="offer-modal-input"
                placeholder="Tu precio (€)"
                value={offerInput}
                onChange={e => { setOfferInput(e.target.value); setOfferError(''); }}
                min={0.01}
                step={0.01}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitOffer(); }}
              />
              <span className="offer-modal-currency">€</span>
            </div>

            {offerError && <p className="offer-modal-error">{offerError}</p>}

            <div className="offer-modal-footer">
              <button className="offer-modal-cancel" onClick={closeOfferModal}>Cancelar</button>
              <button
                className="offer-modal-submit"
                onClick={handleSubmitOffer}
                disabled={!offerInput || actionLoading}
              >
                {actionLoading ? 'Enviando…' : 'Enviar oferta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
