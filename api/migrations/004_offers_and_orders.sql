-- ── Fase 1: Añadir campos de oferta a mensajes existentes ─────────────────────

-- 1. Nuevas columnas en messages para soportar mensajes de tipo oferta
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'offer')),
  ADD COLUMN IF NOT EXISTS offer_price  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS offer_status TEXT
    CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'countered'));

-- 2. Constraint de coherencia: campos de oferta solo válidos en mensaje tipo 'offer'
ALTER TABLE messages
  ADD CONSTRAINT offer_fields_only_on_offer_type
    CHECK (
      (message_type = 'offer' AND offer_price IS NOT NULL AND offer_status IS NOT NULL)
      OR
      (message_type = 'text'  AND offer_price IS NULL     AND offer_status IS NULL)
    );

-- 3. Índice parcial para encontrar rápido la oferta activa de una conversación
CREATE INDEX IF NOT EXISTS idx_messages_offer_pending
  ON messages(conversation_id, offer_status)
  WHERE message_type = 'offer' AND offer_status = 'pending';

-- ── Fase 2: Completar tabla orders ────────────────────────────────────────────
-- Columnas existentes: id, buyer_id, product_id, status, price_at_purchase, created_at
-- Falta: seller_id (para saber quién vendió sin tener que hacer JOIN a products)
-- Nota: price_at_purchase ya cubre el papel de final_price (precio real pagado)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE SET NULL;
