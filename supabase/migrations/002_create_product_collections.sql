-- ============================================================
-- Migration: 002_create_product_collections.sql
-- Description: Junction table for many-to-many product<->collection
-- Convention: snake_case, TEXT PKs, TIMESTAMPTZ, IF NOT EXISTS
-- ============================================================

-- +--------------------------------------------+
-- | 1. PRODUCT_COLLECTIONS JUNCTION TABLE       |
-- +--------------------------------------------+

CREATE TABLE IF NOT EXISTS product_collections (
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id  TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  sort_order     INTEGER DEFAULT 0,
  is_primary     BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, collection_id)
);

-- +--------------------------------------------+
-- | 2. INDEXES                                  |
-- +--------------------------------------------+

CREATE INDEX IF NOT EXISTS idx_pc_product_id    ON product_collections (product_id);
CREATE INDEX IF NOT EXISTS idx_pc_collection_id ON product_collections (collection_id);
CREATE INDEX IF NOT EXISTS idx_pc_primary       ON product_collections (product_id, collection_id) WHERE is_primary = true;

-- +--------------------------------------------+
-- | 3. SEED PRIMARY LINKS FROM EXISTING DATA    |
-- +--------------------------------------------+

INSERT INTO product_collections (product_id, collection_id, sort_order, is_primary)
SELECT p.id, c.id, 0, true
FROM products p
JOIN collections c ON p.collection_slug = c.slug
WHERE p.collection_slug IS NOT NULL
ON CONFLICT (product_id, collection_id) DO NOTHING;

-- +--------------------------------------------+
-- | 4. UPDATED_AT TRIGGER                       |
-- +--------------------------------------------+

CREATE OR REPLACE FUNCTION update_product_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pc_update_product_timestamp ON product_collections;
CREATE TRIGGER trg_pc_update_product_timestamp
  AFTER INSERT OR UPDATE OR DELETE ON product_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_product_collections_updated_at();

-- +--------------------------------------------+
-- | 5. ROW LEVEL SECURITY                       |
-- +--------------------------------------------+

ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read product_collections" ON product_collections;
CREATE POLICY "Public can read product_collections" ON product_collections
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can manage product_collections" ON product_collections;
CREATE POLICY "Admin can manage product_collections" ON product_collections
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- +--------------------------------------------+
-- | 6. COMMENTS                                 |
-- +--------------------------------------------+

COMMENT ON TABLE  product_collections               IS 'Many-to-many link between products and collections';
COMMENT ON COLUMN product_collections.sort_order     IS 'Display order within the collection';
COMMENT ON COLUMN product_collections.is_primary     IS 'Whether this is the primary/navigation collection';
