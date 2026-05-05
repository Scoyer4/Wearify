import { useState } from 'react';
import { OrderWithDetails } from '../../types/order';
import { shipOrder } from '../../services/orderService';
import './ShipModal.css';

interface Props {
  order:     OrderWithDetails;
  token:     string;
  onClose:   () => void;
  onSuccess: (orderId: string) => void;
}

export default function ShipModal({ order, token, onClose, onSuccess }: Props) {
  const [tracking, setTracking] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!tracking.trim()) {
      setError('El número de seguimiento es obligatorio');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await shipOrder(order.id, tracking.trim(), token);
      onSuccess(order.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al marcar el envío');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sm-modal">

        <div className="sm-header">
          <h2 className="sm-title">Marcar como enviado</h2>
          <button className="sm-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sm-product-row">
          {order.product.image_url
            ? <img src={order.product.image_url} alt={order.product.title} className="sm-product-img" />
            : <div className="sm-product-img sm-product-img--placeholder" />
          }
          <div>
            <p className="sm-product-title">{order.product.title}</p>
            {order.shipping_name && (
              <p className="sm-product-buyer">
                Comprador: {order.buyer.username ?? 'Usuario'}
              </p>
            )}
          </div>
        </div>

        <div className="sm-field">
          <label className="sm-label">Número de seguimiento</label>
          <input
            className={`sm-input${error ? ' sm-input--error' : ''}`}
            type="text"
            placeholder="Ej: ES123456789ES"
            value={tracking}
            onChange={e => { setTracking(e.target.value); setError(null); }}
            autoFocus
          />
          {error && <p className="sm-error">{error}</p>}
          <p className="sm-hint">El comprador recibirá este número para rastrear su paquete.</p>
        </div>

        <div className="sm-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : 'Confirmar envío'}
          </button>
        </div>

      </div>
    </div>
  );
}
