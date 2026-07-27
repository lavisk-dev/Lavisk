-- ============================================================
-- Migration: 001_create_collections.sql
-- Description: Create the collections domain schema
-- Convention: snake_case, TEXT PKs, TIMESTAMPTZ, IF NOT EXISTS
-- ============================================================

-- +--------------------------------------------+
-- | 1. COLLECTIONS TABLE                        |
-- +--------------------------------------------+

CREATE TABLE IF NOT EXISTS collections (
  id              TEXT        PRIMARY KEY,
  name            TEXT        NOT NULL,
  slug            TEXT        UNIQUE NOT NULL,
  description     TEXT        NOT NULL,
  banner_image    TEXT,
  thumbnail_image TEXT,
  is_active       BOOLEAN     DEFAULT true,
  sort_order      INTEGER     DEFAULT 0,
  seo_title       TEXT,
  seo_description TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- +--------------------------------------------+
-- | 2. INDEXES                                  |
-- +--------------------------------------------+

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug       ON collections (slug);
CREATE        INDEX IF NOT EXISTS idx_collections_is_active  ON collections (is_active);
CREATE        INDEX IF NOT EXISTS idx_collections_sort_order ON collections (sort_order);
CREATE        INDEX IF NOT EXISTS idx_collections_created_at ON collections (created_at DESC);

-- +--------------------------------------------+
-- | 3. PRODUCT RELATIONSHIP (collection_slug)   |
-- |    Option A: products.collection_slug       |
-- |    FK to collections.slug                   |
-- +--------------------------------------------+

ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_products_collection_slug ON products (collection_slug);

-- +--------------------------------------------+
-- | 4. FOREIGN KEY                              |
-- +--------------------------------------------+

DO $$
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_collection_slug'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT fk_products_collection_slug
      FOREIGN KEY (collection_slug) REFERENCES collections (slug)
      ON DELETE SET NULL;
  END IF;
END $$;
-- +--------------------------------------------+
-- | 5. UPDATED_AT TRIGGER                       |
-- +--------------------------------------------+

CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collections_updated_at ON collections;

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();

-- +--------------------------------------------+
-- | 6. ROW LEVEL SECURITY                       |
-- +--------------------------------------------+

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Public: can read active collections
DROP POLICY IF EXISTS "Public can read active collections" ON collections;
CREATE POLICY "Public can read active collections" ON collections
  FOR SELECT
  USING (is_active = true);

-- Authenticated: can read all collections
DROP POLICY IF EXISTS "Authenticated can read collections" ON collections;
CREATE POLICY "Authenticated can read collections" ON collections
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin: full CRUD (service role client bypasses RLS, but policies for direct use)
DROP POLICY IF EXISTS "Admin can insert collections" ON collections;
CREATE POLICY "Admin can insert collections" ON collections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update collections" ON collections;
CREATE POLICY "Admin can update collections" ON collections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete collections" ON collections;
CREATE POLICY "Admin can delete collections" ON collections
  FOR DELETE
  TO authenticated
  USING (true);

-- +--------------------------------------------+
-- | 7. COMMENTS                                 |
-- +--------------------------------------------+

COMMENT ON TABLE  collections                    IS 'Product collections/groups for curated sets';
COMMENT ON COLUMN collections.id                 IS 'Primary key, e.g. "col_1"';
COMMENT ON COLUMN collections.slug               IS 'URL-friendly unique identifier';
COMMENT ON COLUMN collections.banner_image       IS 'Cloudinary URL for the collection banner';
COMMENT ON COLUMN collections.thumbnail_image    IS 'Cloudinary URL for the collection thumbnail';
COMMENT ON COLUMN collections.is_active          IS 'Controls visibility on public site';
COMMENT ON COLUMN collections.sort_order         IS 'Display order (ascending)';
COMMENT ON COLUMN collections.seo_title          IS 'Override for <title> tag';
COMMENT ON COLUMN collections.seo_description    IS 'Override for meta description';

