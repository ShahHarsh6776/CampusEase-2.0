-- ============================================
-- FIX RESOURCES RLS POLICIES
-- ============================================
-- This script fixes the Row Level Security policies for the resources table
-- to ensure admin can see all resources and users can see their own pending uploads
-- ============================================

-- First, drop all existing SELECT policies on resources
DROP POLICY IF EXISTS "Anyone can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.resources;
DROP POLICY IF EXISTS "Admin can view all resources" ON public.resources;

-- Create new simplified SELECT policies

-- Policy 1: Everyone can see approved resources
CREATE POLICY "View approved resources"
ON public.resources
FOR SELECT
TO authenticated
USING (is_approved = true);

-- Policy 2: Users can always see their own uploads (approved or pending)
CREATE POLICY "View own uploads"
ON public.resources
FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid()::text);

-- Policy 3: Admin can see ALL resources (approved and pending from everyone)
CREATE POLICY "Admin view all"
ON public.resources
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- Verify the policies were created
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'resources' AND cmd = 'SELECT'
ORDER BY policyname;
