import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { CheckoutSummary, ShippingAddress, ShippingType } from '../../types/checkout';
import { getCheckoutSummary, createStripeSession } from '../../services/checkoutService';
import { toast } from '../../lib/toast';
import './Checkout.css';

interface Props {
  session: Session | null;
}

const EMPTY_ADDRESS: ShippingAddress = {
  name: '', address: '', city: '', postalCode: '', country: 'España',
};

type FieldErrors = Partial<Record<keyof ShippingAddress, string>>;

export default function Checkout({ session }: Props) {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerPrice = (() => {
    const v = parseFloat(searchParams.get('offerPrice') ?? '');
    return isNaN(v) || v <= 0 ? null : v;
  })();

  const [summary, setSummary]         = useState<CheckoutSummary | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError]     = useState<string | null>(null);

  const [form, setForm]               = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [shippingType, setShipping]   = useState<ShippingType>('standard');
  const [saveAddress, setSaveAddress] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    if (!productId) { navigate('/'); return; }

    (async () => {
      setPageLoading(true);
      try {
        const data = await getCheckoutSummary(productId, session.access_token);
        setSummary(data);
        if (data.savedAddress) {
          setForm(data.savedAddress);
          setSaveAddress(false);
        } else {
          setSaveAddress(true);
        }
      } catch (e) {
        setPageError(e instanceof Error ? e.message : 'Error al cargar el checkout');
      } finally {
        setPageLoading(false);
      }
    })();
  }, [productId, session, navigate]);

  // ── Cálculo de precios en tiempo real ───────────────────────────────────────
  const selectedOption  = summary?.shippingOptions.find(o => o.type === shippingType);
  const shippingCost    = selectedOption?.price ?? 0;
  const productPrice    = offerPrice ?? (summary?.product.price ?? 0);
  const originalPrice   = summary?.product.price ?? 0;
  const total           = productPrice + shippingCost;

  // ── Actualizar campo del formulario ─────────────────────────────────────────
  const handleField = (field: keyof ShippingAddress, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Validación ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const required: Array<{ key: keyof ShippingAddress; label: string }> = [
      { key: 'name',       label: 'El nombre es obligatorio' },
      { key: 'address',    label: 'La dirección es obligatoria' },
      { key: 'city',       label: 'La ciudad es obligatoria' },
      { key: 'postalCode', label: 'El código postal es obligatorio' },
      { key: 'country',    label: 'El país es obligatorio' },
    ];
    for (const { key, label } of required) {
      if (!form[key].trim()) errors[key] = label;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Confirmar compra → sesión Stripe ────────────────────────────────────────
  const handleConfirm = async () => {
    if (!session || !summary || !productId) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const sessionPromise = createStripeSession(
      { productId, shippingAddress: form, shippingType, saveAddress, ...(offerPrice ? { offerPrice } : {}) },
      session.access_token,
    );

    toast.promise(sessionPromise, {
      loading: 'Preparando el pago…',
      success: 'Redirigiendo a Stripe…',
      error: (e) => e instanceof Error ? e.message : 'Error al iniciar el pago',
    });

    try {
      const { url } = await sessionPromise;
      window.location.href = url;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al iniciar el pago');
      setSubmitting(false);
    }
  };

  // ── Estados de carga / error de página ──────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="checkout-page">
        <div className="checkout-skeleton">
          <div className="skeleton checkout-skeleton-title" />
          <div className="checkout-layout">
            <div className="checkout-col-left">
              <div className="skeleton checkout-skeleton-section" />
              <div className="skeleton checkout-skeleton-section" />
            </div>
            <div className="checkout-col-right">
              <div className="skeleton checkout-skeleton-section" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="checkout-page">
        <div className="checkout-error-state">
          <p className="checkout-error-icon">⚠️</p>
          <h2>{pageError}</h2>
          <div className="checkout-error-actions">
            <button className="btn-primary" onClick={() => navigate(-1)}>Volver</button>
            <button className="btn-secondary" onClick={() => navigate('/')}>Ver catálogo</button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const { product, shippingOptions } = summary;

  return (
    <div className="checkout-page">
      {/* ── Cabecera ── */}
      <div className="checkout-header">
        <button className="checkout-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="checkout-title">Finalizar compra</h1>
      </div>

      <div className="checkout-layout">

        {/* ══ COLUMNA IZQUIERDA ══════════════════════════════════════════════ */}
        <div className="checkout-col-left">

          {/* Producto */}
          <div className="checkout-section">
            <h2 className="checkout-section-title">Producto</h2>
            <div className="checkout-product-row">
              {product.image_url
                ? <img src={product.image_url} alt={product.title} className="checkout-product-img" />
                : <div className="checkout-product-img checkout-product-img--placeholder" />
              }
              <div className="checkout-product-info">
                <p className="checkout-product-name">{product.title}</p>
                {offerPrice ? (
                  <div className="checkout-offer-price-row">
                    <span className="checkout-product-price checkout-product-price--offer">{offerPrice.toFixed(2)} €</span>
                    <span className="checkout-product-price--original">{originalPrice.toFixed(2)} €</span>
                    <span className="checkout-offer-badge">Precio negociado</span>
                  </div>
                ) : (
                  <p className="checkout-product-price">{product.price.toFixed(2)} €</p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección de entrega */}
          <div className="checkout-section">
            <h2 className="checkout-section-title">Dirección de entrega</h2>

            <div className="checkout-form">
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  className={`form-input${fieldErrors.name ? ' form-input--error' : ''}`}
                  type="text"
                  placeholder="Tu nombre completo"
                  value={form.name}
                  onChange={e => handleField('name', e.target.value)}
                />
                {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  className={`form-input${fieldErrors.address ? ' form-input--error' : ''}`}
                  type="text"
                  placeholder="Calle, número, piso..."
                  value={form.address}
                  onChange={e => handleField('address', e.target.value)}
                />
                {fieldErrors.address && <p className="form-error">{fieldErrors.address}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input
                    className={`form-input${fieldErrors.city ? ' form-input--error' : ''}`}
                    type="text"
                    placeholder="Madrid"
                    value={form.city}
                    onChange={e => handleField('city', e.target.value)}
                  />
                  {fieldErrors.city && <p className="form-error">{fieldErrors.city}</p>}
                </div>

                <div className="form-group form-group--narrow">
                  <label className="form-label">Código postal</label>
                  <input
                    className={`form-input${fieldErrors.postalCode ? ' form-input--error' : ''}`}
                    type="text"
                    placeholder="28001"
                    maxLength={10}
                    value={form.postalCode}
                    onChange={e => handleField('postalCode', e.target.value)}
                  />
                  {fieldErrors.postalCode && <p className="form-error">{fieldErrors.postalCode}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">País</label>
                <input
                  className={`form-input${fieldErrors.country ? ' form-input--error' : ''}`}
                  type="text"
                  placeholder="España"
                  value={form.country}
                  onChange={e => handleField('country', e.target.value)}
                />
                {fieldErrors.country && <p className="form-error">{fieldErrors.country}</p>}
              </div>

              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={saveAddress}
                  onChange={e => setSaveAddress(e.target.checked)}
                />
                <span>Guardar esta dirección para futuras compras</span>
              </label>
            </div>
          </div>

          {/* Tipo de envío */}
          <div className="checkout-section">
            <h2 className="checkout-section-title">Tipo de envío</h2>
            <div className="shipping-options">
              {shippingOptions.map(opt => (
                <button
                  key={opt.type}
                  className={`shipping-card${shippingType === opt.type ? ' shipping-card--active' : ''}`}
                  onClick={() => setShipping(opt.type)}
                >
                  <span className="shipping-card-icon">{opt.type === 'express' ? '⚡' : '🚚'}</span>
                  <div className="shipping-card-info">
                    <span className="shipping-card-label">{opt.label}</span>
                    <span className="shipping-card-price">
                      {opt.price === 0 ? 'Gratis' : `${opt.price.toFixed(2)} €`}
                    </span>
                  </div>
                  <div className="shipping-card-radio">
                    {shippingType === opt.type && <div className="shipping-card-radio-dot" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ══ COLUMNA DERECHA ════════════════════════════════════════════════ */}
        <div className="checkout-col-right">
          <div className="order-summary-card">
            <h2 className="checkout-section-title">Resumen del pedido</h2>

            {/* Producto en el resumen */}
            <div className="order-summary-product">
              {product.image_url
                ? <img src={product.image_url} alt={product.title} className="order-summary-img" />
                : <div className="order-summary-img order-summary-img--placeholder" />
              }
              <p className="order-summary-product-name">{product.title}</p>
            </div>

            <div className="order-summary-divider" />

            {/* Desglose */}
            <div className="order-summary-rows">
              <div className="order-summary-row">
                <span>{offerPrice ? 'Precio negociado' : 'Producto'}</span>
                <span>{productPrice.toFixed(2)} €</span>
              </div>
              <div className="order-summary-row">
                <span>Envío</span>
                <span className={shippingCost === 0 ? 'order-summary-free' : ''}>
                  {shippingCost === 0 ? 'Gratis' : `${shippingCost.toFixed(2)} €`}
                </span>
              </div>
            </div>

            <div className="order-summary-divider" />

            <div className="order-summary-total">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>

            {/* CTA */}
            <button
              className="btn-primary checkout-confirm-btn"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting
                ? <><span className="checkout-spinner" /> Redirigiendo a Stripe…</>
                : 'Ir a pagar'}
            </button>

            {submitError && <p className="checkout-submit-error">{submitError}</p>}

            <p className="checkout-security-note">🔒 Pago seguro gestionado por Stripe</p>
          </div>
        </div>

      </div>
    </div>
  );
}
