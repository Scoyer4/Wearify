import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from '../lib/toast';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { Session } from '@supabase/supabase-js';
import { getProductById, getUserById, deleteProduct, getProductsBySeller, addFavorite, removeFavorite, getMyFavorites } from '../services/api';
import { makeDirectOffer, makeDirectSwap } from '../services/chatService';
import { Producto, Favorito } from '../types';
import ContactSellerButton from '../components/ContactSellerButton/ContactSellerButton';
import EditProductModal from '../components/EditProductModal';
import ReportModal from '../components/ReportModal/ReportModal';
import '../styles/ProductDetail.css';

export default function ProductDetail({ session }: { session: Session | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm, ModalComponent } = useConfirmModal();

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

  // UI local
  const [descExpanded, setDescExpanded]   = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const isOwner      = !!(session && producto && session.user.id === producto.seller_id);
  const isSold       = producto?.is_sold ?? false;
  const isReserved   = producto?.is_reserved ?? false;
  const isUnavailable = isSold || isReserved;
  const isLongDesc = (producto?.description?.length ?? 0) > 200;

  const [showReport, setShowReport] = useState(false);

  // Más del vendedor
  const [sellerProducts, setSellerProducts]         = useState<Producto[]>([]);
  const [sellerProductsLoading, setSellerProductsLoading] = useState(false);
  const [favoritos, setFavoritos]                   = useState<Set<string>>(new Set());

  // JS-based sticky for left column
  const layoutRef    = useRef<HTMLDivElement>(null);
  const leftRef      = useRef<HTMLDivElement>(null);
  const leftInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

  useEffect(() => {
    if (!producto?.seller_id) return;
    setSellerProductsLoading(true);
    getProductsBySeller(producto.seller_id).then(data => {
      if (data) setSellerProducts(data.filter(p => p.id !== producto.id));
      setSellerProductsLoading(false);
    });
  }, [producto?.seller_id, producto?.id]);

  useEffect(() => {
    if (!session?.access_token) return;
    getMyFavorites(session.access_token).then(data => {
      if (data) setFavoritos(new Set(data.map((fav: Favorito) => fav.product_id)));
    });
  }, [session]);

  // JS sticky: fix left column within the bounds of the grid container
  useEffect(() => {
    const layout = layoutRef.current;
    const outer  = leftRef.current;
    const inner  = leftInnerRef.current;
    if (!layout || !outer || !inner) return;

    const navHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
    ) || 112;
    const stickyTop = navHeight + 16;

    // Cache left position from offset (stable — unaffected by scrollbar appearing)
    const getFixedLeft = () => {
      let left = 0;
      let el: HTMLElement | null = outer;
      while (el) { left += el.offsetLeft; el = el.offsetParent as HTMLElement | null; }
      return left;
    };

    const reset = () => { inner.style.cssText = ''; };

    const apply = () => {
      // Mobile: single column, no sticky
      if (window.innerWidth <= 768) { reset(); return; }

      const innerH     = inner.offsetHeight;
      const layoutRect = layout.getBoundingClientRect();
      const fixedLeft  = getFixedLeft();
      const fixedWidth = outer.offsetWidth;

      if (layoutRect.top > stickyTop) {
        // Above sticky zone — normal flow
        reset();
      } else if (layoutRect.bottom <= stickyTop + innerH) {
        // Below sticky zone — slide up with grid bottom so it never overlaps content below
        inner.style.cssText = `position:fixed;top:${Math.max(stickyTop - (innerH - layoutRect.bottom + stickyTop), 0)}px;left:${fixedLeft}px;width:${fixedWidth}px;`;
      } else {
        // In sticky zone — pin to top
        inner.style.cssText = `position:fixed;top:${stickyTop}px;left:${fixedLeft}px;width:${fixedWidth}px;`;
      }
    };

    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', apply);
    apply();

    return () => {
      window.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
      reset();
    };
  }, [producto, activeImage]);

  const showOwnProductToast = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.warning('No puedes añadir tu propio producto a favoritos');
  };

  const toggleFavorito = async (e: React.MouseEvent, prodId: string) => {
    e.stopPropagation();
    if (!session) { navigate('/login'); return; }
    const token = session.access_token;
    const nuevoSet = new Set(favoritos);
    const adding = !nuevoSet.has(prodId);
    if (adding) { nuevoSet.add(prodId); toast.success('Añadido a favoritos'); }
    else { nuevoSet.delete(prodId); toast.info('Eliminado de favoritos'); }
    setFavoritos(nuevoSet);
    setProducto(prev => prev && prev.id === prodId
      ? { ...prev, favorites_count: Math.max(0, (prev.favorites_count ?? 0) + (adding ? 1 : -1)) }
      : prev
    );
    setSellerProducts(prev => prev.map(p =>
      p.id === prodId
        ? { ...p, favorites_count: Math.max(0, (p.favorites_count ?? 0) + (adding ? 1 : -1)) }
        : p
    ));
    if (adding) await addFavorite(prodId, token);
    else await removeFavorite(prodId, token);
  };

  const handleDelete = async () => {
    if (!session || !producto) return;
    const ok = await confirm({
      title: `¿Eliminar "${producto.title}"?`,
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    const deleted = await deleteProduct(producto.id, session.access_token);
    if (deleted) navigate('/perfil');
    else { setDeleting(false); toast.error('No se pudo eliminar el producto.'); }
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

  const toggleSwapProduct = (pid: string) => {
    setSwapError(null);
    setSelectedSwapIds(prev => {
      if (prev.includes(pid)) return prev.filter(x => x !== pid);
      if (prev.length >= 4) { setSwapError('Puedes seleccionar máximo 4 prendas'); return prev; }
      return [...prev, pid];
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

  // ── Skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <section className="pd-page">
        <div className="pd-skel-layout">
          <div className="pd-left">
            <div className="skeleton pd-skel-img" />
            <div className="pd-skel-thumbs">
              {[0, 1, 2].map(i => <div key={i} className="skeleton pd-skel-thumb" />)}
            </div>
          </div>
          <div className="pd-skel-right">
            <div className="skeleton pd-skel-title" />
            <div className="skeleton pd-skel-price" />
            <div className="skeleton pd-skel-seller" />
            <div className="skeleton pd-skel-chips" />
            <div className="skeleton pd-skel-desc" />
            <div className="skeleton pd-skel-actions" />
          </div>
        </div>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error || !producto) {
    return (
      <section className="pd-page">
          <div className="empty-state">
          <p className="empty-state-text" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
            ⚠️ Error: No se pudo cargar la información del producto.
          </p>
          <p style={{ color: 'var(--text-muted)' }}>Asegúrate de que el servidor de Node.js esté encendido.</p>
        </div>
      </section>
    );
  }

  // ── Acordeones data ───────────────────────────────────
  const ACCORDIONS = [
    {
      title: 'Política de devoluciones',
      body: 'Los productos de segunda mano no admiten devoluciones salvo que no correspondan con la descripción.',
    },
    {
      title: 'Compra segura',
      body: 'Tu compra está protegida. El vendedor tiene 48h para confirmar el envío.',
    },
    {
      title: 'Sobre el vendedor',
      body: `Vendedor: @${producto.nombreVendedor}. Visita su perfil para ver más prendas y valoraciones.`,
    },
  ];

  // ── Render ────────────────────────────────────────────
  return (
    <section className="pd-page">
      {ModalComponent}

      {/* ── Layout dos columnas ── */}
      <div className="pd-layout">

        {/* ══ COLUMNA IZQUIERDA ══════════════════════════ */}
        <div className="pd-left" ref={leftRef}>
          <div className="pd-left-inner" ref={leftInnerRef}>
          <div className="pd-img-main-wrap">
            {activeImage ? (
              <img
                key={activeImage}
                src={activeImage}
                alt={producto.title}
                className="pd-img-main"
              />
            ) : (
              <div className="pd-img-placeholder">Sin foto</div>
            )}
            {isSold && (
              <div className="pd-sold-overlay">
                <span className="pd-sold-overlay-text">VENDIDO</span>
              </div>
            )}
            {isOwner ? (
              <button
                className={`favorite-btn pd-fav-own${(producto.favorites_count ?? 0) > 0 ? ' favorite-btn--has-count' : ''}`}
                onClick={showOwnProductToast}
              >
                <span className="fav-heart">🤍</span>
                {(producto.favorites_count ?? 0) > 0 && <span className="fav-count">{producto.favorites_count}</span>}
              </button>
            ) : (
              <button
                className={`favorite-btn${favoritos.has(producto.id) ? ' liked' : ''}${(producto.favorites_count ?? 0) > 0 ? ' favorite-btn--has-count' : ''}`}
                onClick={e => toggleFavorito(e, producto.id)}
              >
                <span className="fav-heart">{favoritos.has(producto.id) ? '❤️' : '🤍'}</span>
                {(producto.favorites_count ?? 0) > 0 && <span className="fav-count">{producto.favorites_count}</span>}
              </button>
            )}
          </div>

          {(producto.images?.length ?? 0) > 1 && (
            <div className="pd-thumbs">
              {producto.images!.map((url, i) => (
                <button
                  key={i}
                  className={`pd-thumb${activeImage === url ? ' pd-thumb--active' : ''}`}
                  onClick={() => setActiveImage(url)}
                >
                  <img src={url} alt={`Foto ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
          </div>{/* pd-left-inner */}
        </div>

        {/* ══ COLUMNA DERECHA ════════════════════════════ */}
        <div className="pd-right">

          {/* Breadcrumb */}
          <nav className="pd-breadcrumb" aria-label="breadcrumb">
            <Link to="/" className="pd-breadcrumb-link">Inicio</Link>
            <span className="pd-breadcrumb-sep">/</span>
            <span className="pd-breadcrumb-cur">{producto.title}</span>
          </nav>

          {/* Título */}
          <h1 className="pd-title">{producto.title}</h1>

          {/* Precio */}
          <p className={`pd-price${isSold ? ' pd-price--sold' : ''}`}>
            {producto.price ? `${producto.price} €` : 'Consultar precio'}
          </p>

          {/* Descripción */}
          <div className="pd-desc">
            <p className="pd-desc-label">Descripción</p>
            <p className="pd-desc-text">
              {!isLongDesc || descExpanded
                ? (producto.description || 'El vendedor no ha añadido una descripción.')
                : producto.description!.slice(0, 200) + '...'}
            </p>
            {isLongDesc && (
              <button className="pd-desc-toggle" onClick={() => setDescExpanded(p => !p)}>
                {descExpanded ? 'Leer menos ↑' : 'Leer más ↓'}
              </button>
            )}
          </div>

          {/* Chips */}
          {(producto.brand || producto.size || producto.condition || producto.gender) && (
            <div className="pd-chips">
              {producto.gender    && <span className="pd-chip">Para: {producto.gender}</span>}
              {producto.brand     && <span className="pd-chip">Marca: {producto.brand}</span>}
              {producto.size      && <span className="pd-chip">Talla: {producto.size}</span>}
              {producto.condition && <span className="pd-chip">Estado: {producto.condition}</span>}
            </div>
          )}

          {/* Tarjeta vendedor */}
          <div className="pd-seller">
            <div className="pd-seller-avatar">
              {sellerAvatarUrl ? (
                <img src={sellerAvatarUrl} alt={producto.nombreVendedor} className="pd-seller-avatar-img" />
              ) : (
                <span className="pd-seller-avatar-fallback">
                  {(producto.nombreVendedor ?? '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="pd-seller-info">
              <span className="pd-seller-label">Subido por</span>
              <Link to={`/usuario/${producto.seller_id}`} className="pd-seller-name">
                @{producto.nombreVendedor}
              </Link>
            </div>
            <Link to={`/usuario/${producto.seller_id}`} className="pd-seller-profile-btn">
              Ver perfil
            </Link>
          </div>

          {/* ── Acciones ── */}
          <div className="pd-actions">
            {isOwner ? (
              <div className="pd-actions-owner">
                <button className="pd-btn pd-btn--edit" onClick={() => setShowEditModal(true)}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 7, flexShrink: 0, verticalAlign: 'middle', position: 'relative', top: '-1px'}}>
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                  Editar prenda
                </button>
                <button
                  className="pd-btn pd-btn--delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando...' : '🗑 Eliminar'}
                </button>
              </div>
            ) : isUnavailable ? (
              <div className="pd-sold-msg">
                {isReserved ? 'Este producto está reservado y pendiente de envío.' : 'Este producto ya ha sido vendido.'}
              </div>
            ) : (
              <>
                <div className="pd-actions-row">
                  <button className="pd-btn pd-btn--buy" onClick={handleComprarYa}>
                    Comprar ya
                  </button>
                </div>
                <div className="pd-actions-row pd-actions-row--secondary">
                  <button className="pd-btn pd-btn--outline" onClick={openOfferModal}>
                    Hacer una oferta
                  </button>
                  <button className="pd-btn pd-btn--outline" onClick={openSwapModal}>
                    Proponer intercambio
                  </button>
                </div>
                {producto.seller_id && (
                  <div className="pd-actions-contact">
                    <ContactSellerButton
                      productId={producto.id}
                      sellerId={producto.seller_id}
                      productTitle={producto.title}
                      productImage={producto.image_url ?? null}
                      session={session}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Acordeones ── */}
          <div className="pd-accordions">
            {ACCORDIONS.map((acc, idx) => (
              <div key={idx} className={`pd-accordion${openAccordion === idx ? ' pd-accordion--open' : ''}`}>
                <button
                  className="pd-accordion-header"
                  onClick={() => setOpenAccordion(prev => prev === idx ? null : idx)}
                >
                  <span>{acc.title}</span>
                  <svg
                    className="pd-accordion-chevron"
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openAccordion === idx && (
                  <div className="pd-accordion-body">
                    <p>{acc.body}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reportar */}
          {session && !isOwner && (
            <button className="pd-report-btn" onClick={() => setShowReport(true)}>
              Reportar producto
            </button>
          )}

        </div>
      </div>

      {/* ── Más del vendedor ── */}
      {(sellerProductsLoading || sellerProducts.length > 0) && (
        <div className="section-block pd-more-seller">
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
                const vendido   = p.is_sold || p.status === 'Vendido';
                const reservado = !vendido && !!p.is_reserved;
                const isOwn     = !!session && p.seller_id === session.user.id;
                const liked   = favoritos.has(p.id);
                const count   = p.favorites_count ?? 0;
                return (
                  <div
                    key={p.id}
                    className={`product-card clickable-card${vendido ? ' product-card--sold' : ''}`}
                    onClick={() => navigate(`/producto/${p.id}`)}
                  >
                    <div className="product-image-wrapper">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.title} className="product-image" />
                        : (
                          <div className="img-placeholder">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          </div>
                        )
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
                      {!vendido && !reservado && p.condition === 'Sin usar' && (
                        <span className="card-badge badge-new">Nuevo</span>
                      )}
                      {reservado && <span className="card-badge badge-reserved">Reservado</span>}
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

      {/* ── Modales ── */}
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

      {showSwapModal && producto && (
        <div className="offer-modal-backdrop" onClick={() => setShowSwapModal(false)}>
          <div className="offer-modal-card swap-select-modal" onClick={e => e.stopPropagation()}>
            <div className="offer-modal-header">
              <h3 className="offer-modal-title">Proponer intercambio</h3>
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
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {' '}— {selectedSwapIds.length}/4 seleccionada{selectedSwapIds.length > 1 ? 's' : ''}
                </span>
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

      {showOfferModal && producto && (
        <div className="offer-modal-backdrop" onClick={() => setShowOfferModal(false)}>
          <div className="offer-modal-card" onClick={e => e.stopPropagation()}>
            <div className="offer-modal-header">
              <h3 className="offer-modal-title">Hacer una oferta</h3>
              <button className="offer-modal-close-btn" onClick={() => setShowOfferModal(false)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
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
