import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import PendingRequestsInbox from '../components/PendingRequestsInbox/PendingRequestsInbox';

export default function RequestsPage({ session }: { session: Session | null }) {
  const navigate = useNavigate();

  if (!session) {
    navigate('/login');
    return null;
  }

  return (
    <section className="profile-section">
      <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '1.5rem' }}>
        ←
      </button>
      <h2 className="profile-title" style={{ marginBottom: '1.5rem' }}>
        Solicitudes de seguimiento
      </h2>
      <PendingRequestsInbox session={session} />
    </section>
  );
}
