-- ── Tabla de conversaciones ──────────────────────────────────────────────────
CREATE TABLE conversations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  buyer_id        UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  seller_id       UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_conversation UNIQUE (buyer_id, seller_id) DEFERRABLE,
  CONSTRAINT chk_no_self_conversation CHECK (buyer_id <> seller_id),
  CONSTRAINT unique_conversation     UNIQUE (product_id, buyer_id, seller_id)
);

-- ── Tabla de mensajes ─────────────────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  content         TEXT        NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_conversations_buyer        ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller       ON conversations(seller_id);
CREATE INDEX idx_conversations_product      ON conversations(product_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation      ON messages(conversation_id);
CREATE INDEX idx_messages_sender            ON messages(sender_id);
CREATE INDEX idx_messages_unread            ON messages(conversation_id, is_read)
  WHERE is_read = FALSE;

-- ── Trigger: actualizar last_message_at al insertar mensaje ───────────────────
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_message_at
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ── RLS (el backend usa service_role, no necesita policies) ───────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
