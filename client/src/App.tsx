import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AuthForm } from './components/AuthForm'
import { Session } from '@supabase/supabase-js'
import { getProducts, getProductById, getUserById } from './services/api'
import { CreateProductForm } from './components/CreateProductForm'
import { Producto } from './types'
import { useCart } from './context/cartContext' // <-- Importamos el hook para usar el carrito
import './App.css'

function App() {
const { añadirAlCarrito, carrito } = useCart();

  const [session, setSession] = useState<Session | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [estadoApi, setEstadoApi] = useState<string>('Cargando...')
  
  const [vistaActual, setVistaActual] = useState<'productos' | 'perfil' | 'detalle' | 'carrito'>('productos')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // 1. Gestión de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // 2. Carga de productos desde la API
  useEffect(() => {
    if (!session) return;
    const fetchDatos = async () => {
      setEstadoApi('Conectando...')
      const data = await getProducts()
      if (data) {
        setProductos(data)
        setEstadoApi('Catálogo actualizado')
      } else {
        setEstadoApi('Error al cargar catálogo')
      }
    }
    fetchDatos()
  }, [session])

  // Lógica de Mis Productos
  const misProductos = productos.filter((p) => p.seller_id === session?.user?.id);

  // Funciones de navegación
  const irAInicio = () => {
    setVistaActual('productos');
    setMostrarFormulario(false);
  };

  // Función MEJORADA para cargar detalle y nombre del vendedor
  const verDetalleProducto = async (id: string) => {
    setVistaActual('detalle');
    setEstadoApi('Cargando detalle...');
    setProductoSeleccionado(null);
    
    const data = await getProductById(id);
    
    if (data) {
      let nombreVendedor = 'Usuario Desconocido';
      
      // NUEVO: Llamamos a nuestro backend en lugar de a Supabase directamente
      if (data.seller_id) {
        const userData = await getUserById(data.seller_id);
        if (userData && userData.username) {
          nombreVendedor = userData.username;
        }
      }

      setProductoSeleccionado({ ...data, nombreVendedor });
      setEstadoApi('Detalle cargado');
    } else {
      setEstadoApi('Error al cargar detalle');
      setProductoSeleccionado({ error: true } as Producto);
    }
  };

  if (!session) {
    return (
      <div className="login-screen">
        <h1 className="logo-title login-logo-large">Wearify</h1>
        <p className="login-subtitle">Tu armario de segunda mano. Inicia sesión para entrar.</p>
        <div className="login-box">
          <AuthForm />
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      
      <header className="main-header">
        <h1 className="logo-title clickable-logo" onClick={irAInicio}>
          Wearify
        </h1>
        
        <nav className="nav-menu">
          <button 
            onClick={() => {
              setVistaActual('productos')
              setMostrarFormulario(false) 
            }}
            className={`nav-link ${vistaActual === 'productos' ? 'active' : ''}`}
          >
            Productos
          </button>
          <button 
            onClick={() => {
              setVistaActual('perfil')
              setMostrarFormulario(false)
            }}
            className={`nav-link ${vistaActual === 'perfil' ? 'active' : ''}`}
          >
            Mi Perfil
          </button>
          <button 
            onClick={() => {
              setVistaActual('carrito')
              setMostrarFormulario(false)
            }}
            className={`nav-link ${vistaActual === 'carrito' ? 'active' : ''}`}
            style={{ fontWeight: 'bold', color: carrito.length > 0 ? '#28a745' : 'inherit' }}
          >
            Carrito ({carrito.reduce((total, item) => total + item.cantidad, 0)})
          </button>
        </nav>
      </header>

      <main className="main-content">
        
        {/* ======================================= */}
        {/* VISTA 1: PRODUCTOS                      */}
        {/* ======================================= */}
        {vistaActual === 'productos' && (
          <section>
            <div className="section-header">
              <h2 className="section-title">Ropa de la comunidad</h2>
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
                <CreateProductForm onProductCreated={async () => {
                  const data = await getProducts();
                  if (data) setProductos(data);
                  setMostrarFormulario(false);
                }} />
              </div>
            )}
            
            {productos && productos.length > 0 ? (
              <div className="product-grid">
                {productos.map((producto) => (
                  <div 
                    key={producto.id} 
                    className="product-card clickable-card"
                    onClick={() => verDetalleProducto(producto.id)}
                  >
                    <div className="product-image-wrapper">
                      {producto.image_url ? (
                        <img src={producto.image_url} alt={producto.title} className="product-image" />
                      ) : (
                        <span className="no-image-text">Sin foto</span>
                      )}
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">
                        {producto.title || producto.name}
                      </h3>
                      <p className="product-price">{producto.price ? `${producto.price} €` : 'Consultar'}</p>
                      <p className="product-desc">
                        {producto.description}
                      </p>
                      {producto.size && (
                        <span className="product-size-badge">
                          Talla: {producto.size}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-state-text">Aún no hay prendas disponibles.</p>
                <button onClick={() => setMostrarFormulario(true)} className="nav-link empty-state-link">
                  ¡Sé el primero en subir algo!
                </button>
              </div>
            )}
          </section>
        )}

        {/* ======================================= */}
        {/* VISTA 1.5: DETALLES DE PRODUCTO         */}
        {/* ======================================= */}
        {vistaActual === 'detalle' && (
          <section className="product-detail-section">
            <button 
              onClick={() => setVistaActual('productos')} 
              className="btn-primary back-btn" 
            >
              ← Volver al catálogo
            </button>

            {productoSeleccionado ? (
              // ARREGLO: Si existe el error, mostramos el mensaje. Si no, la tarjeta.
              productoSeleccionado.error ? (
                <div className="empty-state">
                  <p className="empty-state-text" style={{ color: '#dc3545', fontWeight: 'bold' }}>
                    ⚠️ Error: No se pudo cargar la información del producto.
                  </p>
                  <p style={{ color: '#666' }}>Asegúrate de que el servidor de Node.js esté encendido en la otra terminal.</p>
                </div>
              ) : (
                <div className="detail-container">
                  <div className="detail-image-wrapper">
                    {productoSeleccionado.image_url ? (
                      <img 
                        src={productoSeleccionado.image_url} 
                        alt={productoSeleccionado.title} 
                        className="detail-image"
                      />
                    ) : (
                      <div className="detail-placeholder">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="detail-info-wrapper">
                    <h2 className="detail-title">
                      {productoSeleccionado.title || productoSeleccionado.name}
                    </h2>
                    <p className="detail-price">
                      {productoSeleccionado.price ? `${productoSeleccionado.price} €` : 'Consultar precio'}
                    </p>
                    
                    {/* Tarjeta del vendedor */}
                    <div className="seller-badge">
                      <div className="seller-avatar">👤</div>
                      <div>
                        <p className="seller-label">Subido por</p>
                        <p className="seller-name">@{productoSeleccionado.nombreVendedor}</p>
                      </div>
                    </div>
                    
                    <div className="detail-desc-box">
                      <h3 className="detail-desc-title">Descripción</h3>
                      <p className="detail-desc-text">
                        {productoSeleccionado.description || 'El vendedor no ha añadido una descripción.'}
                      </p>
                    </div>

                    <div className="detail-tags">
                      {productoSeleccionado.brand && (
                        <span className="detail-tag">Marca: {productoSeleccionado.brand}</span>
                      )}
                      {productoSeleccionado.size && (
                        <span className="detail-tag">Talla: {productoSeleccionado.size}</span>
                      )}
                      {productoSeleccionado.condition && (
                        <span className="detail-tag">Estado: {productoSeleccionado.condition}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                      <button 
                        className="btn-primary full-width-btn" 
                        style={{ backgroundColor: '#333', borderColor: '#333' }}
                        onClick={() => añadirAlCarrito(productoSeleccionado)}
                      >
                        Añadir al carrito 🛒
                      </button>
                      
                      <button 
                        className="btn-primary full-width-btn"
                        style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                        onClick={() => alert('Simulando redirección a la pasarela de pago...')}
                      >
                        Comprar ya 💳
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <p className="loading-text">Cargando información del producto...</p>
            )}
          </section>
        )}

        {/* ======================================= */}
        {/* VISTA 2: PERFIL                         */}
        {/* ======================================= */}
        {vistaActual === 'perfil' && (
          <section className="profile-section">
            <div className="profile-header">
              <div>
                <h2 className="profile-title">Área Personal</h2>
                
                <p className="profile-greeting">
                  Hola, <strong>{session?.user?.user_metadata?.username || 'Usuario'}</strong> 👋
                </p>
                
                <p className="profile-email">
                  Email: {session?.user?.email}
                </p>
              </div>
              
              <button onClick={() => supabase.auth.signOut()} className="btn-danger">
                Cerrar Sesión
              </button>
            </div>
            
            <div className="profile-content">
              <p className="profile-desc">
                Bienvenido a tu panel. Desde aquí podrás gestionar tus ventas y favoritos próximamente.
              </p>
              
              <div className="profile-dashboard">
                <div className="dashboard-section">
                  <h3 className="dashboard-title">🛍️ Mis Productos</h3>
                  {misProductos && misProductos.length > 0 ? (
                    <div className="product-grid">
                      {misProductos.map((producto) => (
                        <div 
                          key={producto.id} 
                          className="product-card clickable-card"
                          onClick={() => verDetalleProducto(producto.id)}
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
                            <p className="product-price">{producto.price ? `${producto.price} €` : 'Consultar'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-dashboard-box">
                      <p>Aún no has subido ninguna prenda.</p>
                      <button 
                        onClick={() => { setVistaActual('productos'); setMostrarFormulario(true); }} 
                        className="btn-primary mt-3"
                      >
                        Subir mi primer producto
                      </button>
                    </div>
                  )}
                </div>

                <hr className="dashboard-divider" />

                <div className="dashboard-section">
                  <h3 className="dashboard-title">❤️ Mis Favoritos</h3>
                  <div className="empty-dashboard-box">
                    <p>Próximamente verás aquí los productos que marques como favoritos.</p>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ======================================= */}
        {/* VISTA 4: CARRITO                        */}
        {/* ======================================= */}
        {vistaActual === 'carrito' && (
          <section className="cart-section">
            <div className="section-header">
              <h2 className="section-title">Tu Carrito de Compra</h2>
            </div>

            {carrito.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">Aún no has añadido nada a tu carrito.</p>
                <button 
                  onClick={() => setVistaActual('productos')} 
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Ir al catálogo
                </button>
              </div>
            ) : (
              <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {carrito.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', padding: '1rem 0', alignItems: 'center' }}>
                    
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', backgroundColor: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>Sin foto</div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.title || item.name}</h3>
                      <p style={{ margin: 0, color: '#666' }}>Cantidad: <strong>{item.cantidad}</strong></p>
                      {item.size && <p style={{ margin: 0, color: '#666' }}>Talla: {item.size}</p>}
                    </div>

                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {item.price * item.cantidad} €
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #333', paddingTop: '1.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Total a pagar:</span>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                    {carrito.reduce((total, item) => total + (item.price * item.cantidad), 0)} €
                  </span>
                </div>

                <button 
                  className="btn-primary full-width-btn"
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745', marginTop: '1.5rem', fontSize: '1.2rem', padding: '15px' }}
                  onClick={() => {
                    alert('¡Simulación de compra completada con éxito!');
                    // Aquí en el futuro vaciarías el carrito
                  }}
                >
                  Proceder al Pago Seguro 🔒
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App