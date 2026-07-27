-- 007_create_collections.sql
-- Creates the collections table -- curated product groupings.
-- Primary FK target for products.collection_slug and the product_collections junction.
-- Dependencies: none
-- Depended upon by: 008_products (FK collection_slug), 011_product_collections (FK collection_id)
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

CREATE TABLE IF NOT EXISTS collections (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    banner_image    TEXT,
    thumbnail_image TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    seo_title       TEXT,
    seo_description TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections (sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections (is_active);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections (created_at DESC);

-- Comments
COMMENT ON TABLE collections IS 'Curated product groupings. Primary FK target for products.collection_slug and the product_collections junction table.';
COMMENT ON COLUMN collections.slug IS 'URL-friendly identifier. Referenced by products.collection_slug and product_collections.collection_id.';
COMMENT ON COLUMN collections.description IS 'Short description displayed on collection landing pages.';
COMMENT ON COLUMN collections.banner_image IS 'Cloudinary URL for the collection banner. Null uses default.';
COMMENT ON COLUMN collections.thumbnail_image IS 'Cloudinary URL for the collection thumbnail. Null uses default.';
COMMENT ON COLUMN collections.is_active IS 'Controls visibility on the public storefront.';
COMMENT ON COLUMN collections.sort_order IS 'Display order. Lower values appear first.';
COMMENT ON COLUMN collections.seo_title IS 'Override for HTML <title> tag. Null uses default.';
COMMENT ON COLUMN collections.seo_description IS 'Override for meta description tag. Null uses default.';

-- Triggers
CREATE TRIGGER collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read collections"
    ON collections FOR SELECT USING (true);

CREATE POLICY "Admin can insert collections"
    ON collections FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin can update collections"
    ON collections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin can delete collections"
    ON collections FOR DELETE TO authenticated USING (true);

-- Rollback
-- DROP TABLE IF EXISTS collections;

COMMIT;