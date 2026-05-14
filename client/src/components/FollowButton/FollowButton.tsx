import { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useFollow } from '../../hooks/useFollow';
import { useConfirmModal } from '../../hooks/useConfirmModal';
import { toast } from '../../lib/toast';
import '../../styles/FollowButton.css';

interface Props {
  userId: string;
  session: Session | null;
}

export default function FollowButton({ userId, session }: Props) {
  const [hovered, setHovered] = useState(false);
  const myId = session?.user.id;
  const { iFollow, follow, unfollow, loading } = useFollow(userId, session);
  const { confirm, ModalComponent } = useConfirmModal();

  if (!myId || myId === userId) return null;

  const handleClick = async () => {
    if (iFollow === 'none') {
      await follow();
      toast.success('Ahora sigues a este usuario');
    } else {
      const isPending = iFollow === 'pending';
      const ok = await confirm({
        title: isPending ? '¿Cancelar solicitud?' : '¿Dejar de seguir?',
        message: isPending
          ? '¿Cancelar la solicitud de seguimiento?'
          : '¿Dejar de seguir a este usuario?',
        confirmText: isPending ? 'Cancelar solicitud' : 'Dejar de seguir',
        variant: 'danger',
      });
      if (ok) { await unfollow(); toast.info('Dejaste de seguir a este usuario'); }
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
    <>
      {ModalComponent}
      <button
        className={`follow-btn follow-btn--${modifier}`}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={loading}
      >
        {loading ? '···' : label}
      </button>
    </>
  );
}
