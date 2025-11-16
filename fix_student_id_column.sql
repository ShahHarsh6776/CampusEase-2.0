-- Fix for student_records table columns issue
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  -- Add class_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_records' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE public.student_records ADD COLUMN class_id text;
    RAISE NOTICE 'Added class_id column to student_records table';
  END IF;

  -- Check if student_id column exists and handle it properly
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_records' AND column_name = 'student_id'
  ) THEN
    -- Add the column as nullable first
    ALTER TABLE public.student_records ADD COLUMN student_id text;
    
    -- Update existing rows to use roll_no as student_id
    UPDATE public.student_records 
    SET student_id = roll_no 
    WHERE student_id IS NULL OR student_id = '';
    
    -- Now make it NOT NULL
    ALTER TABLE public.student_records ALTER COLUMN student_id SET NOT NULL;
    
    RAISE NOTICE 'Added student_id column and populated with roll_no values';
  ELSE
    -- Column exists, check if any rows have null values
    IF EXISTS (SELECT 1 FROM public.student_records WHERE student_id IS NULL) THEN
      -- Update null values with roll_no
      UPDATE public.student_records 
      SET student_id = roll_no 
      WHERE student_id IS NULL OR student_id = '';
      
      RAISE NOTICE 'Updated null student_id values with roll_no';
    END IF;
    
    -- Ensure the column is NOT NULL
    ALTER TABLE public.student_records ALTER COLUMN student_id SET NOT NULL;
  END IF;
  
  -- Add unique constraint on student_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_student_id'
    AND table_name = 'student_records'
  ) THEN
    ALTER TABLE public.student_records 
    ADD CONSTRAINT unique_student_id 
    UNIQUE (student_id);
    
    RAISE NOTICE 'Added unique constraint on student_id';
  END IF;

  -- Add foreign key constraint to class_details if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_student_class'
    AND table_name = 'student_records'
  ) THEN
    -- Only add if class_details table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_details') THEN
      ALTER TABLE public.student_records 
      ADD CONSTRAINT fk_student_class 
      FOREIGN KEY (class_id) 
      REFERENCES public.class_details(class_id) 
      ON DELETE SET NULL;
      
      RAISE NOTICE 'Added foreign key constraint to class_details';
    END IF;
  END IF;
  
END
$$;

-- Verify the changes
SELECT 
  column_name, 
  is_nullable, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_records' 
  AND column_name IN ('student_id', 'roll_no', 'class_id')
ORDER BY column_name;

-- Insert some sample data for testing (if tables are empty)
INSERT INTO public.class_details (class_name, class_id, department, institute, semester, academic_year, course_taken)
VALUES 
  ('CSE A', 'CSE-A-2024', 'Computer Science', 'Engineering Institute', 5, '2024-25', 'B.Tech CSE'),
  ('CSE B', 'CSE-B-2024', 'Computer Science', 'Engineering Institute', 5, '2024-25', 'B.Tech CSE'),
  ('IT A', 'IT-A-2024', 'Information Technology', 'Engineering Institute', 3, '2024-25', 'B.Tech IT')
ON CONFLICT (class_id) DO NOTHING;

-- Insert some sample students (if table is empty)
INSERT INTO public.student_records (user_id, fname, lname, email, roll_no, student_id, class_id, course_taken)
VALUES 
  ('STU001', 'John', 'Doe', 'john.doe@example.com', '24DIT1658', '24DIT1658', 'CSE-A-2024', 'B.Tech CSE'),
  ('STU002', 'Jane', 'Smith', 'jane.smith@example.com', '24DIT1659', '24DIT1659', 'CSE-A-2024', 'B.Tech CSE'),
  ('STU003', 'Mike', 'Johnson', 'mike.johnson@example.com', '24DIT1660', '24DIT1660', 'CSE-B-2024', 'B.Tech CSE'),
  ('STU004', 'Sarah', 'Wilson', 'sarah.wilson@example.com', '24DIT1661', '24DIT1661', 'IT-A-2024', 'B.Tech IT')
ON CONFLICT (user_id) DO NOTHING;

-- Verify the data
SELECT 'Classes' as table_name, count(*) as row_count FROM public.class_details
UNION ALL
SELECT 'Students' as table_name, count(*) as row_count FROM public.student_records;