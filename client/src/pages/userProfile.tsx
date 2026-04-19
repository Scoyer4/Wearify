import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProfile, checkIsFollowing, followUser, unfollowUser, getProducts } from '../services/api';
import { Session } from '@supabase/supabase-js';
import { Producto, PerfilPublico } from '../types';

export default function UserProfile({ session }: { session: Session | null }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;
      
      try {
        const dataPerfil = await getPublicProfile(id);
        if (dataPerfil) setPerfil(dataPerfil);

        const dataProductos = await getProducts();
        if (dataProductos) {
          setProductos(dataProductos.filter((p: Producto) => p.seller_id === id));
        }

        if (session?.user?.id && session.user.id !== id) {
          const siguiendo = await checkIsFollowing(session.user.id, id);
          setIsFollowing(siguiendo);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, session]);

  const handleFollowToggle = async () => {
    // 1. Guardas de seguridad absolutas: verificamos session, token, id y perfil
    if (!session || !session.access_token || !session.user || !id) {
      alert("Debes iniciar sesión para seguir a usuarios.");
      return;
    }
    
    // Verificamos que el perfil y sus stats existan antes de hacer nada
    if (!perfil || !perfil.stats) return; 

    setFollowLoading(true);
    const token = session.access_token;

    try {
      if (isFollowing) {
        await unfollowUser(id, token);
        setPerfil({ 
          ...perfil, 
          stats: { 
            ...perfil.stats, 
            followers: Math.max(0, perfil.stats.followers - 1)
          } 
        });
      } else {
        await followUser(id, token);
        setPerfil({ 
          ...perfil, 
          stats: { 
            ...perfil.stats, 
            followers: perfil.stats.followers + 1 
          } 
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error al hacer follow/unfollow:", error);
      alert("Hubo un error al procesar tu solicitud.");
    } finally {
      setFollowLoading(false);
    }
    
  };

  // Pantallas de carga y error
  if (loading) return <p className="loading-text">Cargando perfil...</p>;
  
  if (!perfil) {
    return (
      <div className="empty-state" style={{ marginTop: '3rem' }}>
        <p className="empty-state-text">Usuario no encontrado</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-3">Volver atrás</button>
      </div>
    );
  }

  const esMiPerfil = session?.user?.id === id;

  return (
    <section className="profile-section">
      <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '1rem', borderRadius: '16px' }}>
        ←
      </button>

      <div className="profile-header" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem' }}>
          {perfil.avatar_url ? (
            <img src={perfil.avatar_url} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            "👤"
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h2 className="profile-title">{perfil.username || 'Usuario'}</h2>
          <p className="profile-desc">{perfil.bio || 'Este usuario aún no ha escrito una biografía.'}</p>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontWeight: 'bold', color: '#555' }}>
            <span>👥 {perfil.stats.followers || 0} Seguidores</span>
            <span>👣 {perfil.stats.following || 0} Siguiendo</span>
          </div>
        </div>

        {!esMiPerfil && session && (
          <button 
            onClick={handleFollowToggle} 
            disabled={followLoading}
            className={`action-btn ${isFollowing ? "btn-danger" : "btn-primary"}`}
            style={{ padding: '10px 20px', fontSize: '1.1rem' }}
          >
            {followLoading ? '...' : isFollowing ? 'Dejar de seguir' : '+ Seguir'}
          </button>
        )}
      </div>
      
      <div className="profile-content" style={{ marginTop: '2rem' }}>
        <h3 className="dashboard-title">Armario de {perfil.username}</h3>
        
        {productos.length > 0 ? (
          <div className="product-grid">
            {productos.map((producto) => (
              <div key={producto.id} className="product-card clickable-card" onClick={() => navigate(`/producto/${producto.id}`)}>
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
      </div>
    </section>
  );
}