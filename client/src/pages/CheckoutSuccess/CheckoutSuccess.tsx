import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StripeSessionInfo } from '../../types/checkout';
import { getStripeSession } from '../../services/checkoutService';
import { toast } from '../../lib/toast';
import './CheckoutSuccess.css';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [info, setInfo]       = useState<StripeSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }

    // Resuelve la sesión directamente desde Supabase para evitar el race condition
    // entre el prop (session=null al montar) y la carga del token en App.tsx.
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      getStripeSession(sessionId, session.access_token)
        .then(data => { setInfo(data); toast.success('¡Compra realizada con éxito!'); })
        .catch(err => setError(err instanceof Error ? err.message : 'Error al confirmar el pago'))
        .finally(() => setLoading(false));
    };

    run();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="success-page">
        <div className="success-card">
          <div className="success-loading">
            <div className="success-spinner" />
            <p>Confirmando tu compra…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="success-page">
        <div className="success-card">
          <p className="success-error">{error ?? 'No se pudo confirmar el pago.'}</p>
          <button className="btn-secondary" style={{ marginTop: '16px', width: '100%' }} onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const { orderId, productTitle, productImage, shippingAddress, shippingType, productPrice, shippingCost, totalAmount } = info;

  return (
    <div className="success-page">
      <div className="success-card">
        {/* ── Icono ── */}
        <div className="success-icon-wrap">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="success-title">¡Pedido confirmado!</h1>
        {orderId && (
          <p className="success-subtitle">
            Pedido <span className="success-order-id">#{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}

        {/* ── Producto ── */}
        <div className="success-product">
          {productImage
            ? <img src={productImage} alt={productTitle} className="success-product-img" />
            : <div className="success-product-img success-product-img--placeholder" />
          }
          <p className="success-product-name">{productTitle}</p>
        </div>

        <div className="success-divider" />

        {/* ── Desglose ── */}
        <div className="success-rows">
          <div className="success-row">
            <span>Producto</span>
            <span>{productPrice.toFixed(2)} €</span>
          </div>
          <div className="success-row">
            <span>Envío ({shippingType === 'express' ? 'express' : 'estándar'})</span>
            <span className={shippingCost === 0 ? 'success-free' : ''}>
              {shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} €`}
            </span>
          </div>
          <div className="success-row success-row--total">
            <span>Total pagado</span>
            <span>{totalAmount.toFixed(2)} €</span>
          </div>
        </div>

        <div className="success-divider" />

        {/* ── Dirección ── */}
        <div className="success-address">
          <p className="success-address-label">Dirección de entrega</p>
          <p className="success-address-line">{shippingAddress.name}</p>
          <p className="success-address-line">{shippingAddress.address}</p>
          <p className="success-address-line">
            {shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}
          </p>
        </div>

        {/* ── Acciones ── */}
        <div className="success-actions">
          <button className="btn-primary" onClick={() => navigate('/pedidos')}>
            Ver mis pedidos
          </button>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  );
}
