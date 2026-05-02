import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { getProductById, getUserById, deleteProduct } from '../services/api';
import { createOrder, makeDirectOffer } from '../services/chatService';
import { Producto } from '../types';
import { useCart } from '../context/cartContext';
import ContactSellerButton from '../components/ContactSellerButton/ContactSellerButton';
import EditProductModal from '../components/EditProductModal';

export default function ProductDetail({ session }: { session: Session | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { añadirAlCarrito } = useCart();

  const [producto, setProducto]     = useState<Producto | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // Compra directa
  const [buyLoading, setBuyLoading]   = useState(false);
  const [buyError, setBuyError]       = useState<string | null>(null);
  const [buyConfirm, setBuyConfirm]   = useState<{ orderId: string } | null>(null);

  // Oferta directa
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerInput, setOfferInput]         = useState('');
  const [offerMode, setOfferMode]           = useState<'10' | '20' | 'custom' | null>(null);
  const [offerLoading, setOfferLoading]     = useState(false);
  const [offerError, setOfferError]         = useState<string | null>(null);

  const isOwner = !!(session && producto && session.user.id === producto.seller_id);
  const isSold  = producto?.is_sold ?? false;

  useEffect(() => {
    const cargarDetalle = async () => {
      setLoading(true);
      setError(false);

      if (!id) return;

      const data = await getProductById(id);

      if (data) {
        let nombreVendedor = 'Usuario Desconocido';
        if (data.seller_id) {
          const userData = await getUserById(data.seller_id);
          if (userData?.username) nombreVendedor = userData.username;
        }
        setProducto({ ...data, nombreVendedor });
      } else {
        setError(true);
      }
      setLoading(false);
    };

    cargarDetalle();
  }, [id]);

  const handleAñadirAlCarrito = (prod: Producto) => {
    if (!session) {
      alert('¡Hola! Para añadir prendas al carrito necesitas iniciar sesión o crear una cuenta.');
      navigate('/login');
      return;
    }
    añadirAlCarrito(prod);
    alert('¡Añadido al carrito!');
  };

  const handleDelete = async () => {
    if (!session || !producto) return;
    if (!window.confirm(`¿Eliminar "${producto.title}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    const ok = await deleteProduct(producto.id, session.access_token);
    if (ok) navigate('/perfil');
    else { setDeleting(false); alert('No se pudo eliminar el producto.'); }
  };

  const handleComprarYa = async () => {
    if (!session) { navigate('/login'); return; }
    if (!producto) return;

    setBuyLoading(true);
    setBuyError(null);

    try {
      const result = await createOrder(producto.id, session.access_token);
      setProducto(prev => prev ? { ...prev, is_sold: true } : prev);
      setBuyConfirm({ orderId: result.orderId });
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'No se pudo completar la compra. Inténtalo de nuevo.');
    } finally {
      setBuyLoading(false);
    }
  };

  const openOfferModal = () => {
    if (!session) { navigate('/login'); return; }
    setOfferInput('');
    setOfferMode(null);
    setOfferError(null);
    setShowOfferModal(true);
  };

  const selectPreset = (mode: '10' | '20' | 'custom') => {
    setOfferMode(mode);
    setOfferError(null);
    if (!producto) return;
    if (mode === '10') setOfferInput((producto.price * 0.9).toFixed(2));
    else if (mode === '20') setOfferInput((producto.price * 0.8).toFixed(2));
    else setOfferInput('');
  };

  const handleSubmitOffer = async () => {
    if (!session || !producto) return;

    const price = parseFloat(offerInput.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      setOfferError('Introduce un precio válido mayor que 0');
      return;
    }
    if (price >= producto.price) {
      setOfferError(`La oferta debe ser menor que el precio original (${producto.price} €)`);
      return;
    }

    setOfferLoading(true);
    setOfferError(null);

    try {
      const result = await makeDirectOffer(producto.id, price, session.access_token);
      setShowOfferModal(false);
      navigate(`/chats/${result.conversationId}`);
    } catch (e) {
      setOfferError(e instanceof Error ? e.message : 'No se pudo enviar la oferta. Inténtalo de nuevo.');
    } finally {
      setOfferLoading(false);
    }
  };

  if (loading) {
    return <section className="product-detail-section"><p className="loading-text">Cargando información del producto...</p></section>;
  }

  if (error || !producto) {
    return (
      <section className="product-detail-section">
        <button onClick={() => navigate(-1)} className="btn-primary back-btn">← Volver</button>
        <div className="empty-state">
          <p className="empty-state-text" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
            ⚠️ Error: No se pudo cargar la información del producto.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>Asegúrate de que el servidor de Node.js esté encendido.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-section">
      <button onClick={() => navigate(-1)} className="back-btn" style={{ borderRadius: '16px' }}>←</button>

      <div className="detail-container">
        <div className="detail-image-wrapper" style={{ position: 'relative' }}>
          {producto.image_url ? (
            <img
              src={producto.image_url}
              alt={producto.title}
              className="detail-image"
              style={isSold ? { filter: 'grayscale(40%)', opacity: 0.8 } : undefined}
            />
          ) : (
            <div className="detail-placeholder">Sin foto</div>
          )}
          {isSold && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.32)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{
                background: 'rgba(255,77,106,0.92)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '1.15rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '10px 28px',
                borderRadius: 'var(--radius-pill)',
              }}>
                Vendido
              </span>
            </div>
          )}
        </div>

        <div className="detail-info-wrapper">
          <h2 className="detail-title">{producto.title}</h2>
          <p className="detail-price">{producto.price ? `${producto.price} €` : 'Consultar precio'}</p>

          <div className="seller-badge">
            <div className="seller-avatar">👤</div>
            <div>
              <p className="seller-label">Subido por</p>
              <Link to={`/usuario/${producto.seller_id}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent)', textDecoration: 'none' }}>
                @{producto.nombreVendedor}
              </Link>
            </div>
          </div>

          <div className="detail-desc-box">
            <h3 className="detail-desc-title">Descripción</h3>
            <p className="detail-desc-text">{producto.description || 'El vendedor no ha añadido una descripción.'}</p>
          </div>

          <div className="detail-tags">
            {producto.brand     && <span className="detail-tag">Marca: {producto.brand}</span>}
            {producto.size      && <span className="detail-tag">Talla: {producto.size}</span>}
            {producto.condition && <span className="detail-tag">Estado: {producto.condition}</span>}
          </div>

          {isOwner ? (
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn-primary full-width-btn" onClick={() => setShowEditModal(true)}>
                ✏️ Editar prenda
              </button>
              <button
                className="btn-pay full-width-btn"
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                {deleting ? 'Eliminando...' : '🗑 Eliminar'}
              </button>
            </div>
          ) : !isSold ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
              {/* Fila superior: carrito + compra directa */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary full-width-btn" onClick={() => handleAñadirAlCarrito(producto)}>
                  Añadir al carrito
                </button>
                <button
                  className="btn-pay full-width-btn"
                  onClick={handleComprarYa}
                  disabled={buyLoading}
                >
                  {buyLoading ? 'Procesando…' : 'Comprar ya'}
                </button>
              </div>
              {buyError && (
                <p style={{ fontSize: '0.85rem', color: 'var(--danger)', margin: 0 }}>
                  ⚠️ {buyError}
                </p>
              )}
              {/* Oferta directa */}
              <button className="btn-offer full-width-btn" onClick={openOfferModal}>
                💰 Hacer una oferta
              </button>
              {/* Contactar vendedor */}
              {producto.seller_id && (
                <ContactSellerButton
                  productId={producto.id}
                  sellerId={producto.seller_id}
                  productTitle={producto.title}
                  productImage={producto.image_url ?? null}
                  session={session}
                />
              )}
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', padding: '14px 18px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--danger)' }}>🏷️ Este producto ya ha sido vendido</p>
            </div>
          )}
        </div>
      </div>

      {showEditModal && session && (
        <EditProductModal
          producto={producto}
          token={session.access_token}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setProducto(prev => prev ? { ...prev, ...updated } : prev);
            setShowEditModal(false);
          }}
        />
      )}

      {/* ── Modal de confirmación de compra ── */}
      {buyConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '1rem', backdropFilter: 'blur(3px)',
          }}
          onClick={() => setBuyConfirm(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: 400, width: '100%',
              textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              ¡Compra realizada!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
              El vendedor se pondrá en contacto contigo pronto.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', margin: '0 0 1.5rem', wordBreak: 'break-all' }}>
              Nº pedido: {buyConfirm.orderId}
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setBuyConfirm(null)}>
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de oferta directa ── */}
      {showOfferModal && producto && (
        <div
          className="offer-modal-backdrop"
          onClick={() => setShowOfferModal(false)}
        >
          <div className="offer-modal-card" onClick={e => e.stopPropagation()}>

            {/* Cabecera */}
            <div className="offer-modal-header">
              <h3 className="offer-modal-title">Hacer una oferta</h3>
              <button className="offer-modal-close-btn" onClick={() => setShowOfferModal(false)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Producto */}
            <div className="offer-modal-product">
              {producto.image_url && (
                <img src={producto.image_url} alt={producto.title} className="offer-modal-product-img" />
              )}
              <div>
                <p className="offer-modal-product-title">{producto.title}</p>
                <p className="offer-modal-product-price">
                  Precio actual: <strong>{producto.price.toFixed(2)} €</strong>
                </p>
              </div>
            </div>

            <div className="offer-modal-divider" />

            {/* Presets de descuento */}
            <div className="offer-presets">
              {(['10', '20'] as const).map(pct => {
                const discounted = producto.price * (1 - Number(pct) / 100);
                const active = offerMode === pct;
                return (
                  <button key={pct} className={`offer-preset-btn${active ? ' offer-preset-btn--active' : ''}`} onClick={() => selectPreset(pct)}>
                    <span className="offer-preset-price">{discounted.toFixed(2)} €</span>
                    <span className="offer-preset-label">{pct}% descuento</span>
                  </button>
                );
              })}
              <button
                className={`offer-preset-btn${offerMode === 'custom' ? ' offer-preset-btn--active' : ''}`}
                onClick={() => selectPreset('custom')}
              >
                <span className="offer-preset-price offer-preset-price--custom">Personalizar</span>
                <span className="offer-preset-label">Ponle un precio</span>
              </button>
            </div>

            {/* Input de precio */}
            <div className="offer-input-wrap">
              <input
                type="number"
                placeholder="0.00"
                value={offerInput}
                onChange={e => { setOfferInput(e.target.value); setOfferMode('custom'); setOfferError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitOffer(); }}
                min={0.01}
                step={0.01}
                className={`offer-input${offerError ? ' offer-input--error' : offerInput ? ' offer-input--filled' : ''}`}
              />
              <span className="offer-input-suffix">€</span>
            </div>

            {offerError && <p className="offer-modal-error">⚠ {offerError}</p>}

            <button
              className="btn-primary full-width-btn offer-submit-btn"
              onClick={handleSubmitOffer}
              disabled={!offerInput || offerLoading}
            >
              {offerLoading ? 'Enviando…' : 'Ofrecer'}
            </button>

            <p className="offer-modal-hint">El vendedor recibirá tu oferta y podrá aceptarla, rechazarla o contraofertar.</p>
          </div>
        </div>
      )}
    </section>
  );
}
