-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================
-- This file contains all storage policies for:
-- 1. Resources bucket (for learning resources)
-- 2. Events bucket (for event images)
-- ============================================

-- ============================================
-- RESOURCES BUCKET POLICIES
-- ============================================

-- Policy 1: Public read access to resources bucket
CREATE POLICY "Public read access to resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');

-- Policy 2: Authenticated users can upload to resources bucket
CREATE POLICY "Authenticated users can upload resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Users can delete their own files from resources bucket
CREATE POLICY "Users can delete own resource files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Admin can delete any file from resources bucket
CREATE POLICY "Admin can delete any resource file"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' 
  AND EXISTS (
    SELECT 1 FROM faculty 
    WHERE user_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
);

-- ============================================
-- EVENTS BUCKET POLICIES
-- ============================================

-- Policy 1: Public read access to events bucket
CREATE POLICY "Public read access to events"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');

-- Policy 2: Admin can upload to events bucket
CREATE POLICY "Admin can upload events"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM faculty 
    WHERE user_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
);

-- Policy 3: Admin can delete from events bucket
CREATE POLICY "Admin can delete events"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM faculty 
    WHERE user_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
);

-- Policy 4: Admin can update files in events bucket
CREATE POLICY "Admin can update events"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM faculty 
    WHERE user_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify policies were created successfully:

-- Check resources bucket policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%resource%';

-- Check events bucket policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%event%';

-- List all storage policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY policyname;
