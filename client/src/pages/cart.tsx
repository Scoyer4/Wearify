import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/cartContext';

export default function Cart() {
  const { carrito, eliminarDelCarrito } = useCart();
  const navigate = useNavigate();

  const total = carrito.reduce((sum, item) => sum + item.price, 0);

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
        <div className="cart-layout">

          {/* Lista de productos */}
          <div className="cart-items-list">
            {carrito.map((item) => (
              <div key={item.id} className="cart-item-card">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="cart-item-img" />
                ) : (
                  <div className="cart-item-placeholder">Sin foto</div>
                )}

                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.title}</h3>
                  {item.size && (
                    <p className="cart-item-meta">Talla {item.size}</p>
                  )}
                  {item.brand && (
                    <p className="cart-item-meta">{item.brand}</p>
                  )}
                </div>

                <div className="cart-item-right">
                  <span className="cart-item-price">{item.price} €</span>
                  <button 
                    className="btn-danger" 
                    style={{ marginTop: '0.5rem', padding: '4px 12px', fontSize: '0.85rem' }}
                    onClick={() => eliminarDelCarrito(item.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen lateral */}
          <div className="cart-summary-box">
            <h3 className="cart-summary-title">Resumen del pedido</h3>

            <div className="cart-summary-row">
              <span>Subtotal ({carrito.length} artículos)</span>
              <span>{total} €</span>
            </div>
            <div className="cart-summary-row">
              <span>Envío</span>
              <span className="cart-shipping-free">Gratis</span>
            </div>

            <div className="cart-summary-total">
              <span>Total</span>
              <span>{total} €</span>
            </div>

            <button
              className="btn-pay"
              onClick={() => alert('¡Simulación de compra completada!')}
            >
              Proceder al pago seguro
            </button>

            <p className="cart-safe-note">Pago 100% seguro y cifrado</p>
          </div>

        </div>
      )}
    </section>
  );
}