-- 003_create_contacts.sql
-- Creates the contacts table — stores customer contact form submissions.
-- Submissions are write-once, read-forever (immutable customer inquiries).
-- Dependencies: none
-- Depended upon by: none

BEGIN;

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS contacts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONSTRAINTS
-- ============================================================

-- No UNIQUE or CHECK constraints beyond NOT NULL.
-- Multiple submissions from the same email are expected.
-- subject and message length validation is handled by the API layer (zod).

-- ============================================================
-- INDEXES
-- ============================================================

-- Covers future admin list queries (most recent first).
-- The current ContactService.list() is memory-only, but this index
-- is ready for the Supabase-backed implementation.
CREATE INDEX IF NOT EXISTS idx_contacts_created_at
    ON contacts (created_at DESC);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE contacts IS
    'Customer contact form submissions. Written via ContactService.create() (admin/service-role client). Read via admin panel.';

COMMENT ON COLUMN contacts.name IS
    'Customer full name as submitted via the contact form.';

COMMENT ON COLUMN contacts.email IS
    'Customer email address. Used for acknowledgement replies.';

COMMENT ON COLUMN contacts.subject IS
    'Submission subject line. Provided by the customer or auto-filled from form context.';

COMMENT ON COLUMN contacts.message IS
    'Submission body text. Free-form customer message.';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ContactService.create() uses the service-role (admin) client which
-- bypasses RLS, so the actual write path is unaffected by these policies.
-- These policies exist as defense-in-depth.

CREATE POLICY "Admin can read contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can insert contacts"
    ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin can delete contacts"
    ON contacts
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- No triggers. Contact submissions are immutable — no updated_at needed,
-- no derived columns, no cascade behavior.

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Run these after migration to confirm correctness:
--
-- INSERT INTO contacts (id, name, email, subject, message)
-- VALUES ('contact_test', 'Test User', 'test@example.com', 'Test Subject', 'Test message body.');
--
-- SELECT id, name, email, subject
-- FROM contacts WHERE id = 'contact_test';
-- -- Expected: 1 row, name = 'Test User', email = 'test@example.com'
--
-- DELETE FROM contacts WHERE id = 'contact_test';
-- SELECT * FROM contacts WHERE id = 'contact_test';
-- -- Expected: 0 rows

-- ============================================================
-- ROLLBACK
-- ============================================================

-- DROP TABLE IF EXISTS contacts;

COMMIT;