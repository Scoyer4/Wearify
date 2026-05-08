import { supabase } from '../../lib/supabase';
import './BannedScreen.css';

const APPEAL_EMAIL = 'wearify.apelaciones@gmail.com';

interface Props {
  banReason: string | null;
}

export default function BannedScreen({ banReason }: Props) {
  const subject = encodeURIComponent('Apelación de suspensión de cuenta — Wearify');
  const body    = encodeURIComponent(
    `Hola equipo de Wearify,\n\nMe gustaría apelar la suspensión de mi cuenta.\n\nMotivo indicado: ${banReason ?? 'No especificado'}\n\n[Explica aquí por qué crees que el baneo es incorrecto]\n\nGracias.`
  );
  const mailtoLink = `mailto:${APPEAL_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div className="banned-screen">
      <div className="banned-card">
        <div className="banned-icon">🚫</div>

        <h1 className="banned-title">Cuenta suspendida</h1>
        <p className="banned-subtitle">
          Tu cuenta ha sido suspendida y no puedes acceder a Wearify.
        </p>

        {banReason && (
          <div className="banned-reason">
            <p className="banned-reason-label">Motivo de la suspensión</p>
            <p className="banned-reason-text">"{banReason}"</p>
          </div>
        )}

        <div className="banned-appeal">
          <p className="banned-appeal-text">
            Si crees que esta decisión es incorrecta, puedes ponerte en contacto
            con el equipo de Wearify para apelar la suspensión.
          </p>
          <a href={mailtoLink} className="banned-appeal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Apelar suspensión
          </a>
          <p className="banned-appeal-email">{APPEAL_EMAIL}</p>
        </div>

        <button
          className="banned-signout"
          onClick={() => supabase.auth.signOut()}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
