-- 011_create_product_collections.sql
-- Junction table for N:N secondary collection assignments.
-- Dependencies: 008_products (FK product_id), 007_collections (FK collection_id)
-- Depended upon by: none

BEGIN;

CREATE TABLE IF NOT EXISTS product_collections (
    product_id    TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_collection_id ON product_collections (collection_id);
CREATE INDEX IF NOT EXISTS idx_pc_product_id ON product_collections (product_id);
CREATE INDEX IF NOT EXISTS idx_pc_primary ON product_collections (product_id, collection_id) WHERE is_primary = true;

COMMENT ON TABLE product_collections IS 'Junction table for N:N secondary collection assignments.';
COMMENT ON COLUMN product_collections.product_id IS 'FK to products.id ON DELETE CASCADE.';
COMMENT ON COLUMN product_collections.collection_id IS 'FK to collections.id ON DELETE CASCADE.';
COMMENT ON COLUMN product_collections.sort_order IS 'Display order within the collection.';
COMMENT ON COLUMN product_collections.is_primary IS 'Mirrors products.collection_slug for indexed lookups.';

CREATE OR REPLACE FUNCTION touch_product_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE products SET updated_at = NOW() WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN NULL;
END;
$$;

CREATE TRIGGER product_collections_touch_product
    AFTER INSERT OR DELETE ON product_collections
    FOR EACH ROW EXECUTE FUNCTION touch_product_updated_at();

ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product collections" ON product_collections FOR SELECT USING (true);
CREATE POLICY "Admin can insert product collections" ON product_collections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update product collections" ON product_collections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete product collections" ON product_collections FOR DELETE TO authenticated USING (true);

-- DROP TABLE IF EXISTS product_collections;
-- DROP FUNCTION IF EXISTS touch_product_updated_at;

COMMIT;