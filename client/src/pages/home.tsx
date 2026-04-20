import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api';
import { CreateProductForm } from '../components/CreateProductForm';
import { Producto } from '../types';
import { Session } from '@supabase/supabase-js';

export default function Home({ session }: { session: Session | null }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estadoApi, setEstadoApi] = useState('Cargando...');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const navigate = useNavigate();

  const fetchDatos = async () => {
    setEstadoApi('Conectando...');
    const data = await getProducts();
    if (data) {
      setProductos(data);
      setEstadoApi('Catálogo actualizado');
    } else {
      setEstadoApi('Error al cargar catálogo');
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">¡Hola, {session?.user.user_metadata?.username || 'Coleccionista'}!</h2>
        <span className="status-badge">{estadoApi}</span>
      </div>

      <div className="action-bar">
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)} 
          className={`action-btn ${mostrarFormulario ? "btn-danger" : "btn-primary"}`}
        >
          {mostrarFormulario ? '✕ Cancelar subida' : '+ Subir producto'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-dropdown-container">
          <CreateProductForm onProductCreated={() => {
            fetchDatos();
            setMostrarFormulario(false);
          }} />
        </div>
      )}
      
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
              <h3 className="product-title">{producto.title || producto.name}</h3>
              <p className="product-price">{producto.price} €</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}