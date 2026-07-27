-- 001_create_categories.sql
-- Creates the categories table — the foundation domain for product classification.
-- Categories are referenced by products via category_slug.
-- Dependencies: none
-- Depended upon by: 008_create_products.sql (FK category_slug)

BEGIN;

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    count           INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    gradient_from   TEXT NOT NULL,
    gradient_to     TEXT NOT NULL,
    blob_color      TEXT NOT NULL,
    image_url       TEXT,
    image_public_id TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE categories IS
    'Product categories (Birthday, Anniversary, Wedding, etc.). Referenced by products.category_slug.';

COMMENT ON COLUMN categories.count IS
    'Cached product count for display. Not automatically maintained — refresh periodically or update on product mutations.';

COMMENT ON COLUMN categories.slug IS
    'URL-friendly identifier. Referenced by products.category_slug as a foreign key.';

COMMENT ON COLUMN categories.is_active IS
    'Soft-disable a category without removing it. Currently unused by the storefront query — reserved for future filtering.';

COMMENT ON COLUMN categories.sort_order IS
    'Display order in admin and storefront navigation. Lower values appear first. Currently unused by the storefront query — reserved for future sorting.';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories"
    ON categories
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert categories"
    ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin can update categories"
    ON categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin can delete categories"
    ON categories
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- No triggers. Categories have no updated_at column (the TS
-- interface defines no timestamps). Category records are
-- write-once, read-often metadata.

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Run these after migration to confirm correctness:
--
-- INSERT INTO categories (id, name, slug, count, gradient_from, gradient_to, blob_color)
-- VALUES ('cat_test', 'Test Category', 'test-category', 0, '#FFE9EF', '#FFDCE6', '#FFB6C9');
--
-- SELECT id, name, slug, count, is_active, sort_order
-- FROM categories WHERE slug = 'test-category';
-- -- Expected: 1 row, name = 'Test Category', count = 0, is_active = true, sort_order = 0
--
-- UPDATE categories SET count = 10 WHERE id = 'cat_test';
-- SELECT count FROM categories WHERE id = 'cat_test';
-- -- Expected: count = 10
--
-- DELETE FROM categories WHERE id = 'cat_test';
-- SELECT * FROM categories WHERE id = 'cat_test';
-- -- Expected: 0 rows
--
-- -- Constraint tests (should fail):
-- INSERT INTO categories (id, name, slug, count, gradient_from, gradient_to, blob_color)
-- VALUES ('cat_fail', 'Fail', 'test-category', 0, '#FFE9EF', '#FFDCE6', '#FFB6C9');
-- -- Expected: ERROR duplicate key value violates unique constraint "categories_slug_unique"
--
-- INSERT INTO categories (id, name, slug, count, gradient_from, gradient_to, blob_color)
-- VALUES ('cat_fail2', 'Fail', 'fail', -1, '#FFE9EF', '#FFDCE6', '#FFB6C9');
-- -- Expected: ERROR new row for relation "categories" violates check constraint "categories_count_check"

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DROP TABLE IF EXISTS categories;

COMMIT;