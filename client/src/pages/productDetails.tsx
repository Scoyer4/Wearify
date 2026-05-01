import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// 1. Añadimos la importación de Session
import { Session } from '@supabase/supabase-js'; 
import { getProductById, getUserById } from '../services/api';
import { Producto } from '../types';
import { useCart } from '../context/cartContext';
import ContactSellerButton from '../components/ContactSellerButton/ContactSellerButton';

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
  // 3. FUNCIONES GUARDIANAS
  // ==========================================
  const handleAñadirAlCarrito = (prod: Producto) => {
    // Si no hay sesión, cortamos la acción y mandamos a registro
    if (!session) {
      alert("¡Hola! Para añadir prendas al carrito necesitas iniciar sesión o crear una cuenta.");
      navigate('/login');
      return; 
    }
    
    // Si hay sesión, dejamos que funcione normal
    añadirAlCarrito(prod);
    alert("¡Añadido al carrito!");
  };

  const handleComprarYa = () => {
    if (!session) {
      alert("Para realizar compras, necesitas iniciar sesión primero.");
      navigate('/login');
      return;
    }
    alert('Simulando redirección a la pasarela de pago...');
  };
  // ==========================================

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
        <div className="detail-image-wrapper">
          {producto.image_url ? (
            <img src={producto.image_url} alt={producto.title} className="detail-image" />
          ) : (
            <div className="detail-placeholder">Sin foto</div>
          )}
        </div>

        <div className="detail-info-wrapper">
          <h2 className="detail-title">{producto.title}</h2>
          <p className="detail-price">{producto.price ? `${producto.price} €` : 'Consultar precio'}</p>
          
          <div className="seller-badge">
            <div className="seller-avatar">👤</div>
            <div>
              <p className="seller-label">Subido por</p>
              <Link to={`/usuario/${producto.seller_id}`} style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent)', textDecoration: 'none' }}>
                @{producto.nombreVendedor}
              </Link>
            </div>
          </div>
          
          {producto.seller_id && (
            <ContactSellerButton
              productId={producto.id}
              sellerId={producto.seller_id}
              productTitle={producto.title}
              productImage={producto.image_url ?? null}
              session={session}
            />
          )}

          <div className="detail-desc-box">
            <h3 className="detail-desc-title">Descripción</h3>
            <p className="detail-desc-text">{producto.description || 'El vendedor no ha añadido una descripción.'}</p>
          </div>

          <div className="detail-tags">
            {producto.brand && <span className="detail-tag">Marca: {producto.brand}</span>}
            {producto.size && <span className="detail-tag">Talla: {producto.size}</span>}
            {producto.condition && <span className="detail-tag">Estado: {producto.condition}</span>}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
            <button 
              className="btn-primary full-width-btn" 
              onClick={() => handleAñadirAlCarrito(producto)}
            >
              Añadir al carrito
            </button>
            
            <button 
              className="btn-pay full-width-btn"
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