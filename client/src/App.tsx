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
import RequestsPage from './pages/RequestsPage';
import FollowListPage from './pages/FollowListPage';
import ChatsPage from './pages/ChatsPage';
import ChatWindowPage from './pages/ChatWindowPage';
import Checkout from './pages/Checkout/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess/CheckoutSuccess';

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
            
            <Route path="/producto/:id" element={<ProductDetail session={session} />} />
            
            <Route path="/usuario/:id" element={<UserProfile session={session} />} />
            <Route path="/usuario/:id/seguidores" element={<FollowListPage session={session} mode="followers" />} />
            <Route path="/usuario/:id/siguiendo" element={<FollowListPage session={session} mode="following" />} />
            <Route path="/solicitudes" element={<RequestsPage session={session} />} />
            <Route path="/chats" element={<ChatsPage session={session} />} />
            <Route path="/chats/:conversationId" element={<ChatWindowPage session={session} />} />

            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/:productId" element={<Checkout session={session} />} />
            
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

            <Route 
              path="/perfil" 
              element={session ? <Profile session={session} /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/carrito" 
              element={session ? <Cart /> : <Navigate to="/login" />} 
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;