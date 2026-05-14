import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '../lib/toast';
import { getProducts, addFavorite, removeFavorite, getMyFavorites, getCategories } from '../services/api';
import { CreateProductForm } from '../components/CreateProductForm';
import Marquee from '../components/Marquee';
import { Producto, Favorito, Categoria } from '../types';
import { Session } from '@supabase/supabase-js';

const SHOE_KEYWORDS   = ['zapato', 'zapatilla', 'calzado', 'bota', 'sandalia', 'sneaker'];
const ACCESS_KEYWORDS = ['accesorio', 'bolso', 'bolsa', 'gorra', 'cinturón', 'cinturon',
                         'sombrero', 'joya', 'bisutería', 'bisuteria', 'complemento', 'gorro'];
const SUIT_KEYWORDS   = ['traje'];

function getSizeOptions(cat: Categoria | undefined): string[] {
  if (!cat) return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const text = `${cat.name} ${cat.slug ?? ''}`.toLowerCase();
  if (SHOE_KEYWORDS.some(k => text.includes(k)))   return ['35','36','37','38','39','40','41','42','43','44','45','46'];
  if (ACCESS_KEYWORDS.some(k => text.includes(k))) return ['Única'];
  if (SUIT_KEYWORDS.some(k => text.includes(k)))   return ['36','38','40','42','44','46','48','50'];
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
}

function getSizeOptionsFromSearch(search: string): string[] {
  const text = search.toLowerCase();
  if (SHOE_KEYWORDS.some(k => text.includes(k)))   return ['35','36','37','38','39','40','41','42','43','44','45','46'];
  if (ACCESS_KEYWORDS.some(k => text.includes(k))) return ['Única'];
  if (SUIT_KEYWORDS.some(k => text.includes(k)))   return ['36','38','40','42','44','46','48','50'];
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
}

function ProductImage({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="img-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="product-image"
      onError={() => setError(true)}
    />
  );
}

function getCondicionChip(condition?: string) {
  if (!condition) return '';
  if (condition === 'Sin usar' || condition === 'Como nuevo') return 'chip-new';
  if (condition === 'Excelente' || condition === 'Buen estado') return 'chip-good';
  return 'chip-used';
}

export default function Home({ session }: { session: Session | null }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroTalla, setFiltroTalla] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('');
  const [filtroOrden, setFiltroOrden] = useState('');
  const [filtroPrecioMin, setFiltroPrecioMin] = useState('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoriaActiva = searchParams.get('categoria');
  const catIdActivo     = searchParams.get('catId');
  const ordenActivo     = searchParams.get('orden')    ?? '';
  const searchActivo    = searchParams.get('search')   ?? '';

  const selectedCategory = catIdActivo
    ? categories.find(c => c.id === parseInt(catIdActivo))
    : undefined;

  const sizeOptions = useMemo(
    () => selectedCategory ? getSizeOptions(selectedCategory) : getSizeOptionsFromSearch(filtroBusqueda),
    [selectedCategory, filtroBusqueda]
  );

  useEffect(() => {
    setFiltroOrden(ordenActivo);
    setFiltroBusqueda(searchActivo);
  }, [ordenActivo, searchActivo]);

  useEffect(() => {
    setFiltroTalla('');
  }, [catIdActivo]);

  useEffect(() => {
    if (filtroTalla && !sizeOptions.includes(filtroTalla)) setFiltroTalla('');
  }, [sizeOptions, filtroTalla]);

  const marcasUnicas = useMemo(
    () => [...new Set(productos.map(p => p.brand).filter(Boolean) as string[])].sort(),
    [productos]
  );
  const productosDisponibles = productos.filter(p => !p.status || p.status === 'Disponible');

  const CINCO_DIAS = 5 * 24 * 60 * 60 * 1000;
  const esNuevo = (p: Producto) =>
    !(p.is_sold || p.status === 'Vendido') &&
    Date.now() - new Date(p.created_at ?? 0).getTime() < CINCO_DIAS;

  const productosRecientes = productos.filter(esNuevo).slice(0, 6);

  const hayFiltrosActivos = !!(categoriaActiva || catIdActivo || filtroBusqueda || filtroTalla || filtroCondicion || filtroOrden || filtroPrecioMin || filtroPrecioMax || filtroGenero || filtroMarca);

  const productosFiltrados = productos
    .filter(p => {
      if (categoriaActiva) {
        const q = categoriaActiva.toLowerCase();
        if (
          p.gender?.toLowerCase() !== q &&
          p.brand?.toLowerCase() !== q &&
          p.size?.toLowerCase() !== q &&
          p.condition?.toLowerCase() !== q
        ) return false;
      }
      if (catIdActivo && p.category_id !== parseInt(catIdActivo)) return false;
      if (filtroBusqueda) {
        const q = filtroBusqueda.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) return false;
      }
      if (filtroGenero && p.gender?.toLowerCase() !== filtroGenero.toLowerCase()) return false;
      if (filtroMarca && p.brand !== filtroMarca) return false;
      if (filtroTalla && p.size !== filtroTalla) return false;
      if (filtroCondicion && p.condition !== filtroCondicion) return false;
      if (filtroPrecioMin !== '' && p.price < parseFloat(filtroPrecioMin)) return false;
      if (filtroPrecioMax !== '' && p.price > parseFloat(filtroPrecioMax)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filtroOrden === 'precio-asc')  return a.price - b.price;
      if (filtroOrden === 'precio-desc') return b.price - a.price;
      if (filtroOrden === 'reciente')    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      if (filtroOrden === 'favoritos')   return (b.favorites_count ?? 0) - (a.favorites_count ?? 0);
      return 0;
    });

  const limpiarFiltros = () => {
    setFiltroBusqueda('');
    setFiltroTalla('');
    setFiltroCondicion('');
    setFiltroOrden('');
    setFiltroPrecioMin('');
    setFiltroPrecioMax('');
    setFiltroGenero('');
    setFiltroMarca('');
    if (categoriaActiva || catIdActivo || ordenActivo || searchActivo) navigate('/');
  };

  const showOwnProductToast = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.warning('No puedes añadir tu propio producto a favoritos');
  };

  const toggleFavorito = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!session) {
      toast.warning('Inicia sesión para guardar favoritos.');
      navigate('/login');
      return;
    }
    const token = session.access_token;
    const nuevoSet = new Set(favoritos);
    const adding = !nuevoSet.has(id);
    if (adding) {
      nuevoSet.add(id);
      toast.success('Añadido a favoritos');
    } else {
      nuevoSet.delete(id);
      toast.info('Eliminado de favoritos');
    }
    setFavoritos(nuevoSet);
    setProductos(prev => prev.map(p =>
      p.id === id
        ? { ...p, favorites_count: Math.max(0, (p.favorites_count ?? 0) + (adding ? 1 : -1)) }
        : p
    ));
    if (adding) {
      await addFavorite(id, token);
    } else {
      await removeFavorite(id, token);
    }
  };

  const fetchDatos = useCallback(async () => {
    setCargando(true);
    const data = await getProducts();
    if (data) setProductos(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

  useEffect(() => {
    const cargarFavoritos = async () => {
      if (session?.access_token) {
        const data = await getMyFavorites(session.access_token);
        if (data) setFavoritos(new Set(data.map((fav: Favorito) => fav.product_id)));
      }
    };
    cargarFavoritos();
  }, [session]);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  const renderCard = (producto: Producto) => {
    const vendido    = producto.is_sold || producto.status === 'Vendido';
    const reservado  = !vendido && !!producto.is_reserved;
    const isOwn = !!session && producto.seller_id === session.user.id;
    const liked = favoritos.has(producto.id);
    const count = producto.favorites_count ?? 0;
    return (
    <div
      key={producto.id}
      className={`product-card clickable-card${vendido ? ' product-card--sold' : ''}`}
      onClick={() => navigate(`/producto/${producto.id}`)}
    >
      <div className="product-image-wrapper">
        <ProductImage src={producto.image_url} alt={producto.title} />
        {isOwn ? (
          <button
            className={`favorite-btn favorite-btn--own${count > 0 ? ' favorite-btn--has-count' : ''}`}
            onClick={showOwnProductToast}
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
          >
            <span className="fav-heart">🤍</span>
            {count > 0 && <span className="fav-count">{count}</span>}
          </button>
        ) : (
          <button
            className={`favorite-btn${liked ? ' liked' : ''}${count > 0 ? ' favorite-btn--has-count' : ''}`}
            onClick={(e) => toggleFavorito(e, producto.id)}
          >
            <span className="fav-heart">{liked ? '❤️' : '🤍'}</span>
            {count > 0 && <span className="fav-count">{count}</span>}
          </button>
        )}
        {!vendido && !reservado && esNuevo(producto) && (
          <span className="card-badge badge-new">Nuevo</span>
        )}
        {reservado && (
          <span className="card-badge badge-reserved">Reservado</span>
        )}
        {vendido && (
          <span className="card-badge badge-sold">Vendido</span>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-title">{producto.title}</h3>
        <p className="product-price">{producto.price} €</p>
        <div className="chip-row">
          {producto.brand && <span className="chip">{producto.brand}</span>}
          {producto.size && <span className="chip">Talla {producto.size}</span>}
          {producto.condition && (
            <span className={`chip ${getCondicionChip(producto.condition)}`}>
              {producto.condition}
            </span>
          )}
        </div>
        {producto.nombreVendedor && (
          <p className="seller-tag">@{producto.nombreVendedor}</p>
        )}
      </div>
    </div>
  );
  };

  return (
    <section>

      {/* ── HERO ── */}
      <div className="hero-section">
        <div className="hero-glow" />
        <div className="hero-grid-pattern" />

        <span className="hero-live-badge"><span className="hero-live-dot">●</span> Catálogo en vivo </span>

        <h1 className="hero-title">
          {session
            ? <>¡Hola, <span className="hero-title-accent">{session.user.user_metadata?.username || 'Coleccionista'}</span>!</>
            : <>VISTE DIFERENTE.<br /><span className="hero-title-accent">VENDE DIFERENTE.</span></>}
        </h1>
        <p className="hero-subtitle">
          El marketplace de moda donde cada prenda tiene una segunda oportunidad.
        </p>

        {!cargando && (
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{productosDisponibles.length}</span>
              <span className="hero-stat-label">prendas</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">{marcasUnicas.length}</span>
              <span className="hero-stat-label">marcas</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-num">24-48h</span>
              <span className="hero-stat-label">envío</span>
            </div>
          </div>
        )}

        <button
          className="hero-cta"
          onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Explorar catálogo →
        </button>
      </div>

      <Marquee />

      {/* ── FAB + OVERLAY SUBIR PRODUCTO ── */}
      {session && (
        <button
          className={`fab-upload ${mostrarFormulario ? 'active' : ''}`}
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          aria-label="Subir producto"
          title="Subir producto"
        >
          {mostrarFormulario ? '✕' : '+'}
        </button>
      )}
      {mostrarFormulario && (
        <div
          className="fab-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarFormulario(false); }}
        >
          <div className="fab-panel">
            <button className="fab-panel-close" onClick={() => setMostrarFormulario(false)}>✕</button>
            <CreateProductForm onProductCreated={() => {
              fetchDatos();
              setMostrarFormulario(false);
            }} />
          </div>
        </div>
      )}

      {/* ── RECIÉN AÑADIDO (solo cuando no hay filtros activos) ── */}
      {!cargando && !hayFiltrosActivos && productosRecientes.length > 0 && (
        <div className="section-block">
          <h3 className="section-block-title">Recién añadido</h3>
          <div className="products-scroll">
            {productosRecientes.map(renderCard)}
          </div>
        </div>
      )}

      {/* ── CATÁLOGO ── */}
      <div className="catalog-header" id="catalogo">
        <div>
          <span className="catalog-title">
            {hayFiltrosActivos ? 'Resultados' : 'Todo el catálogo'}
          </span>
          {!cargando && (
            <span className="catalog-count">{productosFiltrados.length} prendas</span>
          )}
        </div>
        <div className="filter-bar">
          <select
            value={filtroGenero}
            onChange={e => setFiltroGenero(e.target.value)}
            className="filter-select"
          >
            <option value="">Género</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Unisex">Unisex</option>
            <option value="Niños">Niños</option>
          </select>
          <select
            value={filtroMarca}
            onChange={e => setFiltroMarca(e.target.value)}
            className="filter-select"
          >
            <option value="">Marca</option>
            {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={filtroTalla}
            onChange={e => setFiltroTalla(e.target.value)}
            className="filter-select"
          >
            <option value="">Talla</option>
            {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filtroCondicion}
            onChange={e => setFiltroCondicion(e.target.value)}
            className="filter-select"
          >
            <option value="">Estado</option>
            <option value="Sin usar">Sin usar</option>
            <option value="Como nuevo">Como nuevo</option>
            <option value="Excelente">Excelente</option>
            <option value="Buen estado">Buen estado</option>
            <option value="Usado">Usado</option>
          </select>
          <div className="filter-price-range">
            <input
              type="number"
              min="0"
              placeholder="Min €"
              value={filtroPrecioMin}
              onChange={e => setFiltroPrecioMin(e.target.value)}
              className="filter-price-input"
            />
            <span className="filter-price-sep">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max €"
              value={filtroPrecioMax}
              onChange={e => setFiltroPrecioMax(e.target.value)}
              className="filter-price-input"
            />
            <span className="filter-price-sep">|</span>
            <button
              className={`filter-price-sort-btn${filtroOrden === 'precio-asc' ? ' active' : ''}`}
              onClick={() => setFiltroOrden(prev => prev === 'precio-asc' ? '' : 'precio-asc')}
              title="Precio ascendente"
            >↑</button>
            <button
              className={`filter-price-sort-btn${filtroOrden === 'precio-desc' ? ' active' : ''}`}
              onClick={() => setFiltroOrden(prev => prev === 'precio-desc' ? '' : 'precio-desc')}
              title="Precio descendente"
            >↓</button>
          </div>
          {hayFiltrosActivos && (
            <button className="filter-clear-btn" onClick={limpiarFiltros}>
              Limpiar ✕
            </button>
          )}
        </div>
      </div>

      {/* ── GRID ── */}
      {cargando ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card">
              <div className="skeleton skeleton-image" />
              <div className="product-info">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-price" />
              </div>
            </div>
          ))}
        </div>
      ) : productosFiltrados.length > 0 ? (
        <div className="product-grid">
          {productosFiltrados.map(renderCard)}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-text">No se encontraron prendas con estos filtros.</p>
          <button className="btn-primary mt-3" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  );
}
