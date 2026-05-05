-- ── Fase 1: Enum de estados del ciclo de vida del pedido ─────────────────────
-- Se usa un nombre de columna distinto (order_status) para no colisionar con
-- la columna status TEXT ya existente en orders.

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM
    ('paid', 'shipped', 'received', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── Fase 2: Añadir columna de ciclo de vida al pedido ─────────────────────────
-- Usa el nuevo enum. DEFAULT 'paid' para todos los pedidos existentes y nuevos.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_status order_status
    NOT NULL DEFAULT 'paid';

-- ── Fase 3: Campos de seguimiento y timestamps de estado ─────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at    TIMESTAMPTZ;

-- ── Fase 4: Índices ───────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_buyer
  ON orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_orders_seller
  ON orders(seller_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(order_status);
