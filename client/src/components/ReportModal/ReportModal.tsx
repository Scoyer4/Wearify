import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createReport, REPORT_REASONS_PRODUCT, REPORT_REASONS_USER } from '../../services/reportService';
import './ReportModal.css';

interface Props {
  token: string;
  productId?: string;
  userId?: string;
  targetName: string;
  onClose: () => void;
}

export default function ReportModal({ token, productId, userId, targetName, onClose }: Props) {
  const reasons = productId ? REPORT_REASONS_PRODUCT : REPORT_REASONS_USER;

  const [reason,    setReason]    = useState('');
  const [details,   setDetails]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  async function handleSubmit() {
    if (!reason) return;
    setLoading(true);
    setError('');
    try {
      await createReport(token, { reason, details: details.trim() || undefined, productId, userId });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al enviar el reporte');
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={e => e.stopPropagation()}>
        <div className="rm-handle" />

        {done ? (
          <div className="rm-done">
            <span className="rm-done-icon">
              <svg viewBox="0 0 48 48" width="52" height="52" fill="none">
                <circle cx="24" cy="24" r="23" stroke="var(--brand)" strokeWidth="2" fill="rgba(124,95,255,0.1)"/>
                <polyline points="14,25 21,32 34,17" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h3 className="rm-done-title">Reporte enviado</h3>
            <p className="rm-done-body">Gracias por ayudarnos a mantener la comunidad segura. Revisaremos tu reporte lo antes posible.</p>
            <button className="btn-primary rm-done-btn" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <div className="rm-header">
              <div className="rm-header-text">
                <span className="rm-flag">🚩</span>
                <div>
                  <h3 className="rm-title">Reportar {productId ? 'producto' : 'usuario'}</h3>
                  <p className="rm-subtitle">{targetName}</p>
                </div>
              </div>
              <button className="rm-close" onClick={onClose} aria-label="Cerrar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="rm-body">
              <p className="rm-label">¿Cuál es el motivo?</p>
              <div className="rm-reasons">
                {reasons.map(r => (
                  <button
                    key={r}
                    className={`rm-reason-btn${reason === r ? ' rm-reason-btn--active' : ''}`}
                    onClick={() => setReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <p className="rm-label rm-label--optional">Detalles adicionales <span>(opcional)</span></p>
              <textarea
                className="rm-textarea"
                placeholder="Describe el problema con más detalle…"
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
              />

              {error && <p className="rm-error">{error}</p>}
            </div>

            <div className="rm-footer">
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn-danger" onClick={handleSubmit} disabled={!reason || loading}>
                {loading ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>,
    document.body
  );
}
