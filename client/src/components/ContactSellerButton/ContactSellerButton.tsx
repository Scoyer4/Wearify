import { useState, useRef, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { startConversation } from '../../services/chatService';
import '../../styles/ContactSellerButton.css';

interface Props {
  productId: string;
  sellerId: string;
  productTitle: string;
  productImage: string | null;
  session: Session | null;
}

export default function ContactSellerButton({
  productId,
  sellerId,
  productTitle,
  productImage,
  session,
}: Props) {
  const [open, setOpen]       = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const navigate              = useNavigate();
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  // No renderizar si el producto es del propio usuario
  if (session && session.user.id === sellerId) return null;

  const handleOpen = () => {
    if (!session) { navigate('/login'); return; }
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage('');
    setError(null);
  };

  // Focus textarea al abrir
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !session) return;
    if (text.length > 1000) { setError('El mensaje no puede superar 1000 caracteres.'); return; }

    setSending(true);
    setError(null);
    const result = await startConversation(productId, text, session.access_token);
    setSending(false);

    if (!result) {
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.');
      return;
    }

    navigate(`/chats/${result.conversationId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <button className="contact-seller-btn" onClick={handleOpen}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Contactar vendedor
      </button>

      {open && (
        <div className="contact-seller-overlay" onClick={handleClose}>
          <div className="contact-seller-panel" onClick={e => e.stopPropagation()}>

            {/* Cabecera con contexto del producto */}
            <div className="contact-seller-product">
              {productImage
                ? <img src={productImage} alt={productTitle} className="contact-seller-product-img" />
                : <div className="contact-seller-product-img contact-seller-product-img--placeholder" />
              }
              <div className="contact-seller-product-info">
                <p className="contact-seller-product-label">Preguntando sobre</p>
                <p className="contact-seller-product-title">{productTitle}</p>
              </div>
              <button className="contact-seller-close" onClick={handleClose} aria-label="Cerrar">✕</button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="contact-seller-textarea"
              placeholder="Escribe tu mensaje al vendedor… (Enter para enviar)"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              maxLength={1000}
              disabled={sending}
            />

            {error && <p className="contact-seller-error">{error}</p>}

            <div className="contact-seller-footer">
              <span className="contact-seller-char-count">{message.length}/1000</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="contact-seller-cancel" onClick={handleClose} disabled={sending}>
                  Cancelar
                </button>
                <button
                  className="contact-seller-send"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                >
                  {sending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
