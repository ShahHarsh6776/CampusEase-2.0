-- ============================================
-- COMPREHENSIVE FIX: Disable RLS on ALL Tables
-- ============================================
-- This disables RLS on all tables that use custom authentication
-- ============================================

-- 1. RESOURCES TABLE
ALTER TABLE IF EXISTS public.resources DISABLE ROW LEVEL SECURITY;

-- 2. EVENT TABLE
ALTER TABLE IF EXISTS public.event DISABLE ROW LEVEL SECURITY;

-- 3. EVENT_REGISTRATIONS TABLE  
ALTER TABLE IF EXISTS public.event_registrations DISABLE ROW LEVEL SECURITY;

-- Note: Cannot disable RLS on storage.objects (requires superuser)
-- Instead, manually create buckets in Supabase Dashboard:
-- 1. Go to Storage → Create bucket "events" → Check "Public bucket"
-- 2. Go to Storage → Create bucket "resources" → Check "Public bucket"

-- Verify all are disabled
SELECT 
    schemaname,
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN '❌ RLS Enabled' ELSE '✅ RLS Disabled' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('resources', 'event', 'event_registrations')
ORDER BY schemaname, tablename;

-- Test queries
SELECT 'Resources count:' as test, COUNT(*) as count FROM resources
UNION ALL
SELECT 'Events count:' as test, COUNT(*) as count FROM event
UNION ALL
SELECT 'Event registrations count:' as test, COUNT(*) as count FROM event_registrations;
