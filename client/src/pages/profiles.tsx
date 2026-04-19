import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getProducts } from '../services/api';
import { Producto } from '../types';

export default function Profile({ session }: { session: Session }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const navigate = useNavigate();

  // Cargamos productos para filtrar los que pertenecen al usuario logueado
  useEffect(() => {
    const fetchProductos = async () => {
      const data = await getProducts();
      if (data) setProductos(data);
    };
    fetchProductos();
  }, []);

  // Lógica de "Mis Productos": filtramos por el ID del usuario actual
  const misProductos = productos.filter((p) => p.seller_id === session?.user?.id);

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
            <div className="empty-dashboard-box">
              <p>Próximamente verás aquí tus productos favoritos.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}