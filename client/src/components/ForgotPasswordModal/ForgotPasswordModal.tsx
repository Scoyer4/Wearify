import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import './ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setError(null);
      setSent(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://wearify-pink.vercel.app/reset-password',
    });

    setLoading(false);

    if (sbError) {
      setError(sbError.message);
    } else {
      setSent(true);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fpm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fpm-modal" role="dialog" aria-modal="true">
        <button className="fpm-close" onClick={onClose} aria-label="Cerrar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="fpm-title">Recuperar contraseña</h2>

        {sent ? (
          <div className="fpm-success">
            <p>✅ Email enviado. Revisa tu bandeja de entrada y pulsa el enlace para restablecer tu contraseña.</p>
            <button className="fpm-btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <p className="fpm-desc">
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleSubmit} className="fpm-form">
              <input
                type="email"
                className="fpm-input"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="fpm-error">{error}</p>}
              <button type="submit" className="fpm-btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <button type="button" className="fpm-back" onClick={onClose}>
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
