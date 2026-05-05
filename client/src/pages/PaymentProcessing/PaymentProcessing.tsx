import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { confirmOrder } from '../../services/checkoutService';
import { OrderConfirmation } from '../../types/checkout';
import './PaymentProcessing.css';

interface PaymentState {
  productId: string;
  shippingAddress: { name: string; address: string; city: string; postalCode: string; country: string };
  shippingType: 'standard' | 'express';
  saveAddress: boolean;
  product: { id: string; title: string; price: number; image_url: string | null };
  finalPrice: number;
  shippingCost: number;
}

function generateTransactionId(): string {
  return 'WRF-' + new Date().getFullYear() + '-' + String(Math.floor(10000 + Math.random() * 90000));
}

type Step = 0 | 1 | 2;

interface StepConfig {
  icon: string;
  text: string;
}

const STEPS: StepConfig[] = [
  { icon: '🔒', text: 'Verificando datos de pago...' },
  { icon: '🏦', text: 'Conectando con el banco...' },
  { icon: '✅', text: 'Confirmando transacción...' },
];

export default function PaymentProcessing() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentState | null;

  const [step, setStep]           = useState<Step>(0);
  const [animDone, setAnimDone]   = useState(false);
  const [apiResult, setApiResult] = useState<OrderConfirmation | null>(null);
  const [apiError, setApiError]   = useState<string | null>(null);
  const [transactionId]           = useState<string>(() => generateTransactionId());
  const hasFired                  = useRef(false);

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
    if (hasFired.current) return;
    hasFired.current = true;

    // ── Animación de pasos ─────────────────────────────────────────────────────
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(() => setAnimDone(true), 3000);

    // ── Llamada real a la API en paralelo ──────────────────────────────────────
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('No hay sesión activa');

        const result = await confirmOrder(
          {
            productId:       state.productId,
            shippingAddress: state.shippingAddress,
            shippingType:    state.shippingType,
            saveAddress:     state.saveAddress,
          },
          token,
        );
        setApiResult(result);
      } catch (e) {
        setApiError(e instanceof Error ? e.message : 'Error al procesar el pago');
      }
    })();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) return null;

  const { product, finalPrice } = state;

  // ── Cálculo de progreso ────────────────────────────────────────────────────
  const progress: number = animDone
    ? 100
    : step === 0 ? 10
    : step === 1 ? 45
    : 80;

  const showProcessing = !(animDone && (apiResult || apiError));

  // ── Vista A: Procesando ────────────────────────────────────────────────────
  if (showProcessing) {
    return (
      <div className="pp-page">
        <div className="pp-card">
          <h1 className="pp-title">Procesando tu pago</h1>

          <div className="pp-progress-track">
            <div
              className="pp-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="pp-steps">
            {STEPS.map((s, i) => {
              const isDone   = i < step;
              const isActive = i === step;
              const modifier = isDone ? 'done' : isActive ? 'active' : 'pending';
              return (
                <div key={i} className={`pp-step-item pp-step-item--${modifier}`}>
                  <span className="pp-step-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              );
            })}
          </div>

          <p className="pp-security-note">🔒 Conexión segura y cifrada</p>
        </div>
      </div>
    );
  }

  // ── Vista B: Éxito ─────────────────────────────────────────────────────────
  if (animDone && apiResult) {
    return (
      <div className="pp-page">
        <div className="pp-card">
          <div className="pp-success-icon">✓</div>

          <h1 className="pp-success-title">¡Pago completado!</h1>

          <p className="pp-transaction-id">Nº de transacción: {transactionId}</p>

          <div className="pp-product-row">
            {product.image_url
              ? <img src={product.image_url} alt={product.title} className="pp-product-img" />
              : <div className="pp-product-img" />
            }
            <div className="pp-product-info">
              <p className="pp-product-title">{product.title}</p>
              <p className="pp-product-price">{finalPrice.toFixed(2)} €</p>
            </div>
          </div>

          <div className="pp-actions">
            <button
              className="btn-primary"
              onClick={() => navigate('/pedidos')}
            >
              Ver mi pedido
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/')}
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista C: Error ─────────────────────────────────────────────────────────
  return (
    <div className="pp-page">
      <div className="pp-card">
        <div className="pp-error-icon">✕</div>

        <h1 className="pp-error-title">Error al procesar el pago</h1>

        <p className="pp-error-msg">{apiError}</p>

        <div className="pp-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate(-1)}
          >
            Volver al checkout
          </button>
        </div>
      </div>
    </div>
  );
}
