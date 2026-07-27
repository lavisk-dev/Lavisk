-- 016_storage_buckets.sql
-- Creates Supabase Storage buckets for media uploads.
-- Currently unused -- all uploads go through Cloudinary.
-- These buckets are infrastructure for future use.
-- Dependencies: none (storage schema)
-- Depended upon by: none

-- ============================================================
-- BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('banners',       'banners',       true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('blog-covers',   'blog-covers',   true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('collection-images', 'collection-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

CREATE POLICY "Public can read product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Public can read banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');

CREATE POLICY "Public can read blog-covers"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'blog-covers');

CREATE POLICY "Public can read collection-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'collection-images');

CREATE POLICY "Admin can upload product-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin can upload banners"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Admin can upload blog-covers"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'blog-covers');

CREATE POLICY "Admin can upload collection-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'collection-images');

CREATE POLICY "Admin can delete product-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-images');

CREATE POLICY "Admin can delete banners"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'banners');

CREATE POLICY "Admin can delete blog-covers"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'blog-covers');

CREATE POLICY "Admin can delete collection-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'collection-images');

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE storage.buckets IS 'Supabase Storage buckets for Lavisk media. Currently unused -- all uploads go through Cloudinary.';

-- ============================================================
-- VERIFICATION
-- ============================================================

-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id IN ('product-images', 'banners', 'blog-covers', 'collection-images');
-- -- Expected: 4 rows, all public = true

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DELETE FROM storage.buckets WHERE id IN ('product-images', 'banners', 'blog-covers', 'collection-images');
-- NOTE: This only removes the bucket configuration, not the actual stored files.
-- Since no files exist yet, this is safe.