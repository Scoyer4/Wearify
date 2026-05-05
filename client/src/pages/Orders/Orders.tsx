import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { OrderWithDetails } from '../../types/order';
import { getBuyingOrders, getSellingOrders, receiveOrder, completeOrder } from '../../services/orderService';
import OrderCard from '../../components/OrderCard/OrderCard';
import ShipModal from '../../components/ShipModal/ShipModal';
import './Orders.css';

interface Props {
  session: Session | null;
}

type Tab = 'buying' | 'selling';

export default function Orders({ session }: Props) {
  const navigate = useNavigate();

  const [tab,            setTab]           = useState<Tab>('buying');
  const [buying,         setBuying]        = useState<OrderWithDetails[]>([]);
  const [selling,        setSelling]       = useState<OrderWithDetails[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState<string | null>(null);
  const [shipTarget,     setShipTarget]    = useState<OrderWithDetails | null>(null);
  const [actionLoading,  setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    load();
  }, [session]);

  async function load() {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const [b, s] = await Promise.all([
        getBuyingOrders(session.access_token),
        getSellingOrders(session.access_token),
      ]);
      setBuying(b ?? []);
      setSelling(s ?? []);
    } catch {
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }

  async function handleReceive(orderId: string) {
    if (!session) return;
    setActionLoading(orderId);
    try {
      await receiveOrder(orderId, session.access_token);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al confirmar recepción');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(orderId: string) {
    if (!session) return;
    if (!confirm('¿Confirmar que el pedido está completado?')) return;
    setActionLoading(orderId);
    try {
      await completeOrder(orderId, session.access_token);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al completar el pedido');
    } finally {
      setActionLoading(null);
    }
  }

  function handleShipSuccess(_orderId: string) {
    setShipTarget(null);
    load();
  }

  const orders = tab === 'buying' ? buying : selling;

  return (
    <div className="orders-page">

      <div className="orders-header">
        <h1 className="orders-title">Mis pedidos</h1>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        <button
          className={`orders-tab${tab === 'buying' ? ' orders-tab--active' : ''}`}
          onClick={() => setTab('buying')}
        >
          Mis compras
          {buying.length > 0 && <span className="orders-tab-count">{buying.length}</span>}
        </button>
        <button
          className={`orders-tab${tab === 'selling' ? ' orders-tab--active' : ''}`}
          onClick={() => setTab('selling')}
        >
          Mis ventas
          {selling.length > 0 && <span className="orders-tab-count">{selling.length}</span>}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="orders-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton orders-skeleton-card" />
          ))}
        </div>
      ) : error ? (
        <div className="orders-error">
          <p>{error}</p>
          <button className="btn-secondary" onClick={load}>Reintentar</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <p className="orders-empty-icon">{tab === 'buying' ? '🛍️' : '📦'}</p>
          <p className="orders-empty-title">
            {tab === 'buying' ? 'No tienes compras todavía' : 'No tienes ventas todavía'}
          </p>
          {tab === 'buying' && (
            <button className="btn-primary" onClick={() => navigate('/')}>Ver catálogo</button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              role={tab === 'buying' ? 'buyer' : 'seller'}
              onShipClick={setShipTarget}
              onReceiveClick={handleReceive}
              onCompleteClick={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Ship modal */}
      {shipTarget && session && (
        <ShipModal
          order={shipTarget}
          token={session.access_token}
          onClose={() => setShipTarget(null)}
          onSuccess={handleShipSuccess}
        />
      )}

    </div>
  );
}
