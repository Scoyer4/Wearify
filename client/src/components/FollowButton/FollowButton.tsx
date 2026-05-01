import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useFollow } from '../../hooks/useFollow';
import '../../styles/FollowButton.css';

interface Props {
  userId: string;
  session: Session | null;
}

export default function FollowButton({ userId, session }: Props) {
  const [hovered, setHovered] = useState(false);
  const myId = session?.user.id;
  const { iFollow, follow, unfollow, loading } = useFollow(userId, session);

  if (!myId || myId === userId) return null;

  const handleClick = async () => {
    if (iFollow === 'none') {
      await follow();
    } else {
      const msg =
        iFollow === 'pending'
          ? '¿Cancelar la solicitud de seguimiento?'
          : '¿Dejar de seguir a este usuario?';
      if (window.confirm(msg)) await unfollow();
    }
  };

  const label =
    iFollow === 'accepted' && hovered ? 'Dejar de seguir' :
    iFollow === 'accepted'            ? 'Siguiendo' :
    iFollow === 'pending'             ? 'Solicitado' :
    'Seguir';

  const modifier =
    iFollow === 'accepted' && hovered ? 'danger' :
    iFollow !== 'none'                ? 'outline' :
    'primary';

  return (
    <button
      className={`follow-btn follow-btn--${modifier}`}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={loading}
    >
      {loading ? '···' : label}
    </button>
  );
}
