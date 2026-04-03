import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AuthForm } from './components/AuthForm'
import { Session } from '@supabase/supabase-js'
import { getProducts } from './services/api'
import { CreateProductForm } from './components/CreateProductForm'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [productos, setProductos] = useState<any[]>([])
  const [estadoApi, setEstadoApi] = useState<string>('Cargando...')
  const [vistaActual, setVistaActual] = useState<'productos' | 'perfil'>('productos')
  
  // Controla si el formulario está visible en la pestaña de productos
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // 1. Gestión de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // 2. Carga de productos desde la API de Node.js
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

  // Función para volver al inicio al pulsar el logo
  const irAInicio = () => {
    setVistaActual('productos');
    setMostrarFormulario(false);
  };

  if (!session) {
    return (
      <div className="login-screen">
        <h1 className="logo-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Wearify</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Tu armario de segunda mano. Inicia sesión para entrar.</p>
        <div className="login-box">
          <AuthForm />
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      
      <header className="main-header">
        {/* Logo con función de redirección */}
        <h1 className="logo-title" onClick={irAInicio} style={{ cursor: 'pointer' }}>
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
        </nav>
      </header>

      <main className="main-content">
        
        {/* ======================================= */}
        {/* VISTA 1: PRODUCTOS                      */}
        {/* ======================================= */}
        {vistaActual === 'productos' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem' }}>Ropa de la comunidad</h2>
              <span className="status-badge">{estadoApi}</span>
            </div>

            {/* BOTÓN PARA ABRIR FORMULARIO */}
            <div style={{ marginBottom: '2rem' }}>
              <button 
                onClick={() => setMostrarFormulario(!mostrarFormulario)} 
                className={mostrarFormulario ? "btn-danger" : "btn-primary"}
                style={{ fontSize: '1rem', padding: '12px 24px' }}
              >
                {mostrarFormulario ? '✕ Cancelar subida' : '+ Subir producto'}
              </button>
            </div>

            {/* FORMULARIO DESPLEGABLE */}
            {mostrarFormulario && (
              <div style={{ marginBottom: '3rem', animation: 'fadeIn 0.3s ease' }}>
                <CreateProductForm onProductCreated={async () => {
                  const data = await getProducts();
                  if (data) setProductos(data);
                  setMostrarFormulario(false); // Cerramos tras éxito
                }} />
              </div>
            )}
            
            {/* GRID DE PRODUCTOS */}
            {productos && productos.length > 0 ? (
              <div className="product-grid">
                {productos.map((producto) => (
                  <div key={producto.id} className="product-card">
                    <div className="product-image-wrapper">
                      {producto.image_url ? (
                        <img src={producto.image_url} alt={producto.title} className="product-image" />
                      ) : (
                        <span>Sin foto</span>
                      )}
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>
                        {producto.title || producto.name}
                      </h3>
                      <p className="product-price">{producto.price ? `${producto.price} €` : 'Consultar'}</p>
                      <p className="product-desc" style={{ marginBottom: '0.5rem' }}>
                        {producto.description}
                      </p>
                      {/* Badge de talla si existe */}
                      {producto.size && (
                        <span style={{ fontSize: '0.8rem', background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
                          Talla: {producto.size}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <p style={{ color: '#666', fontSize: '1.2rem' }}>Aún no hay prendas disponibles.</p>
                <button onClick={() => setMostrarFormulario(true)} className="nav-link" style={{ color: '#007bff', fontWeight: 'bold' }}>
                  ¡Sé el primero en subir algo!
                </button>
              </div>
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
                <h2 style={{ fontSize: '1.8rem' }}>Área Personal</h2>
                <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '1.1rem' }}>
                  Sesión activa: <strong>{session.user?.email}</strong>
                </p>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="btn-danger">
                Cerrar Sesión
              </button>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
              <p style={{ color: '#444' }}>
                Bienvenido a tu panel. Desde aquí podrás gestionar tus ventas y favoritos próximamente.
              </p>
              <div style={{ padding: '1rem', border: '1px dashed #ccc', borderRadius: '8px', color: '#888' }}>
                💡 Tip: Puedes volver al catálogo principal haciendo clic en el logo "Wearify" arriba a la izquierda.
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

export default App