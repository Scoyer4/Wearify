import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderWithDetails, OrderStatus } from '../../types/order';
import './OrderCard.css';

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
  order:            OrderWithDetails;
  role:             'buyer' | 'seller';
  onShipClick:      (order: OrderWithDetails) => void;
  onReceiveClick:   (orderId: string) => void;
  onCompleteClick:  (orderId: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrderCard({ order, role, onShipClick, onReceiveClick, onCompleteClick }: Props) {
  const navigate    = useNavigate();
  const currentIdx  = STATUS_ORDER.indexOf(order.order_status);
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
          <button className="btn-primary oc-action-btn" onClick={() => onShipClick(order)}>
            Marcar como enviado
          </button>
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

    </div>
  );
}
