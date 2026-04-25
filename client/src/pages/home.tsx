import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api';
import { CreateProductForm } from '../components/CreateProductForm';
import { Producto } from '../types';
import { useSearchParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

export default function Home({ session }: { session: Session | null }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [estadoApi, setEstadoApi] = useState('Cargando...');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoriaActiva = searchParams.get('categoria');

  const productosFiltrados = categoriaActiva
    ? productos.filter(p =>
        p.brand === categoriaActiva ||
        p.size === categoriaActiva || 
        p.condition === categoriaActiva)
    : productos;

  const toggleFavorito = (e: React.MouseEvent, id: string) => {
  e.stopPropagation();
  setFavoritos(prev => {
    const nuevo = new Set(prev);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    return nuevo;
  });
};
  
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
        {productosFiltrados.map((producto) => (
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

              <button
                className={`favorite-btn ${favoritos.has(producto.id) ? 'liked' : ''}`}
                onClick={(e) => toggleFavorito(e, producto.id)}
              >
                {favoritos.has(producto.id) ? '❤️' : '🤍'}
              </button>
            </div>

            <div className="product-info">
              <h3 className="product-title">{producto.title || producto.name}</h3>
              <p className="product-price">{producto.price} €</p>

              <div className="chip-row">
                {producto.brand && <span className="chip">{producto.brand}</span>}
                {producto.size && <span className="chip">Talla {producto.size}</span>}
                {producto.condition && (
                  <span className={`chip ${
                    producto.condition === 'Sin usar' ? 'chip-new' :
                    producto.condition === 'Buen estado' ? 'chip-good' : 'chip-used'
                  }`}>
                    {producto.condition}
                  </span>
                )}
              </div>

              {producto.nombreVendedor && (
                <p className="seller-tag">@{producto.nombreVendedor}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}