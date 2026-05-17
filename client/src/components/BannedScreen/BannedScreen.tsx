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
          <a href={mailtoLink} className="banned-appeal-email">{APPEAL_EMAIL}</a>
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
