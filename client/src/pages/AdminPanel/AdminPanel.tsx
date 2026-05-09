import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import {
  getAdminStats, getAdminProducts, adminDeleteProduct,
  getAdminUsers, adminBanUser, adminUnbanUser,
  getAdminReports, adminResolveReport, adminIgnoreReport,
  AdminStats, AdminProduct, AdminUser, AdminReport,
} from '../../services/adminService';
import './AdminPanel.css';

interface Props { session: Session | null }

type Tab = 'products' | 'users' | 'reports';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Delete product modal ───────────────────────────────────────────────────────

function DeleteProductModal({ product, onConfirm, onCancel }: {
  product: AdminProduct;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal" onClick={e => e.stopPropagation()}>
        <h3 className="ap-modal-title">Eliminar producto</h3>
        <p className="ap-modal-body">
          Vas a eliminar <strong>"{product.title}"</strong>. El vendedor recibirá una notificación con el motivo.
          Esta acción no se puede deshacer.
        </p>
        <textarea
          className="ap-modal-textarea"
          placeholder="Motivo de la eliminación…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          maxLength={300}
        />
        <div className="ap-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger" onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()}>
            Eliminar producto
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ban modal ──────────────────────────────────────────────────────────────────

function BanModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal" onClick={e => e.stopPropagation()}>
        <h3 className="ap-modal-title">Banear usuario</h3>
        <p className="ap-modal-body">Indica el motivo del baneo. El usuario no podrá acceder a la plataforma.</p>
        <textarea
          className="ap-modal-textarea"
          placeholder="Motivo del baneo…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          maxLength={300}
        />
        <div className="ap-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger" onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()}>
            Confirmar baneo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resolve modal ──────────────────────────────────────────────────────────────

function ResolveModal({ report, onConfirm, onCancel }: {
  report: AdminReport;
  onConfirm: (action: 'delete_product' | 'ban_user' | 'none', banReason?: string, deleteReason?: string) => void;
  onCancel: () => void;
}) {
  const [action, setAction] = useState<'delete_product' | 'ban_user' | 'none'>('none');
  const [banReason,    setBanReason]    = useState('Incumplimiento de las normas de la comunidad');
  const [deleteReason, setDeleteReason] = useState('Incumplimiento de las normas de la comunidad');

  return (
    <div className="ap-modal-overlay" onClick={onCancel}>
      <div className="ap-modal" onClick={e => e.stopPropagation()}>
        <h3 className="ap-modal-title">Resolver reporte</h3>
        <p className="ap-modal-body">Selecciona la acción a tomar:</p>

        <div className="ap-resolve-options">
          <label className={`ap-resolve-option${action === 'none' ? ' ap-resolve-option--active' : ''}`}>
            <input type="radio" name="action" value="none" checked={action === 'none'} onChange={() => setAction('none')} />
            Solo marcar como resuelto
          </label>
          {report.reported_product && (
            <label className={`ap-resolve-option ap-resolve-option--danger${action === 'delete_product' ? ' ap-resolve-option--active' : ''}`}>
              <input type="radio" name="action" value="delete_product" checked={action === 'delete_product'} onChange={() => setAction('delete_product')} />
              Eliminar producto reportado
            </label>
          )}
          {report.reported_user && (
            <label className={`ap-resolve-option ap-resolve-option--danger${action === 'ban_user' ? ' ap-resolve-option--active' : ''}`}>
              <input type="radio" name="action" value="ban_user" checked={action === 'ban_user'} onChange={() => setAction('ban_user')} />
              Banear usuario reportado
            </label>
          )}
        </div>

        {action === 'delete_product' && (
          <textarea
            className="ap-modal-textarea"
            placeholder="Motivo de la eliminación…"
            value={deleteReason}
            onChange={e => setDeleteReason(e.target.value)}
            rows={2}
            maxLength={300}
          />
        )}

        {action === 'ban_user' && (
          <textarea
            className="ap-modal-textarea"
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            rows={2}
            maxLength={300}
          />
        )}

        <div className="ap-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={() => onConfirm(action, banReason, deleteReason)}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPanel({ session }: Props) {
  const navigate = useNavigate();
  const token    = session?.access_token ?? '';

  const [tab,   setTab]   = useState<Tab>('products');
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Products
  const [products, setProducts]     = useState<AdminProduct[]>([]);
  const [prodTotal, setProdTotal]   = useState(0);
  const [prodPage,  setProdPage]    = useState(1);
  const [prodSearch,setProdSearch]  = useState('');
  const [prodStatus,setProdStatus]  = useState('');
  const [prodLoading,setProdLoading]= useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);

  // Users
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [userTotal,  setUserTotal]  = useState(0);
  const [userPage,   setUserPage]   = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [userLoading,setUserLoading]= useState(false);
  const [banTarget,  setBanTarget]  = useState<AdminUser | null>(null);

  // Reports
  const [reports,     setReports]     = useState<AdminReport[]>([]);
  const [repTotal,    setRepTotal]    = useState(0);
  const [repPage,     setRepPage]     = useState(1);
  const [repFilter,   setRepFilter]   = useState('pending');
  const [repLoading,  setRepLoading]  = useState(false);
  const [resolveTarget, setResolveTarget] = useState<AdminReport | null>(null);

  useEffect(() => {
    if (!session) { navigate('/login'); return; }
    getAdminStats(token).then(setStats).catch(() => navigate('/'));
  }, [session]);

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const r = await getAdminProducts(token, prodPage, prodSearch || undefined, prodStatus || undefined);
      setProducts(r.rows); setProdTotal(r.total);
    } finally { setProdLoading(false); }
  }, [token, prodPage, prodSearch, prodStatus]);

  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const banned = userFilter === 'banned' ? true : userFilter === 'active' ? false : undefined;
      const r = await getAdminUsers(token, userPage, userSearch || undefined, banned);
      setUsers(r.rows); setUserTotal(r.total);
    } finally { setUserLoading(false); }
  }, [token, userPage, userSearch, userFilter]);

  const loadReports = useCallback(async () => {
    setRepLoading(true);
    try {
      const r = await getAdminReports(token, repPage, repFilter || undefined);
      setReports(r.rows); setRepTotal(r.total);
    } finally { setRepLoading(false); }
  }, [token, repPage, repFilter]);

  useEffect(() => { if (tab === 'products') loadProducts(); }, [tab, loadProducts]);
  useEffect(() => { if (tab === 'users')    loadUsers();    }, [tab, loadUsers]);
  useEffect(() => { if (tab === 'reports')  loadReports();  }, [tab, loadReports]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function confirmDeleteProduct(reason: string) {
    if (!deleteTarget) return;
    await adminDeleteProduct(token, deleteTarget.id, reason);
    setDeleteTarget(null);
    loadProducts();
    getAdminStats(token).then(setStats);
  }

  async function handleBan(user: AdminUser) { setBanTarget(user); }

  async function confirmBan(reason: string) {
    if (!banTarget) return;
    await adminBanUser(token, banTarget.id, reason);
    setBanTarget(null);
    loadUsers();
  }

  async function handleUnban(userId: string) {
    await adminUnbanUser(token, userId);
    loadUsers();
  }

  async function confirmResolve(action: 'delete_product' | 'ban_user' | 'none', banReason?: string, deleteReason?: string) {
    if (!resolveTarget) return;
    await adminResolveReport(token, resolveTarget.id, action, {
      productId:    resolveTarget.reported_product?.id,
      userId:       resolveTarget.reported_user?.id,
      banReason,
      deleteReason,
    });
    setResolveTarget(null);
    loadReports();
    getAdminStats(token).then(setStats);
  }

  async function handleIgnore(reportId: string) {
    await adminIgnoreReport(token, reportId);
    loadReports();
    getAdminStats(token).then(setStats);
  }

  const LIMIT = 20;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="ap-page">

      {/* Header */}
      <div className="ap-header">
        <div className="ap-header-title">
          <span className="ap-header-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <h1>Panel de administración</h1>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="ap-stats">
          <div className="ap-stat-card">
            <span className="ap-stat-value">{stats.totalProducts}</span>
            <span className="ap-stat-label">Productos</span>
          </div>
          <div className="ap-stat-card">
            <span className="ap-stat-value">{stats.totalUsers}</span>
            <span className="ap-stat-label">Usuarios</span>
          </div>
          <div className={`ap-stat-card${stats.pendingReports > 0 ? ' ap-stat-card--alert' : ''}`}>
            <span className="ap-stat-value">{stats.pendingReports}</span>
            <span className="ap-stat-label">Reportes pendientes</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ap-tabs">
        {(['products', 'users', 'reports'] as Tab[]).map(t => (
          <button key={t} className={`ap-tab${tab === t ? ' ap-tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'products' ? (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                Productos
              </>
            ) : t === 'users' ? (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Usuarios
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                Reportes
              </>
            )}
          </button>
        ))}
      </div>

      {/* ── Products tab ── */}
      {tab === 'products' && (
        <div className="ap-section">
          <div className="ap-toolbar">
            <input
              className="ap-search"
              placeholder="Buscar por título…"
              value={prodSearch}
              onChange={e => { setProdSearch(e.target.value); setProdPage(1); }}
            />
            <select className="ap-select" value={prodStatus} onChange={e => { setProdStatus(e.target.value); setProdPage(1); }}>
              <option value="">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
            </select>
          </div>

          {prodLoading ? (
            <div className="ap-loading">Cargando…</div>
          ) : (
            <>
              <div className="ap-table-wrapper">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Vendedor</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="ap-product-cell">
                            {p.productImages[0]?.image_url
                              ? <img src={p.productImages[0].image_url} alt={p.title} className="ap-product-thumb" />
                              : <div className="ap-product-thumb ap-product-thumb--placeholder" />
                            }
                            <Link to={`/producto/${p.id}`} className="ap-link">{p.title}</Link>
                          </div>
                        </td>
                        <td>
                          {p.seller
                            ? <Link to={`/usuario/${p.seller.id}`} className="ap-link">{p.seller.username ?? '—'}</Link>
                            : '—'
                          }
                        </td>
                        <td>{p.categories?.name ?? '—'}</td>
                        <td className="ap-price">{p.price.toFixed(2)} €</td>
                        <td>
                          <span className={`ap-badge${p.is_sold ? ' ap-badge--sold' : ' ap-badge--available'}`}>
                            {p.is_sold ? 'Vendido' : p.status}
                          </span>
                        </td>
                        <td className="ap-muted">{formatDate(p.created_at)}</td>
                        <td>
                          <button className="ap-action-btn ap-action-btn--danger" onClick={() => setDeleteTarget(p)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={7} className="ap-empty">No se encontraron productos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ap-pagination">
                <button className="btn-secondary ap-page-btn" disabled={prodPage === 1} onClick={() => setProdPage(p => p - 1)}>← Anterior</button>
                <span className="ap-page-info">Página {prodPage} · {prodTotal} resultados</span>
                <button className="btn-secondary ap-page-btn" disabled={prodPage * LIMIT >= prodTotal} onClick={() => setProdPage(p => p + 1)}>Siguiente →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === 'users' && (
        <div className="ap-section">
          <div className="ap-toolbar">
            <input
              className="ap-search"
              placeholder="Buscar por username…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
            />
            <select className="ap-select" value={userFilter} onChange={e => { setUserFilter(e.target.value); setUserPage(1); }}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="banned">Baneados</option>
            </select>
          </div>

          {userLoading ? (
            <div className="ap-loading">Cargando…</div>
          ) : (
            <>
              <div className="ap-table-wrapper">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Estado</th>
                      <th>Motivo de baneo</th>
                      <th>Registro</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className={u.is_banned ? 'ap-row--banned' : ''}>
                        <td>
                          <div className="ap-user-cell">
                            <div className="ap-avatar">
                              {u.avatar_url
                                ? <img src={u.avatar_url} alt={u.username ?? ''} />
                                : <span>{(u.username ?? '?')[0].toUpperCase()}</span>
                              }
                            </div>
                            <Link to={`/usuario/${u.id}`} className="ap-link">{u.username ?? 'Sin username'}</Link>
                            {u.is_admin && <span className="ap-badge ap-badge--admin">Admin</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`ap-badge${u.is_banned ? ' ap-badge--banned' : ' ap-badge--active'}`}>
                            {u.is_banned ? 'Baneado' : 'Activo'}
                          </span>
                        </td>
                        <td className="ap-muted">{u.ban_reason ?? '—'}</td>
                        <td className="ap-muted">{formatDate(u.created_at)}</td>
                        <td>
                          {u.is_banned
                            ? <button className="ap-action-btn ap-action-btn--success" onClick={() => handleUnban(u.id)}>Desbanear</button>
                            : !u.is_admin && <button className="ap-action-btn ap-action-btn--danger" onClick={() => handleBan(u)}>Banear</button>
                          }
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={5} className="ap-empty">No se encontraron usuarios</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ap-pagination">
                <button className="btn-secondary ap-page-btn" disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)}>← Anterior</button>
                <span className="ap-page-info">Página {userPage} · {userTotal} resultados</span>
                <button className="btn-secondary ap-page-btn" disabled={userPage * LIMIT >= userTotal} onClick={() => setUserPage(p => p + 1)}>Siguiente →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Reports tab ── */}
      {tab === 'reports' && (
        <div className="ap-section">
          <div className="ap-toolbar">
            <select className="ap-select" value={repFilter} onChange={e => { setRepFilter(e.target.value); setRepPage(1); }}>
              <option value="pending">Pendientes</option>
              <option value="resolved">Resueltos</option>
              <option value="ignored">Ignorados</option>
              <option value="">Todos</option>
            </select>
          </div>

          {repLoading ? (
            <div className="ap-loading">Cargando…</div>
          ) : (
            <>
              <div className="ap-reports-list">
                {reports.map(r => (
                  <div key={r.id} className={`ap-report-card ap-report-card--${r.status}`}>
                    <div className="ap-report-header">
                      <div className="ap-report-meta">
                        <span className={`ap-badge ap-badge--${r.status}`}>
                          {r.status === 'pending' ? 'Pendiente' : r.status === 'resolved' ? 'Resuelto' : 'Ignorado'}
                        </span>
                        <span className="ap-muted">{formatDate(r.created_at)}</span>
                        <span className="ap-muted">por {r.reporter?.username ?? 'usuario eliminado'}</span>
                      </div>
                    </div>

                    <div className="ap-report-target">
                      {r.reported_product && (
                        <div className="ap-report-target-item">
                          <span className="ap-report-target-label">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                            Producto:
                          </span>
                          <Link to={`/producto/${r.reported_product.id}`} className="ap-link">{r.reported_product.title}</Link>
                        </div>
                      )}
                      {r.reported_user && (
                        <div className="ap-report-target-item">
                          <span className="ap-report-target-label">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            Usuario:
                          </span>
                          <Link to={`/usuario/${r.reported_user.id}`} className="ap-link">{r.reported_user.username ?? 'Sin username'}</Link>
                        </div>
                      )}
                    </div>

                    <div className="ap-report-reason">
                      <strong>{r.reason}</strong>
                      {r.details && <p className="ap-report-details">{r.details}</p>}
                    </div>

                    {r.status === 'pending' && (
                      <div className="ap-report-actions">
                        <button className="ap-action-btn ap-action-btn--primary" onClick={() => setResolveTarget(r)}>
                          Resolver
                        </button>
                        <button className="ap-action-btn" onClick={() => handleIgnore(r.id)}>
                          Ignorar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="ap-empty-state">No hay reportes en esta categoría</div>
                )}
              </div>
              <div className="ap-pagination">
                <button className="btn-secondary ap-page-btn" disabled={repPage === 1} onClick={() => setRepPage(p => p - 1)}>← Anterior</button>
                <span className="ap-page-info">Página {repPage} · {repTotal} resultados</span>
                <button className="btn-secondary ap-page-btn" disabled={repPage * LIMIT >= repTotal} onClick={() => setRepPage(p => p + 1)}>Siguiente →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {deleteTarget && <DeleteProductModal product={deleteTarget} onConfirm={confirmDeleteProduct} onCancel={() => setDeleteTarget(null)} />}
      {banTarget && <BanModal onConfirm={confirmBan} onCancel={() => setBanTarget(null)} />}
      {resolveTarget && <ResolveModal report={resolveTarget} onConfirm={confirmResolve} onCancel={() => setResolveTarget(null)} />}

    </div>
  );
}
