-- 015_create_inventory_alerts.sql
-- Per-product low stock alert thresholds.
-- Dependencies: 008_products (FK product_id UNIQUE)
-- Depended upon by: none
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

CREATE TABLE IF NOT EXISTS inventory_alerts (
    id         TEXT PRIMARY KEY,
    product_id TEXT NOT NULL UNIQUE REFERENCES products (id) ON DELETE CASCADE,
    min_stock  INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_alerts IS 'Per-product low stock alert thresholds.';
COMMENT ON COLUMN inventory_alerts.product_id IS 'FK to products.id ON DELETE CASCADE. UNIQUE -- one per product.';
COMMENT ON COLUMN inventory_alerts.min_stock IS 'Threshold. Alert fires when inventory.quantity <= min_stock.';

CREATE TRIGGER inventory_alerts_updated_at
    BEFORE UPDATE ON inventory_alerts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read inventory alerts" ON inventory_alerts FOR SELECT USING (true);
CREATE POLICY "Admin can insert inventory alerts" ON inventory_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update inventory alerts" ON inventory_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete inventory alerts" ON inventory_alerts FOR DELETE TO authenticated USING (true);

-- DROP TABLE IF EXISTS inventory_alerts;

COMMIT;