-- Migration: Add email column to pre_users and backfill values safely
-- Purpose: Align database with application which expects `email` on pre_users
-- Safe to run multiple times

-- 1) Add column if it does not exist (without constraints first to avoid failures)
ALTER TABLE public.pre_users
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2) Backfill missing emails
-- If username already looks like an email (contains '@'), use it as email
-- Otherwise, append domain '@ciliosclick.com'
UPDATE public.pre_users
SET email = CASE
  WHEN position('@' in username) > 0 THEN username
  ELSE username || '@ciliosclick.com'
END
WHERE email IS NULL;

-- 3) Optional: Add a UNIQUE index on lower(email) if it does not exist
-- Note: This will fail if there are duplicate non-null emails. If it fails, remove duplicates first.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_pre_users_email_unique'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX idx_pre_users_email_unique ON public.pre_users ((lower(email)));
    EXCEPTION WHEN duplicate_table THEN
      -- Index already exists (race condition), ignore
      NULL;
    WHEN unique_violation THEN
      -- Duplicates exist, skip creating unique index. Handle manually later.
      RAISE NOTICE 'Skipping unique index creation on pre_users.email due to duplicates. Please deduplicate first.';
    END;
  END IF;
END $$;

-- 4) (Optional) Make email NOT NULL if all rows have email set and there are no duplicates
-- Commented out to avoid breaking existing data. Uncomment after ensuring data quality.
-- ALTER TABLE public.pre_users ALTER COLUMN email SET NOT NULL;