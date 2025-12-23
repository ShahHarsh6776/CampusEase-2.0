-- ============================================
-- FIX: Events Table RLS for Custom Authentication
-- ============================================
-- Disable RLS on event and event_registrations tables
-- since you're using custom authentication (not Supabase Auth)
-- ============================================

-- Disable RLS on event table
ALTER TABLE public.event DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on event table
DROP POLICY IF EXISTS "Anyone can view events" ON public.event;
DROP POLICY IF EXISTS "Admin can insert events" ON public.event;
DROP POLICY IF EXISTS "Admin can update events" ON public.event;
DROP POLICY IF EXISTS "Admin can delete events" ON public.event;

-- Disable RLS on event_registrations table
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on event_registrations table
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Authenticated users can register" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can delete own registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Admin can update any registration" ON public.event_registrations;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('event', 'event_registrations');
-- Both should show rowsecurity = false

-- Test queries - should now work
SELECT id, "Ename", "Etype", status, capacity, registered_count
FROM event
ORDER BY "Date" DESC
LIMIT 5;

SELECT COUNT(*) as total_events FROM event;
SELECT COUNT(*) as total_registrations FROM event_registrations;
