-- Permitir múltiples productos por propuesta de intercambio (máximo 4)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS swap_product_ids UUID[];
