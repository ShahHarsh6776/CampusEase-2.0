-- ============================================
-- ADD MISSING COLUMNS TO EVENT TABLE
-- ============================================

-- Add Description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'Description') THEN
    ALTER TABLE event ADD COLUMN "Description" TEXT;
  END IF;
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event'
ORDER BY ordinal_position;
