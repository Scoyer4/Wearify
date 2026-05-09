-- Agrupa todas las órdenes generadas por el mismo intercambio
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS swap_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_swap_group_id ON orders(swap_group_id)
  WHERE swap_group_id IS NOT NULL;
