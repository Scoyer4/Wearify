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
import Notifications from './pages/Notifications/Notifications';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import FollowListPage from './pages/FollowListPage';
import ChatsPage from './pages/ChatsPage';
import ChatWindowPage from './pages/ChatWindowPage';
import Checkout from './pages/Checkout/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess/CheckoutSuccess';
import PaymentProcessing from './pages/PaymentProcessing/PaymentProcessing';
import Orders from './pages/Orders/Orders';

// Componentes globales
import Navbar from './components/navbar';
import Footer from './components/Footer/Footer';
import BannedScreen from './components/BannedScreen/BannedScreen';
import { checkIsAdmin } from './services/adminService';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [session,   setSession]   = useState<Session | null>(null);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [banReason, setBanReason] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(false); setBanReason(undefined); return; }

    // Check ban status first (bypass verifyAuth so banned users can still read their reason)
    fetch(`${API_URL}/users/ban-status`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.isBanned) { setBanReason(d.banReason ?? null); return; }
        setBanReason(undefined);
        checkIsAdmin(session.access_token).then(setIsAdmin);
      })
      .catch(() => setBanReason(undefined));
  }, [session]);

  // Show ban screen if user is banned (covers entire app)
  if (banReason !== undefined && session) {
    return <BannedScreen banReason={banReason} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar session={session} isAdmin={isAdmin} /> 
        
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

            <Route path="/checkout/success"   element={<CheckoutSuccess />} />
            <Route path="/checkout/payment"   element={<PaymentProcessing />} />
            <Route path="/checkout/:productId" element={<Checkout session={session} />} />

            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />

            <Route
              path="/perfil"
              element={session ? <Profile session={session} /> : <Navigate to="/login" />}
            />

            <Route
              path="/notifications"
              element={session ? <Notifications session={session} /> : <Navigate to="/login" />}
            />

            <Route
              path="/pedidos"
              element={session ? <Orders session={session} /> : <Navigate to="/login" />}
            />

            <Route
              path="/carrito"
              element={session ? <Cart /> : <Navigate to="/login" />}
            />

            <Route
              path="/admin"
              element={isAdmin ? <AdminPanel session={session} /> : <Navigate to="/" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;