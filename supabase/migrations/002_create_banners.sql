-- 002_create_banners.sql
-- Creates the banners table — homepage hero carousel slides.
-- Also creates the reusable update_timestamp() function used by
-- all subsequent migrations that need updated_at auto-updates.
-- Dependencies: none
-- Depended upon by: none

BEGIN;

-- ============================================================
-- SHARED TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS banners (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    subtitle        TEXT,
    image_url       TEXT,
    image_public_id TEXT,
    cta_label       TEXT,
    cta_href        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

ALTER TABLE banners
    ADD CONSTRAINT banners_cta_both_or_neither
    CHECK (
        (cta_label IS NULL AND cta_href IS NULL)
        OR
        (cta_label IS NOT NULL AND cta_href IS NOT NULL)
    );

-- ============================================================
-- INDEXES
-- ============================================================

-- Covers listActive(): WHERE is_active = true ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_banners_active_sort
    ON banners (is_active, sort_order);

-- Covers listAll(): ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_banners_sort_order
    ON banners (sort_order);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE banners IS
    'Homepage hero carousel slides. Fetched by BannerService.listActive() for the storefront and BannerService.listAll() for the admin panel.';

COMMENT ON COLUMN banners.title IS
    'Headline text displayed on the hero slide (e.g. "Say it with a GIFTED").';

COMMENT ON COLUMN banners.subtitle IS
    'Secondary text displayed below the headline.';

COMMENT ON COLUMN banners.image_url IS
    'Cloudinary or local URL for the slide background image. Null uses the default gradient.';

COMMENT ON COLUMN banners.image_public_id IS
    'Cloudinary public ID for deletion and management. Null if not using Cloudinary.';

COMMENT ON COLUMN banners.cta_label IS
    'Button label (e.g. "Shop the Collection"). Must be paired with cta_href.';

COMMENT ON COLUMN banners.cta_href IS
    'Button link destination (e.g. "/shop"). Must be paired with cta_label.';

COMMENT ON COLUMN banners.is_active IS
    'Controls visibility in the storefront carousel. Used by BannerService.listActive().';

COMMENT ON COLUMN banners.sort_order IS
    'Display order in the carousel. Lower values appear first. Used by both listActive() and listAll().';

COMMENT ON COLUMN banners.updated_at IS
    'Last modification timestamp. Automatically updated by the update_timestamp() trigger.';

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER banners_updated_at
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read banners"
    ON banners
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert banners"
    ON banners
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin can update banners"
    ON banners
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin can delete banners"
    ON banners
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Run these after migration to confirm correctness:
--
-- INSERT INTO banners (id, title, subtitle, cta_label, cta_href, is_active, sort_order)
-- VALUES ('b_test', 'Test Banner', 'Test subtitle', 'Shop Now', '/shop', true, 0);
--
-- SELECT id, title, is_active, sort_order, updated_at
-- FROM banners WHERE id = 'b_test';
-- -- Expected: 1 row, updated_at = current timestamp
--
-- -- Pause briefly, then run:
-- UPDATE banners SET is_active = false WHERE id = 'b_test';
-- SELECT is_active, updated_at FROM banners WHERE id = 'b_test';
-- -- Expected: is_active = false, updated_at > original timestamp
--
-- DELETE FROM banners WHERE id = 'b_test';
-- SELECT * FROM banners WHERE id = 'b_test';
-- -- Expected: 0 rows
--
-- -- CHECK constraint tests (should fail):
-- INSERT INTO banners (id, title, cta_label, is_active, sort_order)
-- VALUES ('b_fail', 'Fail', 'Shop Now', true, 0);
-- -- Expected: ERROR violates check constraint "banners_cta_both_or_neither"
-- -- (cta_label is set but cta_href is NULL)
--
-- INSERT INTO banners (id, title, cta_href, is_active, sort_order)
-- VALUES ('b_fail2', 'Fail', '/shop', true, 0);
-- -- Expected: ERROR violates check constraint "banners_cta_both_or_neither"
-- -- (cta_href is set but cta_label is NULL)

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DROP TABLE IF EXISTS banners;
-- DROP FUNCTION IF EXISTS update_timestamp;
-- Rollback note: DROP FUNCTION affects all future migrations that
-- use this function. Only run the function DROP if no other table
-- depends on it yet. At this stage (migration 002), it is safe.

COMMIT;