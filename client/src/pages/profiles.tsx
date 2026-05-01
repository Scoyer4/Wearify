import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getProductsBySeller, getMyFavorites, getUserById, deleteProduct } from '../services/api';
import { getFollowCounts } from '../services/followerService';
import { Producto, Favorito, FollowCountsResponse } from '../types';
import PrivacyToggle from '../components/PrivacyToggle/PrivacyToggle';
import EditProductModal from '../components/EditProductModal';
import '../styles/profiles.css';

type Tab = 'prendas' | 'favoritos' | 'ajustes';

export default function Profile({ session }: { session: Session }) {
  const [misProductos, setMisProductos] = useState<Producto[]>([]);
  const [misFavoritos, setMisFavoritos] = useState<Favorito[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [counts, setCounts] = useState<FollowCountsResponse>({ followers: 0, following: 0 });
  const [activeTab, setActiveTab] = useState<Tab>('prendas');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const navigate = useNavigate();

  const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Usuario';
  const avatarUrl = session.user.user_metadata?.avatar_url as string | undefined;
  const initial = username[0].toUpperCase();

  useEffect(() => {
    const fetchDatos = async () => {
      const id = session.user.id;
      const token = session.access_token;

      const [productos, favoritos, userData, countsData] = await Promise.all([
        getProductsBySeller(id),
        getMyFavorites(token),
        getUserById(id),
        getFollowCounts(id),
      ]);

      if (productos) setMisProductos(productos);
      if (favoritos) setMisFavoritos(favoritos);
      if (userData)  setIsPrivate(userData.is_private ?? false);
      if (countsData) setCounts(countsData);
      setLoading(false);
    };
    fetchDatos();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteProduct = async (producto: Producto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar "${producto.title}"? Esta acción no se puede deshacer.`)) return;
    const ok = await deleteProduct(producto.id, session.access_token);
    if (ok) setMisProductos(prev => prev.filter(p => p.id !== producto.id));
    else alert('No se pudo eliminar el producto.');
  };

  const renderProductCard = (producto: Producto, isOwn = false) => (
    <div
      key={producto.id}
      className="product-card clickable-card"
      onClick={() => navigate(`/producto/${producto.id}`)}
    >
      <div className="product-image-wrapper">
        {producto.image_url
          ? <img src={producto.image_url} alt={producto.title} className="product-image" />
          : <span className="no-image-text">Sin foto</span>
        }
        {isOwn && (
          <div className="product-card-actions" onClick={e => e.stopPropagation()}>
            <button
              className="product-card-action-btn product-card-action-btn--edit"
              title="Editar"
              onClick={e => { e.stopPropagation(); setEditingProduct(producto); }}
            >
              ✏️
            </button>
            <button
              className="product-card-action-btn product-card-action-btn--delete"
              title="Eliminar"
              onClick={e => handleDeleteProduct(producto, e)}
            >
              🗑
            </button>
          </div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-title">{producto.title}</h3>
        <p className="product-price">{producto.price} €</p>
      </div>
    </div>
  );

  return (
    <section className="my-profile">

      {/* ── HERO ── */}
      <div className="my-profile-hero">
        <div className="my-profile-hero-glow" />

        <div className="my-profile-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt={username} />
            : <span>{initial}</span>
          }
          {isPrivate && <span className="my-profile-lock" title="Perfil privado">🔒</span>}
        </div>

        <div className="my-profile-info">
          <h1 className="my-profile-username">{username}</h1>
          <p className="my-profile-email">{session.user.email}</p>
        </div>

        <div className="my-profile-stats">
          <button
            className="my-profile-stat"
            onClick={() => navigate(`/usuario/${session.user.id}/seguidores`)}
          >
            <span className="my-profile-stat-num">{loading ? '—' : counts.followers}</span>
            <span className="my-profile-stat-label">seguidores</span>
          </button>
          <div className="my-profile-stat-sep" />
          <button
            className="my-profile-stat"
            onClick={() => navigate(`/usuario/${session.user.id}/siguiendo`)}
          >
            <span className="my-profile-stat-num">{loading ? '—' : counts.following}</span>
            <span className="my-profile-stat-label">siguiendo</span>
          </button>
          <div className="my-profile-stat-sep" />
          <div className="my-profile-stat">
            <span className="my-profile-stat-num">{loading ? '—' : misProductos.length}</span>
            <span className="my-profile-stat-label">prendas</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="my-profile-tabs">
        {(['prendas', 'favoritos', 'ajustes'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`my-profile-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'prendas'   && `Prendas${!loading ? ` (${misProductos.length})` : ''}`}
            {tab === 'favoritos' && `Favoritos${!loading ? ` (${misFavoritos.length})` : ''}`}
            {tab === 'ajustes'   && 'Ajustes'}
          </button>
        ))}
      </div>

      {/* ── CONTENIDO ── */}
      <div className="my-profile-body">

        {activeTab === 'prendas' && (
          misProductos.length > 0 ? (
            <div className="product-grid">
              {misProductos.map(p => renderProductCard(p, true))}
            </div>
          ) : (
            <div className="empty-dashboard-box">
              <p>Aún no has subido ninguna prenda.</p>
              <button onClick={() => navigate('/')} className="btn-primary mt-3">
                Subir mi primer producto
              </button>
            </div>
          )
        )}

        {activeTab === 'favoritos' && (
          misFavoritos.length > 0 ? (
            <div className="product-grid">
              {misFavoritos.map(fav => {
                const producto = fav.products;
                if (!producto) return null;
                return renderProductCard(producto);
              })}
            </div>
          ) : (
            <div className="empty-dashboard-box">
              <p>Aún no has añadido ningún producto a favoritos.</p>
            </div>
          )
        )}

        {activeTab === 'ajustes' && (
          <div className="my-profile-settings">
            <div className="settings-block">
              <h3 className="settings-block-title">Privacidad</h3>
              <PrivacyToggle
                isPrivate={isPrivate}
                token={session.access_token}
                onChange={setIsPrivate}
              />
            </div>

            <div className="settings-block">
              <h3 className="settings-block-title">Cuenta</h3>
              <div className="settings-row">
                <div>
                  <p className="settings-row-label">Correo electrónico</p>
                  <p className="settings-row-value">{session.user.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut} className="settings-signout-btn">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

      </div>

      {editingProduct && (
        <EditProductModal
          producto={editingProduct}
          token={session.access_token}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setMisProductos(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
            setEditingProduct(null);
          }}
        />
      )}
    </section>
  );
}
