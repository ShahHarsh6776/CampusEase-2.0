-- Quick fix for attendance constraint issue
-- Run this in Supabase SQL Editor

-- Drop the problematic constraint
DO $$
BEGIN
    -- Drop the current constraint that includes class_id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'unique_attendance_user') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT unique_attendance_user;
        RAISE NOTICE 'Dropped problematic unique_attendance_user constraint';
    END IF;
    
    -- Add a better constraint without class_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_daily_attendance') THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT unique_daily_attendance 
        UNIQUE (user_id, date, subject, marked_by);
        RAISE NOTICE 'Added new unique_daily_attendance constraint';
    END IF;
END $$;

-- Clear any existing attendance records to start fresh (optional - only if needed)
-- TRUNCATE TABLE public.attendance;

-- Verify the constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'attendance' 
AND constraint_type = 'UNIQUE';