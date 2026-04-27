import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getProductsBySeller, getMyFavorites } from '../services/api';
import { Producto, Favorito } from '../types';

export default function Profile({ session }: { session: Session }) {
  const [misProductos, setMisProductos] = useState<Producto[]>([]);
  const [misFavoritos, setMisFavoritos] = useState<Favorito[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatos = async () => {
      // Cargar los productos del usuario
      if (session?.user?.id) {
        const data = await getProductsBySeller(session.user.id);
        if (data) setMisProductos(data);
      }

      // Cargar los favoritos del usuario
      if (session?.access_token) {
        const favData = await getMyFavorites(session.access_token);
        if (favData) setMisFavoritos(favData);
      }
    };
    fetchDatos();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Al cerrar sesión volvemos a la raíz
  };

  return (
    <section className="profile-section">
      <div className="profile-header">
        <div>
          <h2 className="profile-title">Área Personal</h2>
          <p className="profile-greeting">
            Hola, <strong>{session?.user?.user_metadata?.username || 'Usuario'}</strong> 👋
          </p>
          <p className="profile-email">Email: {session?.user?.email}</p>
        </div>
        <button onClick={handleSignOut} className="btn-danger">
          Cerrar Sesión
        </button>
      </div>
      
      <div className="profile-content">
        <div className="profile-dashboard">
          <div className="dashboard-section">
            <h3 className="dashboard-title">🛍️ Mis Productos</h3>
            {misProductos.length > 0 ? (
              <div className="product-grid">
                {misProductos.map((producto) => (
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
                <p>Aún no has subido ninguna prenda.</p>
                <button onClick={() => navigate('/')} className="btn-primary mt-3">
                  Subir mi primer producto
                </button>
              </div>
            )}
          </div>
          <hr className="dashboard-divider" />
          <div className="dashboard-section">
            <h3 className="dashboard-title">❤️ Mis Favoritos</h3>
            {misFavoritos.length > 0 ? (
              <div className="product-grid">
                {misFavoritos.map((fav) => {
                  const producto = fav.products;
                  if (!producto) return null;
                  return (
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
                  );
                })}
              </div>
            ) : (
              <div className="empty-dashboard-box">
                <p>Aún no has añadido ningún producto a favoritos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}