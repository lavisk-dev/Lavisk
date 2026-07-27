-- 014_create_order_timeline.sql
-- Immutable audit log for order status transitions.
-- Dependencies: 013_orders (FK order_id)
-- Depended upon by: none

BEGIN;

CREATE TABLE IF NOT EXISTS order_timeline (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    status          TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    note            TEXT,
    performed_by    TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_timeline_created_at ON order_timeline (created_at DESC);

COMMENT ON TABLE order_timeline IS 'Immutable audit log for order status transitions.';
COMMENT ON COLUMN order_timeline.order_id IS 'FK to orders.id ON DELETE CASCADE.';
COMMENT ON COLUMN order_timeline.status IS 'The new status after this transition.';
COMMENT ON COLUMN order_timeline.previous_status IS 'The status before this transition.';
COMMENT ON COLUMN order_timeline.note IS 'Optional admin note.';
COMMENT ON COLUMN order_timeline.performed_by IS '"system", "customer", or admin email.';

ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read order timeline" ON order_timeline FOR SELECT USING (true);
CREATE POLICY "Admin can insert order timeline" ON order_timeline FOR INSERT TO authenticated WITH CHECK (true);

-- DROP TABLE IF EXISTS order_timeline;

COMMIT;