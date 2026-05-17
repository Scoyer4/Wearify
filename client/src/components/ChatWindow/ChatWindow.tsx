import { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { toast } from '../../lib/toast';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { MessageWithSender } from '../../types/chat';
import { getReviewStatus, createReview, ReviewStatus } from '../../services/reviewService';
import { getProductsBySeller } from '../../services/api';
import { Producto } from '../../types';
import '../../styles/ChatWindow.css';

interface Props {
  conversationId: string;
  session: Session;
}

function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const SYSTEM_PREFIXES = [
  'Compra completada',
  'Pago completado',
  'Tu pedido está en camino',
  'Pedido cancelado',
  'Venta cancelada',
  'Pedido completado',
];

// ── Tarjeta de oferta ──────────────────────────────────────────────────────────

interface OfferCardProps {
  msg: MessageWithSender;
  isMine: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
  actionLoading: boolean;
  showPayButton?: boolean;
  onPayNow?: () => void;
}

function OfferCard({ msg, isMine, onAccept, onReject, onCounter, actionLoading, showPayButton, onPayNow }: OfferCardProps) {
  const isRecipient = !isMine;
  const canAct      = isRecipient && msg.offer_status === 'pending';

  const statusLabel: Record<string, string> = {
    accepted: 'Oferta aceptada',
    rejected: 'Oferta rechazada',
    countered: 'Contraoferta enviada — sustituida',
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

      {showPayButton && (
        <button className="offer-pay-btn" onClick={onPayNow}>
          Pagar ahora
        </button>
      )}
    </div>
  );
}

// ── Tarjeta de intercambio ─────────────────────────────────────────────────────

interface SwapCardProps {
  msg: MessageWithSender;
  isMine: boolean;
  conversationProductTitle: string;
  conversationProductImage: string | null;
  conversationProductPrice: number | null;
  onAccept: () => void;
  onReject: () => void;
  actionLoading: boolean;
}

function SwapCard({ msg, isMine, conversationProductTitle, conversationProductImage, conversationProductPrice, onAccept, onReject, actionLoading }: SwapCardProps) {
  const isRecipient = !isMine;
  const canAct      = isRecipient && msg.offer_status === 'pending';
  const offeredProducts = msg.swap_products && msg.swap_products.length > 0
    ? msg.swap_products
    : (msg.swap_product ? [msg.swap_product] : []);

  const statusLabel: Record<string, string> = {
    accepted: '✅ Intercambio aceptado',
    rejected: '❌ Intercambio rechazado',
  };

  return (
    <div className={`swap-card swap-card--${msg.offer_status}`}>
      <div className="swap-card-label">
        {msg.offer_status === 'pending'
          ? (isMine ? 'Tu propuesta de intercambio' : 'Propuesta de intercambio recibida')
          : (statusLabel[msg.offer_status ?? ''] ?? '')}
      </div>

      <div className="swap-card-products">
        {/* Lado izquierdo: productos ofrecidos (1-4) */}
        <div className="swap-card-offered">
          <span className="swap-card-product-tag">Ofrecen</span>
          <div className={`swap-card-offered-grid swap-card-offered-grid--${Math.min(offeredProducts.length, 4)}`}>
            {offeredProducts.map(sp => (
              <Link
                key={sp.id}
                to={`/producto/${sp.id}`}
                className="swap-card-product-img swap-card-product-img--link"
                title={`Ver ${sp.title}`}
              >
                {sp.image_url
                  ? <img src={sp.image_url} alt={sp.title} />
                  : <span>📦</span>}
              </Link>
            ))}
          </div>
          {offeredProducts.length === 1 && (
            <div className="swap-card-product-info" style={{ alignItems: 'center' }}>
              <span className="swap-card-product-name">{offeredProducts[0].title}</span>
              <span className="swap-card-product-price">{offeredProducts[0].price} €</span>
            </div>
          )}
          {offeredProducts.length > 1 && (
            <span className="swap-card-offered-count">{offeredProducts.length} prendas</span>
          )}
        </div>

        <div className="swap-card-arrow">⇄</div>

        {/* Lado derecho: producto del chat */}
        <div className="swap-card-product">
          <span className="swap-card-product-tag">A cambio de</span>
          <div className="swap-card-product-img">
            {conversationProductImage
              ? <img src={conversationProductImage} alt={conversationProductTitle} />
              : <span>📦</span>}
          </div>
          <div className="swap-card-product-info">
            <span className="swap-card-product-name">{conversationProductTitle}</span>
            {conversationProductPrice != null && (
              <span className="swap-card-product-price">{conversationProductPrice} €</span>
            )}
          </div>
        </div>
      </div>

      {canAct && (
        <div className="offer-card-actions">
          <button className="offer-action-btn offer-action-btn--accept" onClick={onAccept} disabled={actionLoading}>
            Aceptar
          </button>
          <button className="offer-action-btn offer-action-btn--reject" onClick={onReject} disabled={actionLoading}>
            Rechazar
          </button>
        </div>
      )}

      <div className="swap-card-time">{formatBubbleTime(msg.created_at)}</div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function ChatWindow({ conversationId, session }: Props) {
  const navigate = useNavigate();
  const {
    messages, conversation, sendMessage,
    makeOffer, acceptOffer, rejectOffer, counterOffer,
    makeSwap, acceptSwap, rejectSwap,
    loading, error, isBuyer,
  } = useChat(conversationId, session);

  const [draft, setDraft]               = useState('');
  const [sending, setSending]           = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal de oferta
  const [offerModal, setOfferModal]     = useState<{ open: boolean; mode: 'make' | 'counter'; messageId?: string }>({ open: false, mode: 'make' });
  const [offerInput, setOfferInput]     = useState('');
  const [offerError, setOfferError]     = useState('');
  const [offerMode, setOfferMode]       = useState<'10' | '20' | 'custom'>('custom');

  // Modal de swap
  const [swapModal, setSwapModal]             = useState(false);
  const [myProducts, setMyProducts]           = useState<Producto[]>([]);
  const [myProductsLoading, setMyProductsLoading] = useState(false);
  const [selectedSwapIds, setSelectedSwapIds] = useState<string[]>([]);
  const [swapError, setSwapError]             = useState('');

  // Reseña
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover]   = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError]   = useState('');

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const myId = session.user.id;

  const isSold          = conversation?.product.is_sold ?? false;
  const isReserved      = conversation?.product.is_reserved ?? false;
  const isUnavailable   = isSold || isReserved;
  const hasPendingOffer = messages.some(m => (m.message_type === 'offer' || m.message_type === 'swap') && m.offer_status === 'pending');

  const openSwapModal = async () => {
    setSwapModal(true);
    setSelectedSwapIds([]);
    setSwapError('');
    setMyProductsLoading(true);
    const data = await getProductsBySeller(session.user.id);
    const available = (data ?? []).filter(p => !p.is_sold && !p.is_reserved && p.status !== 'Vendido' && p.id !== conversation?.product_id);
    setMyProducts(available);
    setMyProductsLoading(false);
  };

  const toggleSwapProduct = (id: string) => {
    setSwapError('');
    setSelectedSwapIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) { setSwapError('Puedes seleccionar máximo 4 prendas'); return prev; }
      return [...prev, id];
    });
  };

  const handleSubmitSwap = async () => {
    if (selectedSwapIds.length === 0) { setSwapError('Selecciona al menos una prenda para ofrecer'); return; }
    setActionLoading(true);
    const err = await makeSwap(selectedSwapIds);
    setActionLoading(false);
    if (err) { setSwapError(err); return; }
    setSwapModal(false);
  };

  const handleAcceptSwap = async (messageId: string) => {
    setActionLoading(true);
    await acceptSwap(messageId);
    setActionLoading(false);
  };

  const handleRejectSwap = async (messageId: string) => {
    setActionLoading(true);
    await rejectSwap(messageId);
    setActionLoading(false);
  };

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Limpiar estado al cambiar de conversación para evitar que se muestre estado antiguo
  useEffect(() => {
    setReviewStatus(null);
  }, [conversationId]);

  // Cargar estado de reseña; re-verificar cuando lleguen nuevos mensajes por si el pedido acaba de completarse
  useEffect(() => {
    if (!isBuyer || !session?.access_token) return;
    getReviewStatus(conversationId, session.access_token)
      .then(setReviewStatus)
      .catch(() => {});
  }, [messages, isBuyer, conversationId, session?.access_token]);

  const handleSubmitReview = async () => {
    if (!reviewStatus?.orderId || reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await createReview(reviewStatus.orderId, reviewRating, reviewComment, session.access_token);
      setReviewStatus(prev => prev ? { ...prev, canReview: false, hasReviewed: true, existing: { id: '', rating: reviewRating, comment: reviewComment } } : prev);
      toast.success('✓ Reseña publicada');
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'No se pudo enviar la reseña');
    } finally {
      setReviewSubmitting(false);
    }
  };

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

  const closeOfferModal = () => { setOfferModal({ open: false, mode: 'make' }); setOfferMode('custom'); };

  const selectPreset = (mode: '10' | '20' | 'custom') => {
    setOfferMode(mode);
    if (mode !== 'custom' && conversation) {
      setOfferInput((conversation.product.price * (1 - Number(mode) / 100)).toFixed(2));
    }
    setOfferError('');
  };

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

    const doSend = async () => {
      const err = offerModal.mode === 'make'
        ? await makeOffer(price)
        : await counterOffer(offerModal.messageId!, price);
      if (err) throw new Error(err);
    };

    setActionLoading(true);
    const p = doSend();
    toast.promise(p, {
      loading: 'Enviando oferta…',
      success: 'Oferta enviada al vendedor',
      error:   (err) => err instanceof Error ? err.message : 'Error al enviar la oferta',
    });

    try {
      await p;
      closeOfferModal();
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : 'Error al enviar la oferta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (messageId: string) => {
    setActionLoading(true);
    const result = await acceptOffer(messageId);
    setActionLoading(false);
    if (typeof result === 'string') {
      toast.error('No se pudo aceptar la oferta');
    } else {
      toast.success('¡Oferta aceptada!');
    }
  };

  const handleReject = async (messageId: string) => {
    setActionLoading(true);
    await rejectOffer(messageId);
    setActionLoading(false);
    toast.error('Oferta rechazada');
  };

  // ── Render burbuja ─────────────────────────────────────────────────────────

  function renderMessage(msg: MessageWithSender) {
    const isMine   = msg.sender_id === myId;
    const isSystem = msg.message_type === 'system'
      || SYSTEM_PREFIXES.some(p => msg.content.startsWith(p));

    if (isSystem) {
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
          <div className={`chat-system-content${isMine ? ' chat-system-content--mine' : ''}`}>
            <div className={`chat-bubble${isMine ? ' chat-bubble--mine' : ' chat-bubble--theirs'}`}>
              <p className="chat-bubble-text">{msg.content}</p>
              <span className="chat-bubble-time">{formatBubbleTime(msg.created_at)}</span>
            </div>
            <span className="chat-system-label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Mensaje automático de Wearify
            </span>
          </div>
        </div>
      );
    }

    if (msg.message_type === 'offer') {
      const showPayButton = msg.offer_status === 'accepted' && isBuyer && !isSold;
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
            showPayButton={showPayButton}
            onPayNow={() => navigate(`/checkout/${conversation!.product_id}?offerPrice=${msg.offer_price}`)}
          />
        </div>
      );
    }

    if (msg.message_type === 'swap') {
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
          <SwapCard
            msg={msg}
            isMine={isMine}
            conversationProductTitle={conversation?.product.title ?? ''}
            conversationProductImage={conversation?.product.image_url ?? null}
            conversationProductPrice={conversation?.product.price ?? null}
            onAccept={() => handleAcceptSwap(msg.id)}
            onReject={() => handleRejectSwap(msg.id)}
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
                <span className={`chat-window-product-price${isUnavailable ? ' chat-window-product-price--sold' : ''}`}>
                  {isSold ? 'Vendido' : isReserved ? 'Reservado' : `${conversation.product.price} €`}
                </span>
              </div>
            </Link>

            <div className="chat-window-header-sep" />

            <Link to={`/usuario/${conversation.otherUser.id}`} className="chat-window-other-user">
              <div className="chat-window-other-avatar">
                {conversation.otherUser.avatar_url
                  ? <img src={conversation.otherUser.avatar_url} alt={conversation.otherUser.username ?? ''} />
                  : <span>{(conversation.otherUser.username ?? '?')[0].toUpperCase()}</span>
                }
              </div>
              <span className="chat-window-other-name">{conversation.otherUser.username ?? 'Usuario'}</span>
            </Link>
          </>
        )}
      </div>

      {/* ── Banner estado producto ── */}
      {isReserved && !isSold && (
        <div className="chat-sold-banner chat-sold-banner--reserved">
          Este producto está reservado pendiente de envío
        </div>
      )}
      {isSold && (
        <div className="chat-sold-banner">
          Este producto ya ha sido vendido
        </div>
      )}

      {/* ── Mensajes ── */}
      <div className="chat-window-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <p className="chat-window-empty">Escribe un mensaje para iniciar la conversación.</p>
        )}
        {messages.map(renderMessage)}
        <div ref={bottomRef} />
      </div>

      {/* ── Panel de reseña (comprador, pedido completado) ── */}
      {isBuyer && reviewStatus && (reviewStatus.canReview || reviewStatus.hasReviewed) && (
        <div className="chat-review-panel">
          {reviewStatus.hasReviewed ? (
            <div className="chat-review-done">
              <span className="chat-review-done-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < (reviewStatus.existing?.rating ?? 0) ? 'star star--filled' : 'star'}>★</span>
                ))}
              </span>
              <span className="chat-review-done-text">Ya dejaste tu reseña al vendedor</span>
            </div>
          ) : reviewStatus.canReview ? (
            <div className="chat-review-form">
              <p className="chat-review-title">¿Cómo fue tu experiencia?</p>
              <div className="chat-review-stars">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`star-btn${value <= (reviewHover || reviewRating) ? ' star-btn--active' : ''}`}
                      onMouseEnter={() => setReviewHover(value)}
                      onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setReviewRating(value)}
                      aria-label={`${value} estrella${value > 1 ? 's' : ''}`}
                    >★</button>
                  );
                })}
              </div>
              <textarea
                className="chat-review-textarea"
                placeholder="Escribe un comentario (opcional)…"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={2}
                maxLength={500}
              />
              {reviewError && <p className="chat-review-error">{reviewError}</p>}
              <button
                className="chat-review-submit"
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || reviewSubmitting}
              >
                {reviewSubmitting ? 'Enviando…' : 'Enviar reseña'}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Input ── */}
      <div className={`chat-window-input-area${isUnavailable ? ' chat-window-input-area--disabled' : ''}`}>
        {isBuyer && !isUnavailable && (
          <>
            <button
              className="offer-trigger-btn"
              onClick={() => openOfferModal('make')}
              disabled={hasPendingOffer}
              title={hasPendingOffer ? 'Ya hay una oferta pendiente' : 'Hacer una oferta al vendedor'}
              aria-label="Hacer oferta"
            >
              💰
            </button>
            <button
              className="offer-trigger-btn"
              onClick={openSwapModal}
              disabled={hasPendingOffer}
              title={hasPendingOffer ? 'Ya hay una oferta pendiente' : 'Proponer intercambio'}
              aria-label="Proponer intercambio"
            >
              🔄
            </button>
          </>
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

      {/* ── Modal de intercambio ── */}
      {swapModal && (
        <div className="offer-modal-backdrop" onClick={() => setSwapModal(false)}>
          <div className="offer-modal-card swap-select-modal" onClick={e => e.stopPropagation()}>
            <div className="offer-modal-header">
              <h3 className="offer-modal-title">Proponer intercambio</h3>
              <button className="offer-modal-close-btn" onClick={() => setSwapModal(false)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {conversation && (
              <>
                <div className="offer-modal-product">
                  {conversation.product.image_url && (
                    <img src={conversation.product.image_url} alt={conversation.product.title} className="offer-modal-product-img" />
                  )}
                  <div>
                    <p className="offer-modal-product-title">A cambio de: <strong>{conversation.product.title}</strong></p>
                    <p className="offer-modal-product-price">Precio: <strong>{conversation.product.price} €</strong></p>
                  </div>
                </div>
                <div className="offer-modal-divider" />
              </>
            )}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Selecciona hasta 4 prendas para ofrecer
              {selectedSwapIds.length > 0 && (
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {' '}— {selectedSwapIds.length}/4 seleccionada{selectedSwapIds.length > 1 ? 's' : ''}
                </span>
              )}:
            </p>

            {myProductsLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando tus prendas…</div>
            ) : myProducts.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tienes prendas disponibles para intercambiar.
              </div>
            ) : (
              <div className="swap-product-list">
                {myProducts.map(p => {
                  const selected = selectedSwapIds.includes(p.id);
                  const disabled = !selected && selectedSwapIds.length >= 4;
                  return (
                    <button
                      key={p.id}
                      className={`swap-product-item${selected ? ' swap-product-item--selected' : ''}${disabled ? ' swap-product-item--disabled' : ''}`}
                      onClick={() => toggleSwapProduct(p.id)}
                    >
                      <div className="swap-product-item-img">
                        {p.image_url ? <img src={p.image_url} alt={p.title} /> : <span>📦</span>}
                      </div>
                      <div className="swap-product-item-info">
                        <span className="swap-product-item-name">{p.title}</span>
                        <span className="swap-product-item-price">{p.price} €</span>
                      </div>
                      {selected && <span className="swap-product-item-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {swapError && <p className="offer-modal-error">⚠ {swapError}</p>}
            <button
              className="btn-primary full-width-btn offer-submit-btn"
              onClick={handleSubmitSwap}
              disabled={selectedSwapIds.length === 0 || actionLoading || myProductsLoading}
            >
              {actionLoading ? 'Enviando…' : 'Proponer intercambio'}
            </button>
            <p className="offer-modal-hint">El vendedor recibirá tu propuesta y podrá aceptarla o rechazarla.</p>
          </div>
        </div>
      )}

      {/* ── Modal de oferta ── */}
      {offerModal.open && (
        <div className="offer-modal-backdrop" onClick={closeOfferModal}>
          <div className="offer-modal-card" onClick={e => e.stopPropagation()}>
            <div className="offer-modal-header">
              <h3 className="offer-modal-title">
                {offerModal.mode === 'make' ? 'Hacer una oferta' : '🔄 Contraoferta'}
              </h3>
              <button className="offer-modal-close-btn" onClick={closeOfferModal} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {conversation && (
              <>
                <div className="offer-modal-product">
                  {conversation.product.image_url && (
                    <img src={conversation.product.image_url} alt={conversation.product.title} className="offer-modal-product-img" />
                  )}
                  <div>
                    <p className="offer-modal-product-title">{conversation.product.title}</p>
                    <p className="offer-modal-product-price">
                      Precio actual: <strong>{conversation.product.price.toFixed(2)} €</strong>
                    </p>
                  </div>
                </div>
                <div className="offer-modal-divider" />
                <div className="offer-presets">
                  {(['10', '20'] as const).map(pct => {
                    const discounted = conversation.product.price * (1 - Number(pct) / 100);
                    const active = offerMode === pct;
                    return (
                      <button key={pct} className={`offer-preset-btn${active ? ' offer-preset-btn--active' : ''}`} onClick={() => selectPreset(pct)}>
                        <span className="offer-preset-price">{discounted.toFixed(2)} €</span>
                        <span className="offer-preset-label">{pct}% descuento</span>
                      </button>
                    );
                  })}
                  <button
                    className={`offer-preset-btn${offerMode === 'custom' ? ' offer-preset-btn--active' : ''}`}
                    onClick={() => selectPreset('custom')}
                  >
                    <span className="offer-preset-price offer-preset-price--custom">Personalizar</span>
                    <span className="offer-preset-label">Ponle un precio</span>
                  </button>
                </div>
              </>
            )}
            <div className="offer-input-wrap">
              <input
                type="number"
                className={`offer-input${offerError ? ' offer-input--error' : offerInput ? ' offer-input--filled' : ''}`}
                placeholder="0.00"
                value={offerInput}
                onChange={e => { setOfferInput(e.target.value); setOfferMode('custom'); setOfferError(''); }}
                min={0.01}
                step={0.01}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitOffer(); }}
              />
              <span className="offer-input-suffix">€</span>
            </div>
            {offerError && <p className="offer-modal-error">⚠ {offerError}</p>}
            <button
              className="btn-primary full-width-btn offer-submit-btn"
              onClick={handleSubmitOffer}
              disabled={!offerInput || actionLoading}
            >
              {actionLoading ? 'Enviando…' : offerModal.mode === 'make' ? 'Ofrecer' : 'Enviar contraoferta'}
            </button>
            <p className="offer-modal-hint">El vendedor recibirá tu oferta y podrá aceptarla, rechazarla o contraofertar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
