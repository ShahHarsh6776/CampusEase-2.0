-- ============================================
-- FIX: Resources RLS for Custom Authentication
-- ============================================
-- Since you're using custom authentication (not Supabase Auth),
-- we need to either disable RLS or use a simpler approach
-- ============================================

-- OPTION 1: Disable RLS entirely (simplest solution)
-- This makes resources table work with your custom authentication
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies since we're not using them
DROP POLICY IF EXISTS "select_approved_resources" ON public.resources;
DROP POLICY IF EXISTS "select_own_resources" ON public.resources;
DROP POLICY IF EXISTS "select_admin_all_resources" ON public.resources;
DROP POLICY IF EXISTS "insert_resources" ON public.resources;
DROP POLICY IF EXISTS "update_admin_resources" ON public.resources;
DROP POLICY IF EXISTS "update_own_pending_resources" ON public.resources;
DROP POLICY IF EXISTS "delete_admin_resources" ON public.resources;
DROP POLICY IF EXISTS "delete_own_pending_resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.resources;
DROP POLICY IF EXISTS "Admin can view all resources" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admin can update resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update their own pending resources" ON public.resources;
DROP POLICY IF EXISTS "Admin can delete resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete their own pending resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can approve resources" ON public.resources;
DROP POLICY IF EXISTS "Admin can approve resources" ON public.resources;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'resources';
-- Should show rowsecurity = false

-- Test query - should now return all resources
SELECT 
    id,
    title,
    uploaded_by,
    uploader_name,
    uploader_role,
    is_approved,
    created_at
FROM resources
ORDER BY created_at DESC;
