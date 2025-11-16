-- Update attendance table schema to support enhanced faculty attendance system
-- Run this in Supabase SQL Editor

-- First, let's add the new columns to the attendance table safely
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist (replaces student_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance' AND column_name = 'user_id') THEN
        ALTER TABLE public.attendance ADD COLUMN user_id text;
        RAISE NOTICE 'Added user_id column to attendance table';
    END IF;

    -- Add class_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance' AND column_name = 'class_id') THEN
        ALTER TABLE public.attendance ADD COLUMN class_id text;
        RAISE NOTICE 'Added class_id column to attendance table';
    END IF;

    -- Add roll_no column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance' AND column_name = 'roll_no') THEN
        ALTER TABLE public.attendance ADD COLUMN roll_no text;
        RAISE NOTICE 'Added roll_no column to attendance table';
    END IF;

    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance' AND column_name = 'department') THEN
        ALTER TABLE public.attendance ADD COLUMN department text;
        RAISE NOTICE 'Added department column to attendance table';
    END IF;

    -- Add faculty_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance' AND column_name = 'faculty_name') THEN
        ALTER TABLE public.attendance ADD COLUMN faculty_name text;
        RAISE NOTICE 'Added faculty_name column to attendance table';
    END IF;
END $$;

-- Set class_id based on student records if available
UPDATE public.attendance a
SET class_id = sr.class_id
FROM public.student_records sr
WHERE a.user_id = sr.user_id AND a.class_id IS NULL;

-- Set roll_no based on student records if available
UPDATE public.attendance a
SET roll_no = sr.roll_no
FROM public.student_records sr
WHERE a.user_id = sr.user_id AND a.roll_no IS NULL;

-- Set department based on student records if available
UPDATE public.attendance a
SET department = sr.department
FROM public.student_records sr
WHERE a.user_id = sr.user_id AND a.department IS NULL;

-- Update the unique constraint to use user_id instead of student_id
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'unique_attendance') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT unique_attendance;
        RAISE NOTICE 'Dropped old unique_attendance constraint';
    END IF;
    
    -- Drop the problematic constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'unique_attendance_user') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT unique_attendance_user;
        RAISE NOTICE 'Dropped problematic unique_attendance_user constraint';
    END IF;
    
    -- Add new constraint without class_id to prevent conflicts
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_daily_attendance') THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT unique_daily_attendance 
        UNIQUE (user_id, date, subject, marked_by);
        RAISE NOTICE 'Added new unique_daily_attendance constraint';
    END IF;
END $$;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_department ON public.attendance(department);
CREATE INDEX IF NOT EXISTS idx_attendance_roll_no ON public.attendance(roll_no);

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- Show sample data to verify
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT user_id) as unique_students,
       COUNT(DISTINCT class_id) as unique_classes,
       COUNT(DISTINCT date) as unique_dates
FROM public.attendance;