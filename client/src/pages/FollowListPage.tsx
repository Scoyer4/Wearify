import { Session } from '@supabase/supabase-js';
import { useParams, useNavigate } from 'react-router-dom';
import FollowList from '../components/FollowList/FollowList';

interface Props {
  session: Session | null;
  mode: 'followers' | 'following';
}

export default function FollowListPage({ session, mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <section className="profile-section">
      <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: '1.5rem' }}>
        ←
      </button>
      <h2 className="profile-title" style={{ marginBottom: '1.5rem' }}>
        {mode === 'followers' ? 'Seguidores' : 'Siguiendo'}
      </h2>
      <FollowList userId={id} mode={mode} session={session} />
    </section>
  );
}
