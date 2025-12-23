-- ============================================
-- DEBUG: Check what's actually in the resources table
-- ============================================

-- 1. See all resources with their uploaded_by values
SELECT 
    id,
    title,
    uploaded_by,
    uploader_name,
    uploader_role,
    is_approved,
    created_at
FROM resources
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check the student's record in student_records table
SELECT user_id, fname, lname, email
FROM student_records
WHERE user_id = '23DIT007';

-- 3. Check what auth.uid() returns for current session
SELECT auth.uid() as current_auth_uid;

-- 4. Check faculty table for this user
SELECT user_id, fname, lname, role
FROM faculty
WHERE user_id = '23DIT007';

-- ============================================
-- If uploaded_by contains UUID instead of user_id, run this fix:
-- ============================================
-- This will update existing resources to use the correct user_id format

-- First, let's see if we need to fix any records
SELECT 
    r.id,
    r.title,
    r.uploaded_by as current_uploaded_by,
    COALESCE(s.user_id, f.user_id) as should_be_uploaded_by,
    r.uploader_name
FROM resources r
LEFT JOIN student_records s ON r.uploader_name = CONCAT(s.fname, ' ', s.lname)
LEFT JOIN faculty f ON r.uploader_name = CONCAT(f.fname, ' ', f.lname)
WHERE r.uploaded_by != COALESCE(s.user_id, f.user_id)
ORDER BY r.created_at DESC;
