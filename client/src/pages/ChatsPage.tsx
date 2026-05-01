import { Session } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';
import ChatInbox from '../components/ChatInbox/ChatInbox';

interface Props {
  session: Session | null;
}

export default function ChatsPage({ session }: Props) {
  if (!session) return <Navigate to="/login" />;

  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 0' }}>
      <div className="section-header">
        <h2 className="section-title">Mensajes</h2>
      </div>
      <ChatInbox session={session} />
    </section>
  );
}
