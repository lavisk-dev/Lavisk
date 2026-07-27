-- 009_create_inventory.sql
-- Creates the inventory table -- single source of truth for stock levels.
-- One row per product. Replaces products.stock (removed in 008).
-- Dependencies: 008_products (FK product_id)
-- Depended upon by: none
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

CREATE TABLE IF NOT EXISTS inventory (
    product_id  TEXT PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory IS 'Single source of truth for product stock levels. One row per product.';
COMMENT ON COLUMN inventory.product_id IS 'FK to products.id ON DELETE CASCADE. One row per product.';
COMMENT ON COLUMN inventory.quantity IS 'Current available stock. Must be >= 0.';

CREATE TRIGGER inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Admin can insert inventory" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update inventory" ON inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete inventory" ON inventory FOR DELETE TO authenticated USING (true);

-- DROP TABLE IF EXISTS inventory;

COMMIT;