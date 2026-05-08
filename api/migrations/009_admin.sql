-- Admin & ban fields on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin  boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason text;

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  reported_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  reported_user_id    uuid REFERENCES users(id)    ON DELETE CASCADE,
  reason              text NOT NULL,
  details             text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_has_target
    CHECK (reported_product_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS reports_status_idx     ON reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);
