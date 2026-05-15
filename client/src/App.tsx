import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Importación de Páginas
import Home from './pages/home';
import UserProfile from './pages/userProfile';
import ProductDetail from './pages/productDetails';
import Profile from './pages/profiles';
import Login from './pages/login';
import RequestsPage from './pages/RequestsPage';
import Notifications from './pages/Notifications/Notifications';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import FollowListPage from './pages/FollowListPage';
import ChatsPage from './pages/ChatsPage';
import ChatWindowPage from './pages/ChatWindowPage';
import Checkout from './pages/Checkout/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel/CheckoutCancel';
import PaymentProcessing from './pages/PaymentProcessing/PaymentProcessing';
import Orders from './pages/Orders/Orders';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// Componentes globales
import Navbar from './components/navbar';
import Footer from './components/Footer/Footer';
import BannedScreen from './components/BannedScreen/BannedScreen';
import { checkIsAdmin } from './services/adminService';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

  return (
    <button
      className={`scroll-top-btn${visible ? ' scroll-top-btn--visible' : ''}`}
      onClick={scrollUp}
      aria-label="Volver arriba"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

function AppLayout({ session, isAdmin }: { session: Session | null; isAdmin: boolean }) {
  const location = useLocation();
  const hideFooter = location.pathname === '/login';

  return (
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

          <Route path="/checkout/success"    element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel"     element={<CheckoutCancel />} />
          <Route path="/checkout/payment"    element={<PaymentProcessing />} />
          <Route path="/checkout/:productId" element={<Checkout session={session} />} />

          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/perfil" element={session ? <Profile session={session} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={session ? <Notifications session={session} /> : <Navigate to="/login" />} />
          <Route path="/pedidos" element={session ? <Orders session={session} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAdmin ? <AdminPanel session={session} /> : <Navigate to="/" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
      <ScrollToTopButton />
    </div>
  );
}

function App() {
  const [session,   setSession]   = useState<Session | null>(null);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [banReason, setBanReason] = useState<string | null | undefined>(undefined);
  const adminCheckedRef           = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setIsAdmin(false);
      setBanReason(undefined);
      adminCheckedRef.current = null;
      return;
    }

    const userId = session.user.id;

    // Check ban status first (bypass verifyAuth so banned users can still read their reason)
    fetch(`${API_URL}/users/ban-status`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.isBanned) { setBanReason(d.banReason ?? null); return; }
        setBanReason(undefined);
        // Evita llamadas repetidas cuando Supabase refresca el token o dispara
        // múltiples eventos de auth para el mismo usuario.
        if (adminCheckedRef.current !== userId) {
          adminCheckedRef.current = userId;
          checkIsAdmin(session.access_token).then(setIsAdmin);
        }
      })
      .catch(() => setBanReason(undefined));
  }, [session]);

  // Show ban screen if user is banned (covers entire app)
  if (banReason !== undefined && session) {
    return <BannedScreen banReason={banReason} />;
  }

  return (
    <Router>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--ink-800)',
            border: '1px solid var(--ink-700)',
            color: 'var(--bone)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
          },
          className: 'wearify-toast',
        }}
        richColors
        closeButton
      />
      <AppLayout session={session} isAdmin={isAdmin} />
    </Router>
  );
}

export default App;