import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext';

export default function Cart() {
  const { carrito } = useCart();
  const navigate = useNavigate();

  const total = carrito.reduce((total, item) => total + (item.price * item.cantidad), 0);

  return (
    <section className="cart-section">
      <div className="section-header">
        <h2 className="section-title">Tu Carrito de Compra</h2>
      </div>

      {carrito.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">Aún no has añadido nada a tu carrito.</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Ir al catálogo
          </button>
        </div>
      ) : (
        <div className="cart-container-box"> 
          {/* Usamos el estilo que teníais en el App.tsx original */}
          {carrito.map((item) => (
            <div key={item.id} className="cart-item-row">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="cart-item-img" />
              ) : (
                <div className="cart-item-placeholder">Sin foto</div>
              )}
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#666' }}>Cantidad: <strong>{item.cantidad}</strong></p>
                {item.size && <p style={{ margin: 0, color: '#666' }}>Talla: {item.size}</p>}
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {item.price * item.cantidad} €
              </div>
            </div>
          ))}

          <div className="cart-total-section">
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Total a pagar:</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              {total} €
            </span>
          </div>

          <button 
            className="btn-primary full-width-btn"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745', marginTop: '1.5rem', fontSize: '1.2rem', padding: '15px' }}
            onClick={() => alert('¡Simulación de compra completada con éxito!')}
          >
            Proceder al Pago Seguro 🔒
          </button>
        </div>
      )}
    </section>
  );
}