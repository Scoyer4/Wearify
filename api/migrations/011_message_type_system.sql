-- Extend message_type CHECK to include 'system' for automated Wearify messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'offer', 'system'));

-- Update coherence constraint so 'system' messages (like 'text') require no offer fields
ALTER TABLE messages DROP CONSTRAINT IF EXISTS offer_fields_only_on_offer_type;

ALTER TABLE messages
  ADD CONSTRAINT offer_fields_only_on_offer_type
  CHECK (
    (message_type = 'offer'  AND offer_price IS NOT NULL AND offer_status IS NOT NULL)
    OR
    (message_type = 'text'   AND offer_price IS NULL     AND offer_status IS NULL)
    OR
    (message_type = 'system' AND offer_price IS NULL     AND offer_status IS NULL)
  );
