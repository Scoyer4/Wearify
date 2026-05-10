import { useNavigate } from 'react-router-dom';
import './CheckoutCancel.css';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="cancel-page">
      <div className="cancel-card">
        <div className="cancel-icon-wrap">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <h1 className="cancel-title">Pago cancelado</h1>
        <p className="cancel-subtitle">
          No se ha realizado ningún cargo. Puedes volver al catálogo e intentarlo de nuevo cuando quieras.
        </p>

        <div className="cancel-actions">
          <button className="btn-primary" onClick={() => navigate(-1 as any)}>
            Volver
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Ver catálogo
          </button>
        </div>
      </div>
    </div>
  );
}
