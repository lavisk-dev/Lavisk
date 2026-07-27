-- 005_create_blog_posts.sql
-- Creates the blog_posts table — editorial content with SEO metadata.
-- Dependencies: none
-- Depended upon by: none
-- Reuses: update_timestamp() function from 002_create_banners.sql

BEGIN;

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id                 TEXT PRIMARY KEY,
    slug               TEXT NOT NULL UNIQUE,
    title              TEXT NOT NULL,
    excerpt            TEXT NOT NULL,
    content            TEXT NOT NULL,
    author_name        TEXT NOT NULL,
    author_role        TEXT,
    category           TEXT NOT NULL,
    reading_minutes    INTEGER NOT NULL DEFAULT 3 CHECK (reading_minutes >= 1),
    cover_color_from   TEXT NOT NULL,
    cover_color_to     TEXT NOT NULL,
    cover_emoji        TEXT NOT NULL,
    cover_image_url    TEXT,
    cover_image_public_id TEXT,
    is_published       BOOLEAN NOT NULL DEFAULT FALSE,
    published_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    faq                JSONB,
    keywords           TEXT[]
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

-- slug: UNIQUE enforced inline
-- reading_minutes: CHECK >= 1 enforced inline

-- ============================================================
-- INDEXES
-- ============================================================

-- The UNIQUE constraint on slug already creates an index.

-- Covers listPublished(): WHERE is_published = true ORDER BY published_at DESC
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
    ON blog_posts (is_published, published_at DESC);

-- Covers listAll(): ORDER BY published_at DESC
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at
    ON blog_posts (published_at DESC);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE blog_posts IS
    'Editorial blog content. Fetched via BlogService.listPublished() (storefront) and BlogService.listAll() (future admin).';

COMMENT ON COLUMN blog_posts.slug IS
    'URL-friendly identifier. UNIQUE. Used for public blog post pages.';

COMMENT ON COLUMN blog_posts.excerpt IS
    'Short summary displayed in blog cards and meta descriptions.';

COMMENT ON COLUMN blog_posts.content IS
    'Full article body in Markdown.';

COMMENT ON COLUMN blog_posts.author_name IS
    'Display name of the author.';

COMMENT ON COLUMN blog_posts.author_role IS
    'Author role/title (e.g. "Head of Gifting"). Null if not specified.';

COMMENT ON COLUMN blog_posts.category IS
    'Content category (e.g. "Etiquette", "Care Guide"). Used for filtering and related posts.';

COMMENT ON COLUMN blog_posts.reading_minutes IS
    'Estimated reading time in minutes. Must be >= 1.';

COMMENT ON COLUMN blog_posts.cover_color_from IS
    'Start color for the card gradient background.';

COMMENT ON COLUMN blog_posts.cover_color_to IS
    'End color for the card gradient background.';

COMMENT ON COLUMN blog_posts.cover_emoji IS
    'Emoji displayed on the blog card cover.';

COMMENT ON COLUMN blog_posts.cover_image_url IS
    'Cloudinary or local URL for the cover image. Null uses the gradient + emoji fallback.';

COMMENT ON COLUMN blog_posts.cover_image_public_id IS
    'Cloudinary public ID for deletion and management. Null if not using Cloudinary.';

COMMENT ON COLUMN blog_posts.is_published IS
    'Controls visibility in the storefront. Filtered by BlogService.listPublished().';

COMMENT ON COLUMN blog_posts.published_at IS
    'Publication timestamp. Used for ordering by most recent.';

COMMENT ON COLUMN blog_posts.faq IS
    'FAQ entries for JSON-LD structured data. Array of {question, answer}. Null if no FAQ.';

COMMENT ON COLUMN blog_posts.keywords IS
    'Search keywords as a PostgreSQL text array. Used for related post matching and SEO.';

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- BlogService.listPublished() and listAll() use the anon client.
CREATE POLICY "Public can read blog posts"
    ON blog_posts
    FOR SELECT
    USING (true);

CREATE POLICY "Admin can insert blog posts"
    ON blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin can update blog posts"
    ON blog_posts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin can delete blog posts"
    ON blog_posts
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Run these after migration to confirm correctness:
--
-- INSERT INTO blog_posts (id, slug, title, excerpt, content, author_name, category, reading_minutes, cover_color_from, cover_color_to, cover_emoji, is_published, published_at, faq, keywords)
-- VALUES (
--   'blog_test', 'test-post', 'Test Post', 'A test excerpt.', 'Full article content here.',
--   'Test Author', 'Testing', 3, '#FFB6C9', '#FF8FA3', '🎁',
--   true, NOW(),
--   '[{"question":"Q1","answer":"A1"}]',
--   ARRAY['test', 'blog']
-- );
--
-- SELECT id, slug, title, is_published
-- FROM blog_posts WHERE slug = 'test-post';
-- -- Expected: 1 row, slug = 'test-post', is_published = true
--
-- SELECT faq, keywords FROM blog_posts WHERE id = 'blog_test';
-- -- Expected: faq = [{"question":"Q1","answer":"A1"}], keywords = {test,blog}
--
-- UPDATE blog_posts SET title = 'Updated Post' WHERE id = 'blog_test';
-- SELECT title FROM blog_posts WHERE id = 'blog_test';
-- -- Expected: title = 'Updated Post'
--
-- DELETE FROM blog_posts WHERE id = 'blog_test';
-- SELECT * FROM blog_posts WHERE id = 'blog_test';
-- -- Expected: 0 rows

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DROP TABLE IF EXISTS blog_posts;

COMMIT;