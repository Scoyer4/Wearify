import { useLocation, useNavigate } from 'react-router-dom';
import { CheckoutProduct, ShippingAddress, ShippingType } from '../../types/checkout';
import './CheckoutSuccess.css';

interface SuccessState {
  orderId: string;
  finalPrice: number;
  shippingCost: number;
  shippingType: ShippingType;
  product: CheckoutProduct;
  address: ShippingAddress;
}

export default function CheckoutSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const s = state as SuccessState | null;

  if (!s) {
    navigate('/');
    return null;
  }

  const { orderId, finalPrice, shippingCost, shippingType, product, address } = s;
  const productPrice = finalPrice - shippingCost;

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
        <p className="success-subtitle">Pedido <span className="success-order-id">#{orderId.slice(0, 8).toUpperCase()}</span></p>

        {/* ── Producto ── */}
        <div className="success-product">
          {product.image_url
            ? <img src={product.image_url} alt={product.title} className="success-product-img" />
            : <div className="success-product-img success-product-img--placeholder" />
          }
          <p className="success-product-name">{product.title}</p>
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
            <span>{finalPrice.toFixed(2)} €</span>
          </div>
        </div>

        <div className="success-divider" />

        {/* ── Dirección ── */}
        <div className="success-address">
          <p className="success-address-label">Dirección de entrega</p>
          <p className="success-address-line">{address.name}</p>
          <p className="success-address-line">{address.address}</p>
          <p className="success-address-line">{address.postalCode} {address.city}, {address.country}</p>
        </div>

        {/* ── Acciones ── */}
        <div className="success-actions">
          <button className="btn-primary" onClick={() => navigate('/perfil')}>
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
