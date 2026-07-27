-- 004_create_coupons.sql
-- Creates the coupons table — discount codes for checkout.
-- Dependencies: none
-- Depended upon by: none
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS coupons (
    id              TEXT PRIMARY KEY,
    code            TEXT NOT NULL UNIQUE,
    type            TEXT NOT NULL CHECK (type IN ('percentage', 'flat')),
    value           NUMERIC NOT NULL CHECK (value >= 0),
    min_order_value NUMERIC CHECK (min_order_value >= 0),
    max_discount    NUMERIC CHECK (max_discount >= 0),
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit     INTEGER CHECK (usage_limit >= 1),
    used_count      INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

-- code: UNIQUE enforced inline
-- type: CHECK (percentage or flat) enforced inline
-- value: CHECK >= 0 enforced inline
-- min_order_value, max_discount: CHECK >= 0 enforced inline
-- usage_limit: CHECK >= 1 enforced inline
-- used_count: CHECK >= 0 enforced inline

-- ============================================================
-- INDEXES
-- ============================================================

-- The UNIQUE constraint on code already creates an index.

-- Covers future direct DB validation: WHERE code = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_coupons_code_active
    ON coupons (code, is_active);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE coupons IS
    'Discount codes for checkout. Validated via CouponService.validate() and managed via admin panel.';

COMMENT ON COLUMN coupons.code IS
    'Uppercase coupon code (e.g. WELCOME10). UNIQUE. Transformed to uppercase by the API layer.';

COMMENT ON COLUMN coupons.type IS
    'Discount type: percentage (e.g. 10% off) or flat (e.g. $5 off).';

COMMENT ON COLUMN coupons.value IS
    'Discount value. For percentage type, this is the percent (e.g. 10). For flat type, this is the amount in the smallest currency unit.';

COMMENT ON COLUMN coupons.min_order_value IS
    'Minimum order subtotal required for this coupon to apply. Null means no minimum.';

COMMENT ON COLUMN coupons.max_discount IS
    'Maximum discount cap for percentage coupons. Null means no cap.';

COMMENT ON COLUMN coupons.expires_at IS
    'Expiration timestamp. Null means the coupon never expires.';

COMMENT ON COLUMN coupons.is_active IS
    'Controls whether the coupon can be used. Admin can toggle without deleting.';

COMMENT ON COLUMN coupons.usage_limit IS
    'Maximum number of times this coupon can be used. Null means unlimited.';

COMMENT ON COLUMN coupons.used_count IS
    'Current usage count. Incremented by CouponService.incrementUsage(). Must never exceed usage_limit.';

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- CouponService.list() uses the anon client from both storefront
-- (validate) and admin (list). Public SELECT is required.
CREATE POLICY "Public can read coupons"
    ON coupons
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert coupons"
    ON coupons
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin can update coupons"
    ON coupons
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin can delete coupons"
    ON coupons
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Run these after migration to confirm correctness:
--
-- INSERT INTO coupons (id, code, type, value, min_order_value, is_active, usage_limit, used_count)
-- VALUES ('c_test', 'TEST10', 'percentage', 10, 0, true, 100, 0);
--
-- SELECT id, code, type, value, is_active, used_count
-- FROM coupons WHERE code = 'TEST10';
-- -- Expected: 1 row, code = 'TEST10', type = 'percentage', value = 10, used_count = 0
--
-- UPDATE coupons SET used_count = 5 WHERE id = 'c_test';
-- SELECT used_count FROM coupons WHERE id = 'c_test';
-- -- Expected: used_count = 5
--
-- DELETE FROM coupons WHERE id = 'c_test';
-- SELECT * FROM coupons WHERE id = 'c_test';
-- -- Expected: 0 rows
--
-- -- Constraint tests (should fail):
-- INSERT INTO coupons (id, code, type, value)
-- VALUES ('c_fail', 'TEST10', 'percentage', 10);
-- -- Expected: ERROR duplicate key (skip if already deleted)
--
-- INSERT INTO coupons (id, code, type, value)
-- VALUES ('c_fail2', 'INVALID', 'fixed', 10);
-- -- Expected: ERROR CHECK constraint (type must be 'percentage' or 'flat')
--
-- INSERT INTO coupons (id, code, type, value)
-- VALUES ('c_fail3', 'NEGATIVE', 'percentage', -5);
-- -- Expected: ERROR CHECK constraint (value >= 0)
--
-- INSERT INTO coupons (id, code, type, value, usage_limit)
-- VALUES ('c_fail4', 'ZEROLIMIT', 'percentage', 10, 0);
-- -- Expected: ERROR CHECK constraint (usage_limit >= 1)

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DROP TABLE IF EXISTS coupons;

COMMIT;