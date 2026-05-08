-- Add message column for admin deletion notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;

-- Extend the type CHECK constraint to include product_deleted
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

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
    'order_received',
    'product_deleted'
  ));
