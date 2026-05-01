import { useState } from 'react';
import { updatePrivacy } from '../../services/followerService';
import '../../styles/PrivacyToggle.css';

interface Props {
  isPrivate: boolean;
  token: string;
  onChange?: (newValue: boolean) => void;
}

export default function PrivacyToggle({ isPrivate, token, onChange }: Props) {
  const [checked, setChecked] = useState(isPrivate);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLoading(true);
    setMessage(null);
    const res = await updatePrivacy(newValue, token);
    if (res) {
      setChecked(newValue);
      onChange?.(newValue);
      if (!newValue && res.promotedCount > 0) {
        const n = res.promotedCount;
        setMessage(`${n} solicitud${n !== 1 ? 'es aceptadas' : ' aceptada'} automáticamente.`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="privacy-toggle">
      <div className="privacy-toggle-row">
        <div className="privacy-toggle-text">
          <p className="privacy-toggle-label">Perfil privado</p>
          <p className="privacy-toggle-hint">
            Si activas el perfil privado, los nuevos seguidores tendrán que solicitar
            permiso para verte y para acceder a tus prendas.
          </p>
        </div>
        <label className={`privacy-switch${loading ? ' privacy-switch--loading' : ''}`}>
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={loading}
          />
          <span className="privacy-switch-track" />
        </label>
      </div>
      {message && <p className="privacy-toggle-message">{message}</p>}
    </div>
  );
}
