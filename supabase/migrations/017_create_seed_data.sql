-- 017_create_seed_data.sql
-- Seeds initial data for all tables so the storefront is populated out of the box.
-- Dependencies: all prior migrations (001-016)
-- Depended upon by: none

BEGIN;

-- ============================================================
-- CATEGORIES (8)
-- ============================================================
INSERT INTO categories (id, name, slug, count, gradient_from, gradient_to, blob_color, image_url)
VALUES
    ('cat_birthday',      'Birthday',      'birthday',      64, '#FFE9EF', '#FFDCE6', '#FFB6C9', '/images/cake.png'),
    ('cat_anniversary',   'Anniversary',   'anniversary',   41, '#FFEBDF', '#FFD3B0', '#FFD3B0', NULL),
    ('cat_wedding',       'Wedding',       'wedding',       38, '#F3ECFF', '#E7D6FF', '#E7D6FF', NULL),
    ('cat_baby_shower',   'Baby Shower',   'baby-shower',   29, '#FFF0F3', '#FFE0E9', '#FF8FA3', NULL),
    ('cat_just_because',  'Just Because',  'just-because',  52, '#FFE9EF', '#FFCFDD', '#FF8FA3', NULL),
    ('cat_flowers',       'Flowers',       'flowers',       47, '#FFEDE4', '#FFDAC4', '#FFD3B0', NULL),
    ('cat_chocolate',     'Chocolate',     'chocolate',     33, '#FBEFE9', '#F6DFD3', '#FFB6C9', NULL),
    ('cat_personalized',  'Personalized',  'personalized',  58, '#F6ECFF', '#E7D6FF', '#E7D6FF', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COLLECTIONS (4)
-- ============================================================
INSERT INTO collections (id, name, slug, description, is_active, sort_order, seo_title, seo_description)
VALUES
    ('col_valentine',    'Valentine''s Day',   'valentines-day',     'Say it with roses, chocolates, and a whole lot of heart.',      TRUE, 0, 'Valentine''s Day Gifts',  'Shop romantic Valentine''s Day gifts.'),
    ('col_corporate',    'Corporate Gifting',  'corporate-gifting',  'Premium gifts that say thank you, congratulations, or welcome.', TRUE, 1, 'Corporate Gifts',        'Premium corporate gifting solutions.'),
    ('col_luxury',       'Luxury Collection',  'luxury',             'The finest curated gifts for life''s most extraordinary moments.', TRUE, 2, 'Luxury Gift Collection', 'Explore our luxury curated gift collection.'),
    ('col_new_arrivals', 'New Arrivals',       'new-arrivals',       'Freshly curated — the latest additions to the Lavisk family.',  TRUE, 3, 'New Arrivals',           'Shop our newest gift arrivals.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PRODUCTS (11)
-- Note: stock column does not exist on products — it lives in the inventory table (009).
-- ============================================================
INSERT INTO products (id, slug, name, description, story, price, compare_at_price, tag, category_slug, collection_slug, gradient_from, gradient_to, images, rating, review_count, is_active, is_featured, is_trending, created_at)
VALUES
    ('p1',  'the-bloom-box',     'The Bloom Box',      'Fresh peonies + hand-tied ribbon',
            'Seasonal peonies and garden roses, arranged the morning they ship and finished with a silk ribbon by hand.',
            649, NULL, 'Bestseller',   'flowers',       'col_valentine', '#FFB6C9', '#FF8FA3',
            '[{"url":"/hero/gifted-open.png","publicId":"hero/gifted-open","alt":"Open pink gift box with ribbon"}]',
            4.9, 214, TRUE, TRUE, FALSE, '2026-01-04T00:00:00.000Z'),

    ('p2',  'sweet-nothings',    'Sweet Nothings',     'Artisan chocolate collection',
            'Twelve single-origin truffles from a small-batch chocolatier, nestled in a keepsake blush box.',
            499, NULL, 'New',        'chocolate',     'col_valentine', '#FFD3B0', '#FFB6C9',
            '[{"url":"/hero/gifted-closed.png","publicId":"hero/gifted-closed","alt":"Closed pink gift box with satin bow"}]',
            4.8, 176, TRUE, TRUE, TRUE, '2026-02-11T00:00:00.000Z'),

    ('p3',  'cuddle-co-bear',    'Cuddle Co. Bear',    'Plush teddy holding a rose',
            'Impossibly soft, ethically made, and holding a velvet rose that never wilts. A hug that stays.',
            399, 449, 'Loved',     'just-because',  'col_new_arrivals', '#F6DFD3', '#FFD3B0',
            '[{"url":"/images/cake.png","publicId":"images/cake","alt":"Birthday cake on pink stand"}]',
            5.0, 312, TRUE, TRUE, FALSE, '2025-11-20T00:00:00.000Z'),

    ('p4',  'the-spa-ritual',    'The Spa Ritual',     'Candle, bath soak & silk mask',
            'A slow evening in a box: soy candle, mineral bath soak and a pure silk eye mask for the deepest reset.',
            749, NULL, 'Luxe',      'just-because',  'col_luxury',  '#E7D6FF', '#FFB6C9',
            '[{"url":"/hero/gifted-blossom.png","publicId":"hero/gifted-blossom","alt":"Gift box with pink roses"}]',
            4.9, 98, TRUE, TRUE, FALSE, '2026-03-02T00:00:00.000Z'),

    ('p5',  'golden-hour',       'Golden Hour',        'Champagne & two coupes',
            'A chilled bottle of brut and two hand-blown coupes — for the moments that deserve a proper toast.',
            899, NULL, 'Celebrate',  'anniversary',   'col_valentine', '#FFD3B0', '#FF8FA3',
            '[{"url":"/hero/gifted-closed.png","publicId":"hero/gifted-closed","alt":"Closed pink gift box with satin bow"}]',
            4.7, 141, TRUE, TRUE, TRUE, '2026-01-28T00:00:00.000Z'),

    ('p6',  'little-letters',    'Little Letters',     'Personalized name necklace',
            'A dainty 18k-gold-plated name necklace, engraved to order and delivered in a velvet pouch.',
            599, NULL, 'Personalized', 'personalized', 'col_new_arrivals', '#FFCFDD', '#E7D6FF',
            '[{"url":"/images/cake.png","publicId":"images/cake","alt":"Birthday cake on pink stand"}]',
            4.9, 203, TRUE, TRUE, FALSE, '2026-02-19T00:00:00.000Z'),

    ('p7',  'petal-post-card',   'Petal Post Card',    'Pressed-flower greeting card',
            'A hand-pressed botanical card with a keepsake envelope — the smallest gift that still says everything.',
            249, NULL, 'Trending',  'flowers',       'col_new_arrivals', '#FFB6C9', '#FFD3B0',
            '[{"url":"/hero/gifted-open.png","publicId":"hero/gifted-open","alt":"Open pink gift box with ribbon"}]',
            4.9, 88, TRUE, FALSE, TRUE, '2026-04-01T00:00:00.000Z'),

    ('p8',  'ribbon-roses',      'Ribbon Roses',       'Everlasting silk rose bundle',
            'A hand-tied bundle of silk roses that keep their bloom well past the last petal of a real one.',
            349, NULL, 'Trending',  'flowers',       'col_valentine', '#FF8FA3', '#FFB6C9',
            '[{"url":"/hero/gifted-blossom.png","publicId":"hero/gifted-blossom","alt":"Gift box with pink roses"}]',
            4.8, 64, TRUE, FALSE, TRUE, '2026-03-18T00:00:00.000Z'),

    ('p9',  'cocoa-cloud',       'Cocoa Cloud',        'Whipped hot cocoa gift jar',
            'Small-batch whipped cocoa mix in a reusable glass jar, topped with a hand-tied gingham lid.',
            299, NULL, 'Trending',  'chocolate',     'col_new_arrivals', '#F6DFD3', '#FFB6C9',
            '[{"url":"/images/cake.png","publicId":"images/cake","alt":"Birthday cake on pink stand"}]',
            5.0, 51, TRUE, FALSE, TRUE, '2026-04-10T00:00:00.000Z'),

    ('p10', 'lilac-dreams',      'Lilac Dreams',       'Dried lilac & eucalyptus bundle',
            'A dried lilac and eucalyptus bundle that keeps the scent and the color for months on end.',
            449, NULL, 'Trending',  'flowers',       'col_new_arrivals', '#E7D6FF', '#FFCFDD',
            '[{"url":"/hero/gifted-open.png","publicId":"hero/gifted-open","alt":"Open pink gift box with ribbon"}]',
            4.9, 47, TRUE, FALSE, TRUE, '2026-04-14T00:00:00.000Z'),

    ('p11', 'sunset-bundle',     'Sunset Bundle',      'Peach & rose stem bouquet',
            'Peach ranunculus and blush roses gathered into an easy, sun-warmed bouquet.',
            549, NULL, 'Trending',  'flowers',       'col_valentine', '#FFD3B0', '#FF8FA3',
            '[{"url":"/hero/gifted-closed.png","publicId":"hero/gifted-closed","alt":"Closed pink gift box with satin bow"}]',
            4.7, 39, TRUE, FALSE, TRUE, '2026-04-15T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INVENTORY (11 — one row per product)
-- ============================================================
INSERT INTO inventory (product_id, quantity)
VALUES
    ('p1',  42),
    ('p2',  65),
    ('p3',  88),
    ('p4',  24),
    ('p5',  30),
    ('p6',  51),
    ('p7',  120),
    ('p8',  70),
    ('p9',  95),
    ('p10', 40),
    ('p11', 33)
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================
-- INVENTORY ALERTS (2 — below-threshold products)
-- The Spa Ritual (p4, qty 24) and Golden Hour (p5, qty 30) get alerts at 30 threshold.
-- ============================================================
INSERT INTO inventory_alerts (product_id, min_stock)
VALUES
    ('p4', 30),
    ('p5', 30)
ON CONFLICT (product_id) DO NOTHING;

-- ============================================================
-- PRODUCT COLLECTIONS (junction assignments)
-- ============================================================
INSERT INTO product_collections (product_id, collection_id, is_primary)
VALUES
    ('p1',  'col_valentine',    TRUE),
    ('p2',  'col_valentine',    TRUE),
    ('p3',  'col_new_arrivals', TRUE),
    ('p4',  'col_luxury',       TRUE),
    ('p5',  'col_valentine',    TRUE),
    ('p6',  'col_new_arrivals', TRUE),
    ('p7',  'col_new_arrivals', TRUE),
    ('p8',  'col_valentine',    TRUE),
    ('p9',  'col_new_arrivals', TRUE),
    ('p10', 'col_new_arrivals', TRUE),
    ('p11', 'col_valentine',    TRUE)
ON CONFLICT (product_id, collection_id) DO NOTHING;

-- ============================================================
-- REVIEWS (3)
-- ============================================================
INSERT INTO reviews (id, product_id, customer_name, rating, comment, created_at, is_approved)
VALUES
    ('r1', 'p1', 'Anjali R.', 5, 'Arrived so fresh and the ribbon detail is gorgeous.',           '2026-05-01T00:00:00.000Z', TRUE),
    ('r2', 'p1', 'Marcus T.', 5, 'My wife''s new favorite florist, hands down.',                   '2026-05-10T00:00:00.000Z', TRUE),
    ('r3', 'p3', 'Priya K.',  5, 'Softest bear I''ve ever felt, worth every penny.',               '2026-04-22T00:00:00.000Z', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BANNERS (3)
-- ============================================================
INSERT INTO banners (id, title, subtitle, is_active, sort_order, cta_label, cta_href)
VALUES
    ('b1', 'Say it with a GIFTED',          'Wrapped with a Little Extra Love',           TRUE, 0, 'Shop the Collection', '/shop'),
    ('b2', 'This season''s UNWRAP',          'Joy, Tied Up With a Bow',                    TRUE, 1, 'Shop the Collection', '/shop'),
    ('b3', 'For the ones who CHERISH',       'Make Every Day Feel Like a Birthday',       TRUE, 2, 'Shop the Collection', '/shop')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COUPONS (2)
-- ============================================================
INSERT INTO coupons (id, code, type, value, min_order_value, is_active, used_count, usage_limit)
VALUES
    ('c1', 'WELCOME10', 'percentage', 10,   0,   TRUE, 128, 1000),
    ('c2', 'FREESHIP',  'flat',       99, 299, TRUE, 54,  500)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BLOG POSTS (6)
-- ============================================================
INSERT INTO blog_posts (id, slug, title, excerpt, content, author_name, author_role, category, reading_minutes, cover_color_from, cover_color_to, cover_emoji, is_published, published_at, keywords, faq)
VALUES
    ('blog_gift_etiquette', 'modern-gift-etiquette',
     'The new rules of modern gift-giving',
     'A short field guide to giving well in 2026 — from thoughtful timing to what to skip on a first-visit gift.',
     'Gifts are quiet language. The rules for speaking that language well have shifted, and most of them boil down to one idea: give with intention, not obligation.

## Give small, give often
The best-received gifts in 2026 are lower-cost, higher-frequency, and personal. A hand-tied flower bundle mid-week beats a large hamper on a birthday — because it wasn''t expected.

## Skip the generic
Anything the recipient could reasonably buy for themselves at 11pm on a phone isn''t a gift. Look for made-to-order pieces, single-origin edibles, or anything with a story.

## Wrap like it matters
A hand-tied ribbon takes forty seconds and changes the entire encounter with the object. Never send a gift in the shipping box it arrived in.

## Include a note
Two sentences, handwritten if possible. Say what the person means to you and why the gift reminded you of them.

## First visits: keep it edible or floral
Choose something they will use up — a small box of chocolate, a fresh bouquet, a jar of honey.

## The five-second rule
Before you send: imagine the recipient opening it in five seconds. Do their eyes go bright? If not, keep looking.',
     'Anjali Ravindran', 'Head of Gifting', 'Etiquette', 4,
     '#FFB6C9', '#FF8FA3', '🎀',
     TRUE, '2026-04-12T09:00:00.000Z',
     ARRAY['gift etiquette', 'how to give a gift', 'gifting rules', 'thoughtful gifts', 'gift ideas 2026'],
     '[{"question":"What is a good rule of thumb for choosing a gift?","answer":"Give something the recipient wouldn''t easily buy for themselves, wrap it thoughtfully, and include a two-sentence handwritten note explaining why the gift reminded you of them."},{"question":"What should I bring on a first visit to someone''s home?","answer":"Choose something the host will use up — a small box of chocolate, a fresh flower bundle, or a jar of local honey."},{"question":"How much should I spend on a gift?","answer":"Frequency and specificity beat price. A well-chosen $30 gift with a note lands better than a $150 generic one."}]'),

    ('blog_bloom_care', 'how-to-make-fresh-flowers-last-longer',
     'How to make fresh flowers last two weeks',
     'The florist''s own routine — the water, the trim, the temperature — for stems that stay open twice as long.',
     'Most fresh flowers give up after five days because they''ve been quietly dying since they were cut. A short daily routine can push a Bloom Box to twelve or fourteen days.

## Water: change it, don''t top it up
Bacteria in stagnant water is the number-one killer. Empty the vase completely every second day, rinse it, and refill with fresh cool water.

## Trim on the diagonal, underwater
Every stem needs a fresh 1-inch cut every second day, on a 45° angle, held under running water so no air bubble enters.

## Cool room, no direct sun, no fruit bowl
Flowers last longest at 18–20°C. Direct sun cooks the petals and ripening fruit releases ethylene gas.

## Remove anything below the water line
Any leaf touching the water rots. Strip them off.

## Roses: the paper trick
If a rose head droops, wrap the top half in newspaper, plunge the stem into deep cool water for two hours.

## Peonies: the shake test
If yours are still tight after three days, shake them gently — the movement often triggers them to bloom.',
     'Priya Menon', 'Lead Florist', 'Care', 5,
     '#FFCFDD', '#FFB6C9', '🌸',
     TRUE, '2026-04-28T09:00:00.000Z',
     ARRAY['how to keep flowers fresh', 'make cut flowers last longer', 'flower care tips', 'fresh flower delivery', 'peony care'],
     '[{"question":"How often should I change the water?","answer":"Empty the vase completely every second day, rinse it out, and refill with fresh cool water."},{"question":"Why do my flowers droop even when the water looks fine?","answer":"An air lock inside the stem is the usual cause. Give each stem a fresh 1-inch cut on a 45° angle under running water."},{"question":"How long do fresh flowers last?","answer":"Most cut flowers last 5-7 days with no maintenance and 10-14 days with a full routine of stem trims and water changes."}]'),

    ('blog_chocolate_pairing', 'chocolate-and-wine-pairing-guide',
     'A very short guide to pairing chocolate with wine',
     'One rule: match intensity, not sweetness. And three pairings that work every time.',
     'Chocolate and wine are famously easy to get wrong. Most pairings fail because people match the sweetness instead of the intensity.

## The one rule that matters
Wine should be at least as sweet as the food it''s served with, and at least as intense.

## Three pairings that always work

### Milk chocolate + tawny port
The caramel and butterscotch notes match the milk-cocoa profile perfectly. Serve slightly chilled.

### 70% dark chocolate + Zinfandel
Zinfandel is one of the few red wines with enough fruit and structure to stand next to real dark chocolate.

### White chocolate + late-harvest Riesling
The high acidity cuts the fat in white chocolate, and its stone-fruit sweetness echoes the vanilla.

## What to avoid
- Dry sparkling wine with any chocolate — the acidity turns metallic
- Cabernet Sauvignon with milk chocolate — the tannins fight the milk fat
- Anything at fridge temperature — cold mutes both wine and cocoa',
     'Marcus Fields', 'Guest Contributor', 'Pairing', 3,
     '#F6DFD3', '#FFD3B0', '🍫',
     TRUE, '2026-05-05T09:00:00.000Z',
     ARRAY['chocolate wine pairing', 'dessert wine guide', 'port and chocolate', 'wine tasting'],
     NULL),

    ('blog_last_minute', 'last-minute-gifts-that-dont-look-last-minute',
     'Last-minute gifts that don''t look last-minute',
     'Same-day delivery is a superpower — as long as you know what to order. Six choices that never look rushed.',
     'The trick to a last-minute gift is choosing something that couldn''t have arrived any other way.

## The six safe bets
**Fresh-cut flowers** — Nothing beats them for making a rushed gift feel intentional.
**A single-origin chocolate box** — Small, elegant, universally loved.
**A candle in a keepable vessel** — The vessel gives the gift a second life.
**A pressed-flower card** — For under $25 you can send something that looks handmade.
**A gift-wrapped bottle** — Champagne, olive oil, or hot sauce.
**A named-charm necklace** — A personalized piece rarely reads as last-minute.

## What to skip
Skip anything requiring assembly, mystery boxes, subscription-first gifts, and anything in obviously-branded packaging.',
     'Karthikeyan V', 'Founder', 'Ideas', 3,
     '#E7D6FF', '#FFCFDD', '⏱️',
     TRUE, '2026-05-14T09:00:00.000Z',
     ARRAY['last minute gift ideas', 'same day gift delivery', 'quick gift ideas', 'thoughtful last minute gifts'],
     '[{"question":"What is a good last-minute gift?","answer":"Fresh-cut flowers delivered same-day, a small single-origin chocolate box, or a candle in a keepable vessel."},{"question":"Does Lavisk offer same-day delivery?","answer":"Yes, same-day delivery is available on selected products in most metro areas when ordered before the daily cut-off."}]'),

    ('blog_corporate', 'corporate-gifting-that-actually-lands',
     'Corporate gifting that actually lands',
     'Why bulk hampers underperform, and the small-run alternative that works for teams of any size.',
     'Most corporate gifting programs underspend on curation and overspend on scale.

## The core problem
Bulk gifting treats every recipient as identical. Real gift impact comes from feeling seen.

## The small-run alternative

### Pick 3-5 curated boxes at different price bands
Rather than one hamper for everyone, offer 3-5 small curated boxes at different price bands ($40, $80, $150).

### Personalize the note, not the item
Custom-branded items rarely age well. Spend the budget on a printed note with the recipient''s name.

### Ship as they''re earned, not on a calendar
Send when someone finishes a hard project, closes a difficult account, or hits a non-round-number work anniversary.

### Include a way to redeem
For distributed teams, a redeem-your-own link works better than a physical box.

## The math
A single well-chosen $60 gift beats a $30 hamper sent twice — satisfaction more than doubles.',
     'Karthikeyan V', 'Founder', 'Corporate', 6,
     '#FFEBDF', '#FFD3B0', '💼',
     TRUE, '2026-05-22T09:00:00.000Z',
     ARRAY['corporate gifting', 'employee gifts', 'client gift ideas', 'bulk gift ordering', 'b2b gifting'],
     '[{"question":"Does Lavisk offer corporate gifting?","answer":"Yes. We work with teams on curated multi-tier boxes, personalized notes, and redeem-your-own gift links."},{"question":"What is the minimum order for corporate gifting?","answer":"Corporate programs typically start at 25 units."}]'),

    ('blog_note', 'how-to-write-a-gift-note',
     'How to write a gift note that doesn''t sound generic',
     'A four-line template that beats every ''thinking of you'' card, plus three prompts to fill it with.',
     'The card is often the part of the gift the recipient keeps longest. Here''s a four-line template that never falls flat.

## The template
**Line 1 — Address them warmly by name.** "Dear Priya," is warmer than "Hi Priya,"
**Line 2 — State what the gift is, in your own words.** "A very small box of the sweetest strawberries I''ve eaten this year."
**Line 3 — Say why it made you think of them.** "I remembered you saying you needed a slow Sunday, and these felt like Sunday food."
**Line 4 — Close with something that isn''t ''love''.** "Cheering you on from over here — K."

## Three prompts if you''re stuck
1. What did you last talk about? Reference it.
2. What are they proud of right now? Congratulate them.
3. What is the smallest kind thing they''ve done for you recently? Thank them.

## The one thing not to do
Don''t apologize for the size of the gift or the length of the note.',
     'Anjali Ravindran', 'Head of Gifting', 'Etiquette', 3,
     '#FFF0F3', '#FFCFDD', '✍️',
     TRUE, '2026-06-08T09:00:00.000Z',
     ARRAY['how to write a gift note', 'gift card message ideas', 'thoughtful gift messages', 'handwritten note template'],
     NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SETTINGS (4)
-- ============================================================
INSERT INTO settings (id, key, value)
VALUES
    ('set_store_name',        'store_name',        '{"value": "Lavisk"}'),
    ('set_store_tagline',     'store_tagline',     '{"value": "Gifts that linger"}'),
    ('set_free_shipping',     'free_shipping_min',  '{"value": 499}'),
    ('set_currency',          'currency',          '{"value": "INR"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ORDERS (2)
-- ============================================================
INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone, shipping_address, items, subtotal, discount, tax, shipping, total, coupon_code, status, payment_provider, payment_order_id, payment_id, created_at)
VALUES
    ('o1', 'GFT-A1B2C3-9F3K',
     'Sara Malhotra', 'sara@example.com', '+91 98765 43210',
     '{"fullName":"Sara Malhotra","phone":"+91 98765 43210","line1":"12 Lotus Lane","city":"Chennai","state":"Tamil Nadu","postalCode":"600001","country":"India"}',
     '[{"productId":"p1","name":"The Bloom Box","price":649,"quantity":1}]',
     649, 0, 0, 0, 649, NULL,
     'delivered', 'razorpay', 'order_mock1', 'pay_mock1',
     '2026-06-02T10:20:00.000Z'),

    ('o2', 'GFT-D4E5F6-2M9L',
     'Rohan Iyer', 'rohan@example.com', '+91 91234 56780',
     '{"fullName":"Rohan Iyer","phone":"+91 91234 56780","line1":"44 Palm Grove","city":"Madurai","state":"Tamil Nadu","postalCode":"625001","country":"India"}',
     '[{"productId":"p5","name":"Golden Hour","price":899,"quantity":1},{"productId":"p9","name":"Cocoa Cloud","price":299,"quantity":2}]',
     1497, 149.7, 0, 0, 1347.3, 'WELCOME10',
     'processing', 'razorpay', 'order_mock2', 'pay_mock2',
     '2026-07-01T14:12:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE categories IS   'Seeded with 8 categories mirroring mock-data.ts';
COMMENT ON TABLE collections IS  'Seeded with 4 collections mirroring mock-data.ts';
COMMENT ON TABLE products IS     'Seeded with 11 products mirroring mock-data.ts';
COMMENT ON TABLE inventory IS    'Seeded with 11 rows (one per product) mirroring mock-data.ts stock values';
COMMENT ON TABLE reviews IS      'Seeded with 3 reviews mirroring mock-data.ts';
COMMENT ON TABLE banners IS      'Seeded with 3 banners mirroring mock-data.ts';
COMMENT ON TABLE coupons IS      'Seeded with 2 coupons mirroring mock-data.ts';
COMMENT ON TABLE blog_posts IS   'Seeded with 6 blog posts mirroring blog-data.ts';
COMMENT ON TABLE settings IS     'Seeded with 4 store settings (name, tagline, free shipping, currency)';
COMMENT ON TABLE orders IS       'Seeded with 2 orders mirroring mock-data.ts';

-- ============================================================
-- VERIFICATION
-- ============================================================

-- SELECT 'categories' AS tbl, COUNT(*) FROM categories
-- UNION ALL SELECT 'collections', COUNT(*) FROM collections
-- UNION ALL SELECT 'products', COUNT(*) FROM products
-- UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
-- UNION ALL SELECT 'inventory_alerts', COUNT(*) FROM inventory_alerts
-- UNION ALL SELECT 'product_collections', COUNT(*) FROM product_collections
-- UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
-- UNION ALL SELECT 'banners', COUNT(*) FROM banners
-- UNION ALL SELECT 'coupons', COUNT(*) FROM coupons
-- UNION ALL SELECT 'blog_posts', COUNT(*) FROM blog_posts
-- UNION ALL SELECT 'settings', COUNT(*) FROM settings
-- UNION ALL SELECT 'orders', COUNT(*) FROM orders;
-- Expected: categories 8, collections 4, products 11, inventory 11,
--           inventory_alerts 2, product_collections 11, reviews 3,
--           banners 3, coupons 2, blog_posts 6, settings 4, orders 2

-- ============================================================
-- ROLLBACK
-- ============================================================

-- TRUNCATE orders, blog_posts, settings, coupons, banners, reviews,
--           product_collections, inventory_alerts, inventory, products,
--           collections, categories CASCADE;
-- WARNING: This will delete ALL data. Only use on fresh databases.

COMMIT;