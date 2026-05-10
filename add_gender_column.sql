-- Migración: añadir columna gender a la tabla products
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IN ('Mujer', 'Hombre', 'Niños', 'Unisex'));
