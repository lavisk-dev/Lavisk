-- 012_create_reviews.sql
-- Creates the reviews table -- customer product reviews with moderation.
-- Includes trigger to sync cached rating/review_count on the parent product.
-- Dependencies: 008_products (FK product_id)
-- Depended upon by: none

BEGIN;

CREATE TABLE IF NOT EXISTS reviews (
    id            TEXT PRIMARY KEY,
    product_id    TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment       TEXT NOT NULL,
    is_approved   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews (product_id, is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);

COMMENT ON TABLE reviews IS 'Customer product reviews with moderation. Triggers sync of products.rating and products.review_count.';
COMMENT ON COLUMN reviews.product_id IS 'FK to products.id ON DELETE CASCADE.';
COMMENT ON COLUMN reviews.rating IS 'Rating 1-5.';
COMMENT ON COLUMN reviews.comment IS 'Review body text.';
COMMENT ON COLUMN reviews.is_approved IS 'Moderation status. Only approved reviews count toward product rating.';

CREATE OR REPLACE FUNCTION sync_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE products
    SET
        rating = COALESCE(
            (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true), 0
        ),
        review_count = COALESCE(
            (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = true), 0
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_sync_product
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION sync_product_rating();

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public can insert reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update reviews" ON reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP FUNCTION IF EXISTS sync_product_rating;

COMMIT;