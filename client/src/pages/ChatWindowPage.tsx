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
    <div style={{ padding: '2rem 0.75rem 2rem' }}>
      <ChatWindow conversationId={conversationId} session={session} />
    </div>
  );
}
