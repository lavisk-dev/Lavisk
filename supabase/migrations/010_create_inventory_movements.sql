-- 010_create_inventory_movements.sql
-- Creates the inventory_movements table -- immutable audit log.
-- Dependencies: 008_products (FK product_id)
-- Depended upon by: none

BEGIN;

CREATE TABLE IF NOT EXISTS inventory_movements (
    id           TEXT PRIMARY KEY,
    product_id   TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    operation    TEXT NOT NULL CHECK (operation IN (
                     'added', 'removed', 'adjusted', 'sale',
                     'return', 'damaged', 'lost', 'purchase_received'
                 )),
    quantity     INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after  INTEGER NOT NULL,
    reason       TEXT NOT NULL,
    reference    TEXT,
    performed_by TEXT NOT NULL,
    notes        TEXT,
    supplier     TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_movements_product_id ON inventory_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created_at ON inventory_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_movements_operation ON inventory_movements (operation);

COMMENT ON TABLE inventory_movements IS 'Immutable audit log for inventory changes. Current stock lives in inventory table (009).';
COMMENT ON COLUMN inventory_movements.operation IS 'Operation type: added, removed, adjusted, sale, return, damaged, lost, purchase_received.';
COMMENT ON COLUMN inventory_movements.quantity IS 'Change quantity. Positive for additions, negative for removals.';
COMMENT ON COLUMN inventory_movements.stock_before IS 'Snapshot of quantity BEFORE this operation.';
COMMENT ON COLUMN inventory_movements.stock_after IS 'Snapshot of quantity AFTER this operation.';
COMMENT ON COLUMN inventory_movements.reference IS 'External reference (order ID, PO number).';
COMMENT ON COLUMN inventory_movements.performed_by IS 'Admin email or "system".';
COMMENT ON COLUMN inventory_movements.supplier IS 'Supplier name for purchase_received operations.';

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read inventory movements" ON inventory_movements FOR SELECT USING (true);
CREATE POLICY "Admin can insert inventory movements" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

-- DROP TABLE IF EXISTS inventory_movements;

COMMIT;