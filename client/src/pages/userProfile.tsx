import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { getPublicProfile, getProductsBySeller } from '../services/api';
import { useFollow } from '../hooks/useFollow';
import { Producto, PerfilPublico } from '../types';

export default function UserProfile({ session }: { session: Session | null }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  const { iFollow, counts, follow, unfollow, loading: followLoading } = useFollow(id ?? '', session);

  const esMiPerfil = session?.user?.id === id;
  const perfilPrivado = perfil?.is_private && !esMiPerfil && iFollow !== 'accepted';

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      try {
        const dataPerfil = await getPublicProfile(id);
        if (dataPerfil) setPerfil(dataPerfil);

        const dataProductos = await getProductsBySeller(id);
        if (dataProductos) setProductos(dataProductos);
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id]);

  const handleFollowClick = async () => {
    if (!session) { navigate('/login'); return; }
    if (iFollow === 'none') {
      await follow();
    } else {
      const msg = iFollow === 'pending'
        ? '¿Cancelar la solicitud de seguimiento?'
        : '¿Dejar de seguir a este usuario?';
      if (window.confirm(msg)) await unfollow();
    }
  };

  const followLabel =
    iFollow === 'accepted' && hovered ? 'Dejar de seguir' :
    iFollow === 'accepted'            ? 'Siguiendo' :
    iFollow === 'pending'             ? 'Solicitado' :
    '+ Seguir';

  const followModifier =
    iFollow === 'accepted' && hovered ? 'btn-danger' :
    iFollow !== 'none'                ? 'btn-secondary' :
    'btn-primary';

  if (loading) return <p className="loading-text">Cargando perfil...</p>;

  if (!perfil) {
    return (
      <div className="empty-state" style={{ marginTop: '3rem' }}>
        <p className="empty-state-text">Usuario no encontrado</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-3">Volver atrás</button>
      </div>
    );
  }

  return (
    <section className="profile-section">
      <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '1rem', borderRadius: '16px' }}>
        ←
      </button>

      <div className="profile-header" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem' }}>
          {perfil.avatar_url ? (
            <img
              src={perfil.avatar_url}
              alt="Avatar"
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : '👤'}
        </div>

        <div style={{ flex: 1 }}>
          <h2 className="profile-title">{perfil.username || 'Usuario'}</h2>
          {perfil.full_name && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{perfil.full_name}</p>
          )}
          <p className="profile-desc">{perfil.bio || 'Este usuario aún no ha escrito una biografía.'}</p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
            <button
              className="follow-count-btn"
              onClick={() => navigate(`/usuario/${id}/seguidores`)}
            >
              <strong>{counts.followers}</strong>
              <span>Seguidores</span>
            </button>
            <button
              className="follow-count-btn"
              onClick={() => navigate(`/usuario/${id}/siguiendo`)}
            >
              <strong>{counts.following}</strong>
              <span>Siguiendo</span>
            </button>
          </div>
        </div>

        {!esMiPerfil && session && (
          <button
            onClick={handleFollowClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={followLoading}
            className={`action-btn ${followModifier}`}
            style={{ padding: '10px 24px' }}
          >
            {followLoading ? '···' : followLabel}
          </button>
        )}
      </div>

      <div className="profile-content" style={{ marginTop: '2rem' }}>
        {perfilPrivado ? (
          <div className="empty-dashboard-box" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</p>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Este perfil es privado</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Sigue a este usuario para ver sus prendas.
            </p>
          </div>
        ) : (
          <>
            <h3 className="dashboard-title">Armario de {perfil.username}</h3>
            {productos.length > 0 ? (
              <div className="product-grid">
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="product-card clickable-card"
                    onClick={() => navigate(`/producto/${producto.id}`)}
                  >
                    <div className="product-image-wrapper">
                      {producto.image_url ? (
                        <img src={producto.image_url} alt={producto.title} className="product-image" />
                      ) : (
                        <span className="no-image-text">Sin foto</span>
                      )}
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{producto.title}</h3>
                      <p className="product-price">{producto.price} €</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-dashboard-box">
                <p>Este usuario no tiene prendas a la venta actualmente.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
