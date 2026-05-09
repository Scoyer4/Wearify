import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { getProductById, getUserById, deleteProduct, getProductsBySeller, addFavorite, removeFavorite, getMyFavorites } from '../services/api';
import { makeDirectOffer, makeDirectSwap } from '../services/chatService';
import { Producto, Favorito } from '../types';
import { useCart } from '../context/cartContext';
import ContactSellerButton from '../components/ContactSellerButton/ContactSellerButton';
import EditProductModal from '../components/EditProductModal';
import ReportModal from '../components/ReportModal/ReportModal';

export default function ProductDetail({ session }: { session: Session | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { añadirAlCarrito } = useCart();

  const [producto, setProducto]               = useState<Producto | null>(null);
  const [sellerAvatarUrl, setSellerAvatarUrl]   = useState<string | null>(null);
  const [activeImage, setActiveImage]           = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // Oferta directa
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerInput, setOfferInput]         = useState('');
  const [offerMode, setOfferMode]           = useState<'10' | '20' | 'custom' | null>(null);
  const [offerLoading, setOfferLoading]     = useState(false);
  const [offerError, setOfferError]         = useState<string | null>(null);

  // Intercambio
  const [showSwapModal, setShowSwapModal]       = useState(false);
  const [swapProducts, setSwapProducts]         = useState<Producto[]>([]);
  const [swapProductsLoading, setSwapProductsLoading] = useState(false);
  const [selectedSwapIds, setSelectedSwapIds]   = useState<string[]>([]);
  const [swapLoading, setSwapLoading]           = useState(false);
  const [swapError, setSwapError]               = useState<string | null>(null);

  const isOwner = !!(session && producto && session.user.id === producto.seller_id);
  const isSold  = producto?.is_sold ?? false;
  const [showReport, setShowReport] = useState(false);

  // Más del vendedor
  const [sellerProducts, setSellerProducts]         = useState<Producto[]>([]);
  const [sellerProductsLoading, setSellerProductsLoading] = useState(false);
  const [favoritos, setFavoritos]                   = useState<Set<string>>(new Set());
  const [ownToast, setOwnToast]                     = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          if (userData?.avatar_url) setSellerAvatarUrl(userData.avatar_url);
        }
        setProducto({ ...data, nombreVendedor });
        setActiveImage(data.image_url ?? null);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    cargarDetalle();
  }, [id]);

  // Cargar productos del vendedor cuando el producto principal cargue
  useEffect(() => {
    if (!producto?.seller_id) return;
    setSellerProductsLoading(true);
    getProductsBySeller(producto.seller_id).then(data => {
      if (data) setSellerProducts(data.filter(p => p.id !== producto.id));
      setSellerProductsLoading(false);
    });
  }, [producto?.seller_id, producto?.id]);

  // Cargar favoritos del usuario
  useEffect(() => {
    if (!session?.access_token) return;
    getMyFavorites(session.access_token).then(data => {
      if (data) setFavoritos(new Set(data.map((fav: Favorito) => fav.product_id)));
    });
  }, [session]);

  const showOwnProductToast = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setOwnToast(false);
    requestAnimationFrame(() => {
      setOwnToast(true);
      toastTimerRef.current = setTimeout(() => setOwnToast(false), 5000);
    });
  };

  const toggleFavorito = async (e: React.MouseEvent, prodId: string) => {
    e.stopPropagation();
    if (!session) { navigate('/login'); return; }
    const token = session.access_token;
    const nuevoSet = new Set(favoritos);
    const adding = !nuevoSet.has(prodId);
    adding ? nuevoSet.add(prodId) : nuevoSet.delete(prodId);
    setFavoritos(nuevoSet);
    setSellerProducts(prev => prev.map(p =>
      p.id === prodId
        ? { ...p, favorites_count: Math.max(0, (p.favorites_count ?? 0) + (adding ? 1 : -1)) }
        : p
    ));
    if (adding) await addFavorite(prodId, token);
    else await removeFavorite(prodId, token);
  };

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

  const handleComprarYa = () => {
    if (!session) { navigate('/login'); return; }
    if (!producto) return;
    navigate(`/checkout/${producto.id}`);
  };

  const openSwapModal = async () => {
    if (!session) { navigate('/login'); return; }
    setSelectedSwapIds([]);
    setSwapError(null);
    setShowSwapModal(true);
    setSwapProductsLoading(true);
    const data = await getProductsBySeller(session.user.id);
    const available = (data ?? []).filter(p => !p.is_sold && p.status !== 'Vendido' && p.id !== producto?.id);
    setSwapProducts(available);
    setSwapProductsLoading(false);
  };

  const toggleSwapProduct = (id: string) => {
    setSwapError(null);
    setSelectedSwapIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) { setSwapError('Puedes seleccionar máximo 4 prendas'); return prev; }
      return [...prev, id];
    });
  };

  const handleSubmitSwap = async () => {
    if (!session || !producto || selectedSwapIds.length === 0) return;
    setSwapLoading(true);
    setSwapError(null);
    try {
      const result = await makeDirectSwap(producto.id, selectedSwapIds, session.access_token);
      setShowSwapModal(false);
      navigate(`/chats/${result.conversationId}`);
    } catch (e) {
      setSwapError(e instanceof Error ? e.message : 'No se pudo enviar la propuesta');
    } finally {
      setSwapLoading(false);
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
          {activeImage ? (
            <img
              src={activeImage}
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
                color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '1.15rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                padding: '10px 28px', borderRadius: 'var(--radius-pill)',
              }}>Vendido</span>
            </div>
          )}
          {(producto.images?.length ?? 0) > 1 && (
            <div className="detail-thumbnails">
              {producto.images!.map((url, i) => (
                <button
                  key={i}
                  className={`detail-thumb${activeImage === url ? ' detail-thumb--active' : ''}`}
                  onClick={() => setActiveImage(url)}
                >
                  <img src={url} alt={`Foto ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info-wrapper">
          <h2 className="detail-title">{producto.title}</h2>
          <p className="detail-price">{producto.price ? `${producto.price} €` : 'Consultar precio'}</p>

          <div className="seller-badge">
            <div className="seller-avatar">
              {sellerAvatarUrl
                ? <img src={sellerAvatarUrl} alt={producto.nombreVendedor} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.1rem' }}>👤</span>
              }
            </div>
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
                >
                  Comprar ya
                </button>
              </div>
              {/* Oferta + Intercambio en la misma fila */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-offer full-width-btn" onClick={openOfferModal}>
                  💰 Hacer una oferta
                </button>
                <button className="btn-offer full-width-btn" onClick={openSwapModal} style={{ background: 'var(--ink-700)', borderColor: 'rgba(108,99,255,0.4)' }}>
                  🔄 Proponer intercambio
                </button>
              </div>
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
              {session && !isOwner && (
                <button
                  className="btn-report-link"
                  onClick={() => setShowReport(true)}
                >
                  🚩 Reportar producto
                </button>
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
            setActiveImage(updated.image_url ?? null);
            setShowEditModal(false);
          }}
        />
      )}

      {showReport && session && producto && (
        <ReportModal
          token={session.access_token}
          productId={producto.id}
          targetName={producto.title}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* ── Más del vendedor ── */}
      {(sellerProductsLoading || sellerProducts.length > 0) && (
        <div className="section-block">
          <h3 className="section-block-title">
            Más de <span style={{ color: 'var(--accent)' }}>@{producto.nombreVendedor}</span>
          </h3>
          {sellerProductsLoading ? (
            <div className="products-scroll">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-card">
                  <div className="skeleton skeleton-image" />
                  <div className="product-info">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-price" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-scroll">
              {sellerProducts.map(p => {
                const vendido = p.is_sold || p.status === 'Vendido';
                const isOwn = !!session && p.seller_id === session.user.id;
                const liked = favoritos.has(p.id);
                const count = p.favorites_count ?? 0;
                return (
                  <div
                    key={p.id}
                    className={`product-card clickable-card${vendido ? ' product-card--sold' : ''}`}
                    onClick={() => navigate(`/producto/${p.id}`)}
                  >
                    <div className="product-image-wrapper">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.title} className="product-image" />
                        : <div className="img-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
                      }
                      {isOwn ? (
                        <button
                          className={`favorite-btn favorite-btn--own${count > 0 ? ' favorite-btn--has-count' : ''}`}
                          onClick={showOwnProductToast}
                        >
                          <span className="fav-heart">🤍</span>
                          {count > 0 && <span className="fav-count">{count}</span>}
                        </button>
                      ) : (
                        <button
                          className={`favorite-btn${liked ? ' liked' : ''}${count > 0 ? ' favorite-btn--has-count' : ''}`}
                          onClick={e => toggleFavorito(e, p.id)}
                        >
                          <span className="fav-heart">{liked ? '❤️' : '🤍'}</span>
                          {count > 0 && <span className="fav-count">{count}</span>}
                        </button>
                      )}
                      {!vendido && p.condition === 'Sin usar' && (
                        <span className="card-badge badge-new">Nuevo</span>
                      )}
                      {vendido && <span className="card-badge badge-sold">Vendido</span>}
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{p.title}</h3>
                      <p className="product-price">{p.price} €</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {ownToast && (
        <div className="own-product-toast" key={String(ownToast)}>
          <div className="own-product-toast__body">
            <span className="own-product-toast__icon">🤍</span>
            <p className="own-product-toast__text">No puedes añadir tu propio producto a favoritos</p>
          </div>
          <div className="own-product-toast__bar" />
        </div>
      )}

      {/* ── Modal de intercambio ── */}
      {showSwapModal && producto && (
        <div className="offer-modal-backdrop" onClick={() => setShowSwapModal(false)}>
          <div className="offer-modal-card swap-select-modal" onClick={e => e.stopPropagation()}>
            <div className="offer-modal-header">
              <h3 className="offer-modal-title">🔄 Proponer intercambio</h3>
              <button className="offer-modal-close-btn" onClick={() => setShowSwapModal(false)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="offer-modal-product">
              {producto.image_url && <img src={producto.image_url} alt={producto.title} className="offer-modal-product-img" />}
              <div>
                <p className="offer-modal-product-title">A cambio de: <strong>{producto.title}</strong></p>
                <p className="offer-modal-product-price">Precio: <strong>{producto.price} €</strong></p>
              </div>
            </div>

            <div className="offer-modal-divider" />

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Selecciona hasta 4 prendas para ofrecer
              {selectedSwapIds.length > 0 && (
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}> — {selectedSwapIds.length}/4 seleccionada{selectedSwapIds.length > 1 ? 's' : ''}</span>
              )}:
            </p>

            {swapProductsLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando tus prendas…</div>
            ) : swapProducts.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tienes prendas disponibles para intercambiar.
              </div>
            ) : (
              <div className="swap-product-list">
                {swapProducts.map(p => {
                  const selected = selectedSwapIds.includes(p.id);
                  const disabled = !selected && selectedSwapIds.length >= 4;
                  return (
                    <button
                      key={p.id}
                      className={`swap-product-item${selected ? ' swap-product-item--selected' : ''}${disabled ? ' swap-product-item--disabled' : ''}`}
                      onClick={() => toggleSwapProduct(p.id)}
                    >
                      <div className="swap-product-item-img">
                        {p.image_url ? <img src={p.image_url} alt={p.title} /> : <span>📦</span>}
                      </div>
                      <div className="swap-product-item-info">
                        <span className="swap-product-item-name">{p.title}</span>
                        <span className="swap-product-item-price">{p.price} €</span>
                      </div>
                      {selected && <span className="swap-product-item-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {swapError && <p className="offer-modal-error">⚠ {swapError}</p>}

            <button
              className="btn-primary full-width-btn offer-submit-btn"
              onClick={handleSubmitSwap}
              disabled={selectedSwapIds.length === 0 || swapLoading}
            >
              {swapLoading ? 'Enviando…' : 'Proponer intercambio'}
            </button>

            <p className="offer-modal-hint">El vendedor recibirá tu propuesta y podrá aceptarla o rechazarla.</p>
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
