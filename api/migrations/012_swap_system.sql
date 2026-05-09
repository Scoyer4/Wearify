-- ── 012: Sistema de intercambio (swap) ────────────────────────────────────────
-- Añade swap_product_id a messages y actualiza constraints para soportar el
-- nuevo message_type 'swap'.

-- 1. Nueva columna
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS swap_product_id UUID REFERENCES products(id) DEFAULT NULL;

-- 2. Actualizar check de message_type para incluir 'swap'
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'offer', 'system', 'swap'));

-- 3. Actualizar constraint de campos de oferta para soportar swap
ALTER TABLE messages DROP CONSTRAINT IF EXISTS offer_fields_only_on_offer_type;
ALTER TABLE messages
  ADD CONSTRAINT offer_fields_only_on_offer_type CHECK (
    (message_type = 'offer' AND offer_price IS NOT NULL AND offer_status IS NOT NULL AND swap_product_id IS NULL)
    OR (message_type = 'swap'  AND swap_product_id IS NOT NULL AND offer_status IS NOT NULL AND offer_price IS NULL)
    OR (message_type IN ('text', 'system') AND offer_price IS NULL AND offer_status IS NULL AND swap_product_id IS NULL)
  );

-- 4. Índice para búsqueda de swaps pendientes
CREATE INDEX IF NOT EXISTS idx_messages_swap_pending
  ON messages(conversation_id, offer_status)
  WHERE message_type = 'swap' AND offer_status = 'pending';
