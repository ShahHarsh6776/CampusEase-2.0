-- ============================================
-- COMPREHENSIVE FIX FOR RESOURCES RLS POLICIES
-- ============================================
-- This fixes all issues with resources visibility
-- ============================================

-- Step 1: Drop ALL existing policies on resources table
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

-- Step 2: Create new, simplified policies

-- ============================================
-- SELECT (VIEW) POLICIES
-- ============================================

-- Everyone can see approved resources
CREATE POLICY "select_approved_resources"
ON public.resources
FOR SELECT
USING (is_approved = true);

-- Users can see their own uploads (approved or pending)
CREATE POLICY "select_own_resources"
ON public.resources
FOR SELECT
USING (uploaded_by = auth.uid()::text);

-- Admin can see ALL resources (check in faculty table)
CREATE POLICY "select_admin_all_resources"
ON public.resources
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- ============================================
-- INSERT POLICY
-- ============================================

-- All authenticated users can upload resources
CREATE POLICY "insert_resources"
ON public.resources
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- UPDATE POLICIES
-- ============================================

-- Admin can update any resource (for approval)
CREATE POLICY "update_admin_resources"
ON public.resources
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- Users can update their own pending resources
CREATE POLICY "update_own_pending_resources"
ON public.resources
FOR UPDATE
USING (
    uploaded_by = auth.uid()::text 
    AND is_approved = false
);

-- ============================================
-- DELETE POLICIES
-- ============================================

-- Admin can delete any resource
CREATE POLICY "delete_admin_resources"
ON public.resources
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- Users can delete their own pending resources
CREATE POLICY "delete_own_pending_resources"
ON public.resources
FOR DELETE
USING (
    uploaded_by = auth.uid()::text 
    AND is_approved = false
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'View'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Edit'
        WHEN cmd = 'DELETE' THEN 'Delete'
    END as action
FROM pg_policies 
WHERE tablename = 'resources'
ORDER BY cmd, policyname;

-- Test query to see what current user can see
-- Run this as different users to test
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
