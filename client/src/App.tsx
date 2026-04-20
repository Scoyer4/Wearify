import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Importación de Páginas
import Home from './pages/home';
import UserProfile from './pages/userProfile';
import ProductDetail from './pages/productDetails';
import Profile from './pages/profiles';
import Cart from './pages/cart';
import Login from './pages/login';

// Componentes globales
import Navbar from './components/navbar';
import './App.css';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navbar session={session} /> 
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home session={session} />} />
            
            {/* Detalles del producto (tiene las funciones guardianas que pusimos antes) */}
            <Route path="/producto/:id" element={<ProductDetail session={session} />} />
            
            {/* Escaparate de un vendedor */}
            <Route path="/usuario/:id" element={<UserProfile session={session} />} />
            
            {/* Pantalla de Login (Si ya tienes sesión, te manda al inicio automáticamente) */}
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

            {/* ==========================================
                RUTAS PRIVADAS (Solo usuarios registrados)
                ========================================== */}
            {/* Si intentas ir a tu perfil privado sin sesión, te echa al Login */}
            <Route 
              path="/perfil" 
              element={session ? <Profile session={session} /> : <Navigate to="/login" />} 
            />
            
            {/* Igual con el carrito */}
            <Route 
              path="/carrito" 
              element={session ? <Cart /> : <Navigate to="/login" />} 
            />

            {/* Ruta por defecto por si alguien escribe mal una URL */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;