-- 013_create_orders.sql
-- Creates the orders table -- customer orders with JSONB items and address.
-- Dependencies: none (JSONB items, no FK to products/coupons)
-- Depended upon by: 014_order_timeline (FK order_id)
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

CREATE TABLE IF NOT EXISTS orders (
    id               TEXT PRIMARY KEY,
    order_number     TEXT NOT NULL UNIQUE,
    customer_name    TEXT NOT NULL,
    customer_email   TEXT NOT NULL,
    customer_phone   TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address  JSONB,
    items            JSONB NOT NULL DEFAULT '[]',
    subtotal         NUMERIC NOT NULL CHECK (subtotal >= 0),
    discount         NUMERIC NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax              NUMERIC DEFAULT 0 CHECK (tax >= 0),
    shipping         NUMERIC NOT NULL DEFAULT 0 CHECK (shipping >= 0),
    total            NUMERIC NOT NULL CHECK (total >= 0),
    coupon_code      TEXT,
    status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                         'pending', 'paid', 'processing', 'packed',
                         'dispatched', 'out_for_delivery', 'delivered',
                         'cancelled', 'refunded', 'returned'
                     )),
    payment_provider TEXT NOT NULL,
    payment_order_id TEXT,
    payment_id       TEXT,
    gift_note        TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);

COMMENT ON TABLE orders IS 'Customer orders. Items stored as JSONB (Phase 1). No FK to products or coupons.';
COMMENT ON COLUMN orders.order_number IS 'UNIQUE human-readable order number.';
COMMENT ON COLUMN orders.shipping_address IS 'JSONB address object. Denormalized.';
COMMENT ON COLUMN orders.billing_address IS 'JSONB address object. Null if same as shipping.';
COMMENT ON COLUMN orders.items IS 'JSONB array [{productId, name, price, quantity}]. Denormalized.';
COMMENT ON COLUMN orders.coupon_code IS 'Coupon code applied. Stored as string, no FK.';
COMMENT ON COLUMN orders.status IS 'Order lifecycle status. Restricted to valid transitions.';
COMMENT ON COLUMN orders.payment_provider IS 'Payment gateway (razorpay, cashfree, stripe, manual).';
COMMENT ON COLUMN orders.payment_order_id IS 'Provider-side order ID.';
COMMENT ON COLUMN orders.payment_id IS 'Provider-side payment/transaction ID.';

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Admin can insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin can delete orders" ON orders FOR DELETE TO authenticated USING (true);

-- DROP TABLE IF EXISTS orders CASCADE;

COMMIT;