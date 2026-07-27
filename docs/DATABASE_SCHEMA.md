# Database Schema

## Overview

Lavisk uses Supabase PostgreSQL. The schema follows snake_case naming convention with the following tables:

## Tables

### products

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "p1" |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| name | TEXT | NOT NULL | |
| description | TEXT | NOT NULL | |
| story | TEXT | '' | |
| price | NUMERIC | NOT NULL | In smallest currency unit |
| compare_at_price | NUMERIC | NULLABLE | Original price for sale display |
| tag | TEXT | NULLABLE | Bestseller, New, Trending, etc. |
| category_slug | TEXT | NOT NULL | FK to categories.slug |
| collection_slug | TEXT | NULLABLE | FK to collections.slug (ON DELETE SET NULL) |
| gradient_from | TEXT | NOT NULL | Color for UI gradient |
| gradient_to | TEXT | NOT NULL | Color for UI gradient |
| images | JSONB | '[]' | Array of {url, publicId, alt?} |
| rating | NUMERIC | 0 | |
| review_count | INTEGER | 0 | |
| stock | INTEGER | 0 | |
| is_active | BOOLEAN | true | |
| is_featured | BOOLEAN | false | |
| is_trending | BOOLEAN | false | |
| created_at | TIMESTAMPTZ | now() | |

### categories

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "cat_birthday" |
| name | TEXT | NOT NULL | |
| slug | TEXT | UNIQUE, NOT NULL | |
| count | INTEGER | 0 | Product count |
| gradient_from | TEXT | NOT NULL | |
| gradient_to | TEXT | NOT NULL | |
| blob_color | TEXT | NOT NULL | |
| image_url | TEXT | NULLABLE | |
| image_public_id | TEXT | NULLABLE | |

### collections

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "col_1" |
| name | TEXT | NOT NULL | |
| slug | TEXT | UNIQUE, NOT NULL | |
| description | TEXT | NOT NULL | |
| banner_image | TEXT | NULLABLE | Cloudinary URL |
| thumbnail_image | TEXT | NULLABLE | Cloudinary URL |
| is_active | BOOLEAN | true | |
| sort_order | INTEGER | 0 | |
| seo_title | TEXT | NULLABLE | |
| seo_description | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

### product_collections

| Column | Type | Default | Notes |
|---|---|---|---|
| product_id | TEXT | PK, FK to products.id | ON DELETE CASCADE |
| collection_id | TEXT | PK, FK to collections.id | ON DELETE CASCADE |
| sort_order | INTEGER | 0 | Display order within collection |
| is_primary | BOOLEAN | false | Primary/navigation collection |
| created_at | TIMESTAMPTZ | now() | |

### orders

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "o_1234" |
| order_number | TEXT | UNIQUE, NOT NULL | e.g. "GFT-AB12-3F9K" |
| customer_name | TEXT | NOT NULL | |
| customer_email | TEXT | NOT NULL | |
| customer_phone | TEXT | NOT NULL | |
| shipping_address | JSONB | NOT NULL | Address object |
| items | JSONB | NOT NULL | Array of OrderItem |
| subtotal | NUMERIC | NOT NULL | |
| discount | NUMERIC | 0 | |
| shipping | NUMERIC | 0 | |
| total | NUMERIC | NOT NULL | |
| coupon_code | TEXT | NULLABLE | |
| status | TEXT | 'pending' | pending/paid/processing/shipped/delivered/cancelled/refunded |
| payment_provider | TEXT | NOT NULL | razorpay/cashfree/stripe/manual |
| payment_order_id | TEXT | NULLABLE | Provider order ID |
| payment_id | TEXT | NULLABLE | Provider payment ID |
| gift_note | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

### reviews

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| product_id | TEXT | NOT NULL | FK to products.id |
| customer_name | TEXT | NOT NULL | |
| rating | INTEGER | NOT NULL | 1-5 |
| comment | TEXT | NOT NULL | |
| is_approved | BOOLEAN | false | |
| created_at | TIMESTAMPTZ | now() | |

### coupons

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| code | TEXT | UNIQUE, NOT NULL | |
| type | TEXT | NOT NULL | 'percentage' or 'flat' |
| value | NUMERIC | NOT NULL | |
| min_order_value | NUMERIC | NULLABLE | |
| max_discount | NUMERIC | NULLABLE | |
| expires_at | TIMESTAMPTZ | NULLABLE | |
| is_active | BOOLEAN | true | |
| usage_limit | INTEGER | NULLABLE | |
| used_count | INTEGER | 0 | |

### banners

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| title | TEXT | NOT NULL | |
| subtitle | TEXT | NULLABLE | |
| image_url | TEXT | NULLABLE | |
| image_public_id | TEXT | NULLABLE | |
| cta_label | TEXT | NULLABLE | |
| cta_href | TEXT | NULLABLE | |
| is_active | BOOLEAN | true | |
| sort_order | INTEGER | 0 | |

### contacts

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| name | TEXT | NOT NULL | |
| email | TEXT | NOT NULL | |
| subject | TEXT | NOT NULL | |
| message | TEXT | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | |

### customers (view)

Derived from orders data. Not a standalone table - queried via aggregation.

### blog_posts

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | |
| slug | TEXT | UNIQUE, NOT NULL | |
| title | TEXT | NOT NULL | |
| excerpt | TEXT | NOT NULL | |
| content | TEXT | NOT NULL | |
| author_name | TEXT | NOT NULL | |
| author_role | TEXT | NULLABLE | |
| category | TEXT | NOT NULL | |
| reading_minutes | INTEGER | 3 | |
| cover_color_from | TEXT | NOT NULL | |
| cover_color_to | TEXT | NOT NULL | |
| cover_emoji | TEXT | NOT NULL | |
| cover_image_url | TEXT | NULLABLE | |
| cover_image_public_id | TEXT | NULLABLE | |
| is_published | BOOLEAN | false | |
| published_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |
| faq | JSONB | NULLABLE | |
| keywords | TEXT[] | NULLABLE | |

## Indexes

- `products_slug_idx` - unique index on products.slug
- `products_category_slug_idx` - index on products.category_slug
- `idx_collections_slug` - unique index on collections.slug
- `idx_collections_is_active` - index on collections.is_active
- `idx_collections_sort_order` - index on collections.sort_order
- `idx_collections_created_at` - index on collections.created_at DESC
- `idx_products_collection_slug` - index on products.collection_slug
- `idx_pc_product_id` - index on product_collections.product_id
- `idx_pc_collection_id` - index on product_collections.collection_id
- `idx_pc_primary` - partial index on product_collections (product_id, collection_id) WHERE is_primary = true
- `orders_order_number_idx` - unique index on orders.order_number
- `orders_status_idx` - index on orders.status
- `reviews_product_id_idx` - index on reviews.product_id
- `coupons_code_idx` - unique index on coupons.code
- `idx_inventory_movements_product_id` - index on inventory_movements.product_id
- `idx_inventory_movements_operation` - index on inventory_movements.operation
- `idx_inventory_movements_created_at` - index on inventory_movements.created_at DESC
- `idx_order_timeline_order_id` - index on order_timeline.order_id
- `idx_order_timeline_created_at` - index on order_timeline.created_at DESC

## New Tables (Phase 03)

### inventory_movements

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "im_<timestamp>_<rand>" |
| product_id | TEXT | NOT NULL | FK to products.id |
| operation | TEXT | NOT NULL | added/removed/adjusted/sale/return/damaged/lost/purchase_received |
| quantity | INTEGER | NOT NULL | Positive for additions, negative for removals |
| stock_before | INTEGER | NOT NULL | Snapshot before change |
| stock_after | INTEGER | NOT NULL | Snapshot after change |
| reason | TEXT | NOT NULL | Human-readable reason |
| reference | TEXT | NULLABLE | Order ID, PO number, etc. |
| performed_by | TEXT | NOT NULL | admin@example.com or "system" |
| notes | TEXT | NULLABLE | Optional additional context |
| supplier | TEXT | NULLABLE | Supplier name for purchase_received |
| created_at | TIMESTAMPTZ | now() | Immutable timestamp |

### inventory_alerts

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "ia_<timestamp>_<rand>" |
| product_id | TEXT | NOT NULL, UNIQUE | FK to products.id |
| min_stock | INTEGER | 5 | Alert threshold |
| is_active | BOOLEAN | true | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

## New Tables (Phase 04)

### order_timeline

| Column | Type | Default | Notes |
|---|---|---|---|
| id | TEXT | PK | e.g. "ot_<timestamp>_<rand>" |
| order_id | TEXT | NOT NULL | FK to orders.id |
| status | TEXT | NOT NULL | The new status |
| previous_status | TEXT | NOT NULL | The status before the change |
| note | TEXT | NULLABLE | Optional admin note |
| performed_by | TEXT | NOT NULL | "system", "customer", or admin email |
| created_at | TIMESTAMPTZ | now() | |

## Row Level Security

Tables are managed via the Supabase service-role client (admin.ts). Public read operations use the anon key with appropriate RLS policies.

### Collections RLS Policies

| Policy | Role | Action | Scope |
|---|---|---|---|
| Public can read active collections | public | SELECT | is_active = true |
| Authenticated can read collections | authenticated | SELECT | all |
| Admin can insert collections | authenticated | INSERT | all |
| Admin can update collections | authenticated | UPDATE | all |
| Admin can delete collections | authenticated | DELETE | all |

## SQL Migrations

### 001_create_collections.sql

See `supabase/migrations/001_create_collections.sql` for the complete migration.

### 002_create_product_collections.sql

See `supabase/migrations/002_create_product_collections.sql` for the junction table migration.
