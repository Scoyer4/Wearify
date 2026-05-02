-- ── Fase 1: Dirección de envío en usuarios ────────────────────────────────────
-- Guardamos la dirección en el perfil para pre-rellenar futuros checkouts.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS shipping_name         TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address      TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city         TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country      TEXT DEFAULT 'España';

-- ── Fase 2: Campos de checkout en orders ──────────────────────────────────────
-- Guardamos un snapshot de la dirección y el envío en el momento de la compra.
-- price_at_purchase ya existe (precio base del producto).
-- seller_id ya existe (añadido en migración 004).
-- status ya existe.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_name         TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address      TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city         TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country      TEXT,
  ADD COLUMN IF NOT EXISTS shipping_type         TEXT
    CHECK (shipping_type IN ('standard', 'express')),
  ADD COLUMN IF NOT EXISTS shipping_cost         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_price           NUMERIC(10,2);
-- final_price = price_at_purchase + shipping_cost (calculado en el backend)
