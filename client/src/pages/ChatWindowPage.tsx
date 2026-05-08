import { Session } from '@supabase/supabase-js';
import { Navigate, useParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow/ChatWindow';

interface Props {
  session: Session | null;
}

export default function ChatWindowPage({ session }: Props) {
  const { conversationId } = useParams<{ conversationId: string }>();

  if (!session) return <Navigate to="/login" />;
  if (!conversationId) return <Navigate to="/chats" />;

  return (
    <div style={{ padding: '1rem 0.75rem', marginBottom: '-5rem' }}>
      <ChatWindow conversationId={conversationId} session={session} />
    </div>
  );
}
