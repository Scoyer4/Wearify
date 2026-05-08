-- Migration 008: Add new clothing categories

INSERT INTO categories (name, slug) SELECT 'Sudaderas', 'sudaderas' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sudaderas');
INSERT INTO categories (name, slug) SELECT 'Trajes', 'trajes' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Trajes');
INSERT INTO categories (name, slug) SELECT 'Accesorios', 'accesorios' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Accesorios');
INSERT INTO categories (name, slug) SELECT 'Ropa interior', 'ropa-interior' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Ropa interior');
