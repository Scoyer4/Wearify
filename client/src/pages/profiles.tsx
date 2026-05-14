import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getProductsBySeller, getMyFavorites, getUserById, deleteProduct, updateUserProfile } from '../services/api';
import { getFollowCounts } from '../services/followerService';
import { getUserReviews, ReviewWithReviewer } from '../services/reviewService';
import { Producto, Favorito, FollowCountsResponse } from '../types';
import PrivacyToggle from '../components/PrivacyToggle/PrivacyToggle';
import EditProductModal from '../components/EditProductModal';
import { Pencil, Check, X, Camera } from 'lucide-react';
import '../styles/profiles.css';

type Tab = 'prendas' | 'favoritos' | 'reseñas' | 'ajustes';

export default function Profile({ session }: { session: Session }) {
  const [misProductos, setMisProductos] = useState<Producto[]>([]);
  const [misFavoritos, setMisFavoritos] = useState<Favorito[]>([]);
  const [misReseñas, setMisReseñas] = useState<ReviewWithReviewer[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [counts, setCounts] = useState<FollowCountsResponse>({ followers: 0, following: 0 });
  const [activeTab, setActiveTab] = useState<Tab>('prendas');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  const [username, setUsername] = useState(
    session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Usuario'
  );
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(username);
  const [savingUsername, setSavingUsername] = useState(false);

  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    session.user.user_metadata?.avatar_url as string | undefined
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initial = username[0].toUpperCase();
  const navigate = useNavigate();
  const { confirm, ModalComponent } = useConfirmModal();

  useEffect(() => {
    const fetchDatos = async () => {
      const id = session.user.id;
      const token = session.access_token;

      const [productos, favoritos, userData, countsData, reseñas] = await Promise.all([
        getProductsBySeller(id),
        getMyFavorites(token),
        getUserById(id),
        getFollowCounts(id),
        getUserReviews(id),
      ]);

      if (productos) setMisProductos(productos);
      if (favoritos) setMisFavoritos(favoritos);
      setMisReseñas(reseñas);
      if (userData) {
        setIsPrivate(userData.is_private ?? false);
        if (userData.username) setUsername(userData.username);
        if (userData.avatar_url) setAvatarUrl(userData.avatar_url);
        setBio(userData.bio ?? '');
      }
      if (countsData) setCounts(countsData);
      setLoading(false);
    };
    fetchDatos();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed === username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    const updated = await updateUserProfile({ username: trimmed }, session.access_token);
    if (updated) {
      setUsername(trimmed);
      await supabase.auth.updateUser({ data: { username: trimmed } });
      toast.success('✓ Nombre de usuario guardado');
    } else {
      toast.error('No se pudo guardar el nombre de usuario.');
    }
    setSavingUsername(false);
    setEditingUsername(false);
  };

  const handleSaveBio = async () => {
    if (bioInput === bio) { setEditingBio(false); return; }
    setSavingBio(true);
    const updated = await updateUserProfile({ bio: bioInput.trim() || null }, session.access_token);
    if (updated) {
      setBio(bioInput.trim());
      toast.success('✓ Biografía guardada');
    } else {
      toast.error('No se pudo guardar la biografía.');
    }
    setSavingBio(false);
    setEditingBio(false);
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    const doUpload = async () => {
      const ext  = file.name.split('.').pop();
      const path = `${session.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw new Error('No se pudo subir la foto de perfil.');

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const updated = await updateUserProfile({ avatar_url: publicUrl }, session.access_token);
      if (!updated) throw new Error('No se pudo actualizar la foto de perfil.');

      return publicUrl;
    };

    const p = doUpload();
    toast.promise(p, {
      loading: 'Actualizando foto de perfil…',
      success: '✓ Foto de perfil actualizada',
      error:   (err) => err instanceof Error ? err.message : 'Error al actualizar la foto',
    });

    try {
      const publicUrl = await p;
      setAvatarUrl(publicUrl);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    } catch {
      // el error ya lo muestra toast.promise
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeleteProduct = async (producto: Producto, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: `¿Eliminar "${producto.title}"?`,
      message: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    const deleted = await deleteProduct(producto.id, session.access_token);
    if (deleted) setMisProductos(prev => prev.filter(p => p.id !== producto.id));
    else toast.error('No se pudo eliminar el producto.');
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
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
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
      {ModalComponent}

      {/* ── HERO ── */}
      <div className="my-profile-hero">
        <div className="my-profile-hero-glow" />

        <div className="my-profile-avatar">
          <button
            className="avatar-upload-btn"
            onClick={handleAvatarClick}
            title="Cambiar foto de perfil"
            disabled={uploadingAvatar}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={username} />
              : <span>{initial}</span>
            }
            <div className="avatar-upload-overlay">
              {uploadingAvatar
                ? <span className="avatar-uploading-spinner" />
                : <Camera size={18} />
              }
            </div>
          </button>
          {isPrivate && <span className="my-profile-lock" title="Perfil privado">🔒</span>}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
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
        {(['prendas', 'favoritos', 'reseñas', 'ajustes'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`my-profile-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'prendas'   && `Prendas${!loading ? ` (${misProductos.length})` : ''}`}
            {tab === 'favoritos' && `Favoritos${!loading ? ` (${misFavoritos.length})` : ''}`}
            {tab === 'reseñas'   && `Reseñas${!loading ? ` (${misReseñas.length})` : ''}`}
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

        {activeTab === 'reseñas' && (
          misReseñas.length > 0 ? (
            <div className="reviews-list">
              {misReseñas.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-card-header">
                    <div className="review-card-avatar">
                      {r.reviewer.avatar_url
                        ? <img src={r.reviewer.avatar_url} alt={r.reviewer.username ?? ''} />
                        : <span>{(r.reviewer.username ?? '?')[0].toUpperCase()}</span>
                      }
                    </div>
                    <div className="review-card-meta">
                      <span className="review-card-user">@{r.reviewer.username ?? 'Usuario'}</span>
                      <span className="review-card-date">
                        {new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="review-card-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r.rating ? 'rev-star rev-star--filled' : 'rev-star'}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.product && (
                    <div
                      className="review-card-product"
                      onClick={() => navigate(`/producto/${r.product!.id}`)}
                    >
                      {r.product.image_url
                        ? <img src={r.product.image_url} alt={r.product.title} className="review-card-product-img" />
                        : <div className="review-card-product-img review-card-product-img--placeholder" />
                      }
                      <span className="review-card-product-title">{r.product.title}</span>
                      <svg className="review-card-product-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  )}
                  {r.comment && <p className="review-card-comment" style={{ paddingLeft: 0 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-dashboard-box">
              <p>Aún no tienes reseñas de otros usuarios.</p>
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

              {/* Nombre de usuario editable */}
              <div className="settings-row">
                <div className="settings-row-editable">
                  <p className="settings-row-label">Nombre de usuario</p>
                  {editingUsername ? (
                    <div className="settings-username-edit">
                      <input
                        className="settings-username-input"
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveUsername();
                          if (e.key === 'Escape') setEditingUsername(false);
                        }}
                        autoFocus
                        disabled={savingUsername}
                      />
                      <button
                        className="settings-username-action settings-username-action--confirm"
                        onClick={handleSaveUsername}
                        disabled={savingUsername}
                        title="Guardar"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="settings-username-action settings-username-action--cancel"
                        onClick={() => { setEditingUsername(false); setUsernameInput(username); }}
                        disabled={savingUsername}
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="settings-username-display">
                      <p className="settings-row-value">{username}</p>
                      <button
                        className="settings-username-pencil"
                        onClick={() => { setUsernameInput(username); setEditingUsername(true); }}
                        title="Editar nombre de usuario"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Biografía editable */}
              <div className="settings-row">
                <div className="settings-row-editable">
                  <p className="settings-row-label">Biografía</p>
                  {editingBio ? (
                    <div className="settings-bio-edit">
                      <textarea
                        className="settings-bio-input"
                        value={bioInput}
                        onChange={e => setBioInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') setEditingBio(false); }}
                        placeholder="Escribe algo sobre ti..."
                        maxLength={160}
                        rows={3}
                        autoFocus
                        disabled={savingBio}
                      />
                      <div className="settings-bio-actions">
                        <span className="settings-bio-counter">{bioInput.length}/160</span>
                        <button
                          className="settings-username-action settings-username-action--confirm"
                          onClick={handleSaveBio}
                          disabled={savingBio}
                          title="Guardar"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          className="settings-username-action settings-username-action--cancel"
                          onClick={() => { setEditingBio(false); setBioInput(bio); }}
                          disabled={savingBio}
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="settings-username-display">
                      <p className="settings-row-value">{bio || 'Sin biografía'}</p>
                      <button
                        className="settings-username-pencil"
                        onClick={() => { setBioInput(bio); setEditingBio(true); }}
                        title="Editar biografía"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Correo electrónico (solo lectura) */}
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
