-- Ampliar la restricción CHECK de notifications para incluir los tipos del ciclo de vida del pedido

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'follow',
    'follow_request',
    'follow_accepted',
    'new_product',
    'price_drop',
    'new_sale',
    'order_shipped',
    'order_received'
  ));
