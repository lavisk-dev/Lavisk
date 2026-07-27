-- 008_create_products.sql
-- Creates the products table -- the core product catalog.
-- stock lives in the inventory table (009). images is JSONB (Phase 1).
-- Dependencies: 001_categories (FK category_slug), 007_collections (FK collection_slug)
-- Depended upon by: 009_inventory, 010_inventory_movements, 011_product_collections,
--                   012_reviews, 015_inventory_alerts
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

CREATE TABLE IF NOT EXISTS products (
    id              TEXT PRIMARY KEY,
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    story           TEXT NOT NULL DEFAULT '',
    price           NUMERIC NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC CHECK (compare_at_price >= 0),
    tag             TEXT,
    category_slug   TEXT NOT NULL REFERENCES categories (slug),
    collection_slug TEXT REFERENCES collections (slug) ON DELETE SET NULL,
    gradient_from   TEXT NOT NULL,
    gradient_to     TEXT NOT NULL,
    images          JSONB NOT NULL DEFAULT '[]',
    rating          NUMERIC NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count    INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products (category_slug);
CREATE INDEX IF NOT EXISTS idx_products_collection_slug ON products (collection_slug);
CREATE INDEX IF NOT EXISTS idx_products_active_created ON products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_trending ON products (is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);

COMMENT ON TABLE products IS 'Core product catalog. stock is in the inventory table (009). images stored as JSONB (Phase 1).';
COMMENT ON COLUMN products.slug IS 'URL-friendly identifier. UNIQUE.';
COMMENT ON COLUMN products.story IS 'Long-form product story displayed on detail pages.';
COMMENT ON COLUMN products.price IS 'Price in smallest currency unit. Must be >= 0.';
COMMENT ON COLUMN products.compare_at_price IS 'Original price for sale strikethrough display. Null means no sale.';
COMMENT ON COLUMN products.tag IS 'Badge tag (e.g. "Bestseller", "New", "Luxe").';
COMMENT ON COLUMN products.category_slug IS 'FK to categories.slug. Primary category for navigation.';
COMMENT ON COLUMN products.collection_slug IS 'FK to collections.slug ON DELETE SET NULL. Primary collection. Secondary via product_collections junction.';
COMMENT ON COLUMN products.images IS 'Array of image objects stored as JSONB. Phase 1 keeps this denormalized.';
COMMENT ON COLUMN products.rating IS 'Cached average rating. Updated by trigger on reviews table.';
COMMENT ON COLUMN products.review_count IS 'Cached count of approved reviews.';
COMMENT ON COLUMN products.is_active IS 'Controls storefront visibility.';
COMMENT ON COLUMN products.is_featured IS 'Featured on homepage.';
COMMENT ON COLUMN products.is_trending IS 'Marked as trending.';

CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete products" ON products FOR DELETE TO authenticated USING (true);

-- DROP TABLE IF EXISTS products CASCADE;

COMMIT;