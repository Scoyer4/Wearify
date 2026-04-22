import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// 1. Añadimos la importación de Session
import { Session } from '@supabase/supabase-js'; 
import { getProductById, getUserById } from '../services/api';
import { Producto } from '../types';
import { useCart } from '../context/cartContext';

// 2. Le decimos al componente que ahora recibe la sesión
export default function ProductDetail({ session }: { session: Session | null }) { 
  const { id } = useParams();
  const navigate = useNavigate();
  const { añadirAlCarrito } = useCart();
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          if (userData && userData.username) {
            nombreVendedor = userData.username;
          }
        }

        setProducto({ ...data, nombreVendedor });
      } else {
        setError(true);
      }
      setLoading(false);
    };

    cargarDetalle();
  }, [id]);

  // ==========================================
  // 3. NUEVAS FUNCIONES GUARDIANAS
  // ==========================================
  const handleAñadirAlCarrito = (prod: Producto) => {
    // Si no hay sesión, cortamos la acción y mandamos a registro
    if (!session) {
      alert("¡Hola! Para añadir prendas al carrito necesitas iniciar sesión o crear una cuenta.");
      navigate('/login'); // Cambia '/login' por la ruta real de tu formulario (ej. '/auth' o '/')
      return; 
    }
    
    // Si hay sesión, dejamos que funcione normal
    añadirAlCarrito(prod);
    alert("¡Añadido al carrito!");
  };

  const handleComprarYa = () => {
    if (!session) {
      alert("Para realizar compras, necesitas iniciar sesión primero.");
      navigate('/login'); // Cambia esta ruta a tu pantalla de auth
      return;
    }
    alert('Simulando redirección a la pasarela de pago...');
  };
  // ==========================================

  if (loading) {
    return <section className="product-detail-section"><p className="loading-text">Cargando información del producto...</p></section>;
  }

  if (error || !producto) {
    return (/* ... tu código de error se mantiene igual ... */
      <section className="product-detail-section">
        <button onClick={() => navigate(-1)} className="btn-primary back-btn">← Volver</button>
        <div className="empty-state">
          <p className="empty-state-text" style={{ color: '#dc3545', fontWeight: 'bold' }}>
            ⚠️ Error: No se pudo cargar la información del producto.
          </p>
          <p style={{ color: '#666' }}>Asegúrate de que el servidor de Node.js esté encendido.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-section">
      <button onClick={() => navigate(-1)} className="back-btn" style={{ borderRadius: '16px' }}>←</button>

      <div className="detail-container">
        <div className="detail-image-wrapper">
          {producto.image_url ? (
            <img src={producto.image_url} alt={producto.title} className="detail-image" />
          ) : (
            <div className="detail-placeholder">Sin foto</div>
          )}
        </div>

        <div className="detail-info-wrapper">
          <h2 className="detail-title">{producto.title || producto.name}</h2>
          <p className="detail-price">{producto.price ? `${producto.price} €` : 'Consultar precio'}</p>
          
          <div className="seller-badge" style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px', marginTop: '1rem' }}>
            <div className="seller-avatar" style={{ fontSize: '2rem' }}>👤</div>
            <div>
              <p className="seller-label" style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Subido por</p>
              <Link to={`/usuario/${producto.seller_id}`} style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem', color: '#007bff', textDecoration: 'none' }}>
                @{producto.nombreVendedor}
              </Link>
            </div>
          </div>
          
          <div className="detail-desc-box">
            <h3 className="detail-desc-title">Descripción</h3>
            <p className="detail-desc-text">{producto.description || 'El vendedor no ha añadido una descripción.'}</p>
          </div>

          <div className="detail-tags">
            {producto.brand && <span className="detail-tag">Marca: {producto.brand}</span>}
            {producto.size && <span className="detail-tag">Talla: {producto.size}</span>}
            {producto.condition && <span className="detail-tag">Estado: {producto.condition}</span>}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            {/* 4. CAMBIAMOS LOS ONCLICK PARA USAR LOS GUARDIANES */}
            <button 
              className="btn-primary full-width-btn" 
              style={{ backgroundColor: '#333', borderColor: '#333' }}
              onClick={() => handleAñadirAlCarrito(producto)}
            >
              Añadir al carrito
            </button>
            
            <button 
              className="btn-primary full-width-btn"
              style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
              onClick={handleComprarYa}
            >
              Comprar ya
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}