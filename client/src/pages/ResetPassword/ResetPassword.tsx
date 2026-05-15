import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import loginBg from '../../assets/login-img.jpg';
import './ResetPassword.css';

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error: sbError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (sbError) {
      const msg = sbError.message.includes('New password should be different')
        ? 'La nueva contraseña debe ser distinta a la anterior.'
        : sbError.message;
      setError(msg);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="rp-page">

      {/* ── Columna izquierda ── */}
      <div className="rp-left" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="rp-left-overlay">
          <div className="rp-left-content">
            <p className="rp-tagline">Nueva contraseña,<br />mismo estilo.</p>
            <p className="rp-tagline-sub">Elige una clave segura para proteger tu cuenta.</p>
          </div>
        </div>
      </div>

      {/* ── Columna derecha ── */}
      <div className="rp-right">
        <div className="rp-right-inner">
          <h1 className="rp-title">Nueva contraseña</h1>
          <p className="rp-subtitle">Elige una contraseña segura para tu cuenta.</p>

          {success ? (
            <div className="rp-success">
              ✅ ¡Contraseña actualizada correctamente! Redirigiendo…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rp-form">

              <div className="rp-input-group">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="rp-input"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="rp-eye"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPw ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              <div className="rp-input-group">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="rp-input"
                  placeholder="Confirmar contraseña"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="rp-eye"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              {error && <p className="rp-error">{error}</p>}

              <button type="submit" className="rp-btn" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
