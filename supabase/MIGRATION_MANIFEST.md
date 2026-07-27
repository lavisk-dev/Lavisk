# Lavisk Database Migration Manifest

## Overall Progress

**Total Planned Migrations:** 17 - All 17 Generated

### Completed SQL Files

| # | Migration | Status |
|---|---|---|
| 001 | `001_create_categories.sql` | Generated |
| 002 | `002_create_banners.sql` | Generated |
| 003 | `003_create_contacts.sql` | Generated |
| 004 | `004_create_coupons.sql` | Generated |
| 005 | `005_create_blog_posts.sql` | Generated |
| 006 | `006_create_settings.sql` | Generated |
| 007 | `007_create_collections.sql` | Generated |
| 008 | `008_create_products.sql` | Generated |
| 009 | `009_create_inventory.sql` | Generated |
| 010 | `010_create_inventory_movements.sql` | Generated |
| 011 | `011_create_product_collections.sql` | Generated |
| 012 | `012_create_reviews.sql` | Generated |
| 013 | `013_create_orders.sql` | Generated |
| 014 | `014_create_order_timeline.sql` | Generated |
| 015 | `015_create_inventory_alerts.sql` | Generated |
| 016 | `016_create_storage_buckets.sql` | Generated |
| 017 | `017_create_seed_data.sql` | Generated |

### Deprecated / Renamed Files

| Old File | Superseded By |
|---|---|
| `001_create_collections.sql` | `007_create_collections.sql` |
| `002_create_product_collections.sql` | `011_create_product_collections.sql` |

---

## Current Database State

| Metric | Count |
|---|---|
| SQL Generated | 17 / 17 |
| Migration Files Saved | 17 / 17 |
| Applied To Database | 0 / 17 |
| Verified In Database | 0 / 17 |

---

## Dependency Status

| Migration | Depends On | Depended Upon By | Status |
|---|---|---|---|
| 001 categories | none | products | Generated |
| 002 banners | none | none | Generated |
| 003 contacts | none | none | Generated |
| 004 coupons | none | none | Generated |
| 005 blog_posts | none | none | Generated |
| 006 settings | none | none | Generated |
| 007 collections | none | products, product_collections | Generated |
| 008 products | categories (FK), collections (FK) | inventory, product_collections, reviews, inventory_alerts, orders | Generated |
| 009 inventory | products (FK) | inventory_movements | Generated |
| 010 inventory_movements | products (FK) | none | Generated |
| 011 product_collections | products (FK), collections (FK) | none | Generated |
| 012 reviews | products (FK) | none | Generated |
| 013 orders | none (JSONB items, address) | order_timeline | Generated |
| 014 order_timeline | orders (FK) | none | Generated |
| 015 inventory_alerts | products (FK) | none | Generated |
| 016 storage_buckets | none | none | Generated |
| 017 seed_data | all tables | none | Generated |

---

## Database Execution Status

**Execution has NOT yet occurred.**

All migrations currently exist only as SQL files.

No Supabase schema changes have been made.

---

## Ready For Deployment

When ready, apply with:

```bash
supabase db push
```

Then verify with:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

---

## Update Log

| Date | Migration | Action |
|---|---|---|
| 2026-07-27 | 001-017 | All 17 migrations generated |