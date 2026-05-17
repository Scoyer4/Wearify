import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderWithDetails, OrderStatus } from '../../types/order';
import './OrderCard.css';

type CountdownUrgency = 'normal' | 'warning' | 'danger' | 'expired';

function useShippingCountdown(createdAt: string, active: boolean, deadlineDays: number) {
  const [text,    setText]    = useState('');
  const [urgency, setUrgency] = useState<CountdownUrgency>('normal');

  useEffect(() => {
    if (!active) return;

    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + deadlineDays);

    function tick() {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setText('¡Plazo vencido!');
        setUrgency('expired');
        return;
      }
      const totalH = diff / 3_600_000;
      const d      = Math.floor(diff / 86_400_000);
      const h      = Math.floor((diff % 86_400_000) / 3_600_000);
      const m      = Math.floor((diff % 3_600_000)  / 60_000);

      setUrgency(totalH < 24 ? 'danger' : totalH < 48 ? 'warning' : 'normal');
      setText(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    }

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [active, createdAt]);

  return { text, urgency };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  paid:      'Pagado',
  shipped:   'Enviado',
  received:  'Recibido',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'paid',      label: 'Pagado'     },
  { status: 'shipped',   label: 'Enviado'    },
  { status: 'received',  label: 'Recibido'   },
  { status: 'completed', label: 'Completado' },
];

const STATUS_ORDER: OrderStatus[] = ['paid', 'shipped', 'received', 'completed'];

interface Props {
  order:              OrderWithDetails;
  role:               'buyer' | 'seller';
  onShipClick:        (order: OrderWithDetails) => void;
  onReceiveClick:     (orderId: string) => void;
  onCompleteClick:    (orderId: string) => void;
  onExpiredCancel?:   (orderId: string) => void;
  onSellerCancel?:    (orderId: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrderCard({ order, role, onShipClick, onReceiveClick, onCompleteClick, onExpiredCancel, onSellerCancel }: Props) {
  const navigate           = useNavigate();
  const currentIdx         = STATUS_ORDER.indexOf(order.order_status);
  const deadlineDays       = order.shipping_type === 'express' ? 2 : 5;
  const countdown          = useShippingCountdown(order.created_at, role === 'seller' && order.order_status === 'paid', deadlineDays);
  const cancelFiredRef     = useRef(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (countdown.urgency === 'expired' && !cancelFiredRef.current && onExpiredCancel) {
      cancelFiredRef.current = true;
      onExpiredCancel(order.id);
    }
  }, [countdown.urgency]);
  const otherUser   = role === 'buyer' ? order.seller : order.buyer;
  const finalPrice  = order.final_price ?? order.price_at_purchase ?? 0;

  const timelineItems: ReactNode[] = [];
  TIMELINE_STEPS.forEach((step, i) => {
    const stepIdx   = STATUS_ORDER.indexOf(step.status);
    const isDone    = stepIdx < currentIdx;
    const isCurrent = stepIdx === currentIdx;
    const modifier  = isDone ? 'done' : isCurrent ? 'current' : 'pending';

    if (i > 0) {
      const connectorDone = stepIdx <= currentIdx;
      timelineItems.push(
        <div
          key={`c-${i}`}
          className={`oc-connector oc-connector--${connectorDone ? 'done' : 'pending'}`}
        />,
      );
    }
    timelineItems.push(
      <div key={step.status} className={`oc-step oc-step--${modifier}`}>
        <div className="oc-dot" />
        <span className="oc-step-label">{step.label}</span>
      </div>,
    );
  });

  return (
    <div className="oc-card">

      {/* Header */}
      <div className="oc-header">
        <div className="oc-product">
          {order.product.image_url
            ? <img src={order.product.image_url} alt={order.product.title} className="oc-product-img" />
            : <div className="oc-product-img oc-product-img--placeholder" />
          }
          <div className="oc-product-info">
            <p className="oc-product-title">{order.product.title}</p>
            <p className="oc-product-price">{finalPrice.toFixed(2)} €</p>
            {order.shipping_type && (
              <p className="oc-product-shipping">
                {order.shipping_type === 'express' ? 'Envío express' : 'Envío estándar'}
                {order.shipping_cost > 0 ? ` · ${order.shipping_cost.toFixed(2)} €` : ' · Gratis'}
              </p>
            )}
          </div>
        </div>
        <div className="oc-meta">
          <span className={`oc-status-badge oc-status-badge--${order.order_status}`}>
            {STATUS_LABELS[order.order_status] ?? order.order_status}
          </span>
          <span className="oc-date">{formatDate(order.created_at)}</span>
          {otherUser.username && (
            <span className="oc-other-user">
              {role === 'buyer' ? 'Vendedor' : 'Comprador'}: {otherUser.username}
            </span>
          )}
        </div>
      </div>

      {/* Countdown (seller, estado paid) */}
      {role === 'seller' && order.order_status === 'paid' && countdown.text && (
        <div className={`oc-countdown oc-countdown--${countdown.urgency}`}>
          <span className="oc-countdown-icon">⏱</span>
          <div className="oc-countdown-body">
            <span className="oc-countdown-label">Tiempo para enviar</span>
            <span className="oc-countdown-value">{countdown.text}</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="oc-timeline">
        {timelineItems}
      </div>

      {/* Tracking number */}
      {order.tracking_number && (
        <div className="oc-tracking">
          <span className="oc-tracking-label">Nº seguimiento:</span>
          <span className="oc-tracking-value">{order.tracking_number}</span>
        </div>
      )}

      {/* Shipping address (buyer view) */}
      {role === 'buyer' && order.shipping_name && (
        <div className="oc-address">
          <span className="oc-tracking-label">Dirección de entrega:</span>
          <span className="oc-tracking-value">
            {order.shipping_name} · {order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="oc-actions">
        {role === 'seller' && order.order_status === 'paid' && (
          <>
            <button className="btn-primary oc-action-btn" onClick={() => onShipClick(order)}>
              Marcar como enviado
            </button>
            {onSellerCancel && (
              <button className="btn-danger oc-action-btn" onClick={() => setConfirmCancel(true)}>
                Cancelar venta
              </button>
            )}
          </>
        )}
        {role === 'buyer' && order.order_status === 'shipped' && (
          <button className="btn-primary oc-action-btn" onClick={() => onReceiveClick(order.id)}>
            Confirmar recepción
          </button>
        )}
        {role === 'buyer' && order.order_status === 'received' && (
          <button className="btn-primary oc-action-btn" onClick={() => onCompleteClick(order.id)}>
            Completar pedido
          </button>
        )}
        {order.conversation_id && (
          <button
            className="btn-secondary oc-action-btn"
            onClick={() => navigate(`/chats/${order.conversation_id}`)}
          >
            Ver chat
          </button>
        )}
      </div>

      {/* Seller cancel confirmation modal */}
      {confirmCancel && (
        <div className="oc-cancel-overlay" onClick={() => setConfirmCancel(false)}>
          <div className="oc-cancel-modal" onClick={e => e.stopPropagation()}>
            <div className="oc-cancel-danger-strip">
              <span className="oc-cancel-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
              <h3 className="oc-cancel-title">¿Cancelar la venta?</h3>
            </div>
            <div className="oc-cancel-content">
              <p className="oc-cancel-body">
                Estás a punto de cancelar la venta de <strong>{order.product.title}</strong>.
                Esta acción no se puede deshacer.
              </p>
              <div className="oc-cancel-refund-note">
                <span className="oc-cancel-refund-note-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </span>
                <span>El importe abonado por el comprador será reembolsado íntegramente y el producto volverá a estar disponible.</span>
              </div>
              <div className="oc-cancel-actions">
                <button className="btn-secondary" onClick={() => setConfirmCancel(false)}>
                  Volver
                </button>
                <button
                  className="btn-danger"
                  onClick={() => { setConfirmCancel(false); onSellerCancel!(order.id); }}
                >
                  Sí, cancelar venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
