-- Enhanced Attendance System Database Schema Update
-- Run this in Supabase SQL Editor to support the enhanced faculty attendance system

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

-- Migrate existing data if user_id is empty but student_id has data
UPDATE public.attendance 
SET user_id = student_id 
WHERE user_id IS NULL AND student_id IS NOT NULL;

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

-- Create foreign key relationship to student_records if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_attendance_student') THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT fk_attendance_student 
        FOREIGN KEY (user_id) REFERENCES public.student_records(user_id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to student_records';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key to student_records - table or column may not exist';
END $$;

-- Create foreign key relationship to class_details if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_attendance_class') THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT fk_attendance_class 
        FOREIGN KEY (class_id) REFERENCES public.class_details(class_id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to class_details';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key to class_details - table or column may not exist';
END $$;

-- Update the unique constraint to use user_id instead of student_id
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'unique_attendance') THEN
        ALTER TABLE public.attendance DROP CONSTRAINT unique_attendance;
        RAISE NOTICE 'Dropped old unique_attendance constraint';
    END IF;
    
    -- Add new constraint with user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_attendance_user') THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT unique_attendance_user 
        UNIQUE (user_id, date, subject, class_id, marked_by);
        RAISE NOTICE 'Added new unique_attendance_user constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update unique constraints - may need manual intervention';
END $$;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_department ON public.attendance(department);
CREATE INDEX IF NOT EXISTS idx_attendance_roll_no ON public.attendance(roll_no);
CREATE INDEX IF NOT EXISTS idx_attendance_faculty_name ON public.attendance(faculty_name);

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

-- Add helpful comments
COMMENT ON TABLE public.attendance IS 'Enhanced attendance table supporting class-based faculty attendance management';
COMMENT ON COLUMN public.attendance.user_id IS 'References student_records.user_id (replaces student_id)';
COMMENT ON COLUMN public.attendance.class_id IS 'References class_details.class_id for class association';
COMMENT ON COLUMN public.attendance.roll_no IS 'Student roll number for easy reference';
COMMENT ON COLUMN public.attendance.department IS 'Student department for filtering and reporting';
COMMENT ON COLUMN public.attendance.faculty_name IS 'Name of faculty member who marked attendance';