-- 006_create_settings.sql
-- Creates the settings table — generic key-value store for app configuration.
-- Pattern inspired by WordPress options table: each setting is a single row
-- with a unique key and a JSONB value that can hold any structured data.
-- Dependencies: none
-- Depended upon by: none
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    id         TEXT PRIMARY KEY,
    key        TEXT NOT NULL UNIQUE,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

-- key: UNIQUE enforced inline
-- value: JSONB can hold any scalar, array, or object

-- ============================================================
-- INDEXES
-- ============================================================

-- The UNIQUE constraint on key already creates an index.
-- No additional indexes needed.

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE settings IS
    'Generic key-value store for application configuration. Each row is one setting with a unique key and a JSONB value. Follows the WordPress options pattern.';

COMMENT ON COLUMN settings.key IS
    'Unique setting identifier (e.g. "store_name", "support_email", "free_shipping_threshold"). Convention: lowercase_with_underscores.';

COMMENT ON COLUMN settings.value IS
    'Setting value as JSONB. Supports scalars (true, 42, "hello"), arrays, and objects. The consuming code is responsible for type coercion.';

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
    ON settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert settings"
    ON settings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin can update settings"
    ON settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin can delete settings"
    ON settings
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- INSERT INTO settings (id, key, value)
-- VALUES ('s_test', 'store_name', '"Lavisk"'),
--        ('s_test2', 'free_shipping_threshold', '99'),
--        ('s_test3', 'supported_countries', '["US", "IN", "UK"]');
--
-- SELECT id, key, value FROM settings WHERE key = 'store_name';
-- -- Expected: 1 row, key = 'store_name', value = "Lavisk"
--
-- SELECT key, value FROM settings ORDER BY key;
-- -- Expected: 3 rows
--
-- UPDATE settings SET value = '79' WHERE key = 'free_shipping_threshold';
-- SELECT value FROM settings WHERE key = 'free_shipping_threshold';
-- -- Expected: 79
--
-- DELETE FROM settings WHERE key = 'store_name';
-- SELECT * FROM settings WHERE key = 'store_name';
-- -- Expected: 0 rows

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DROP TABLE IF EXISTS settings;

COMMIT;