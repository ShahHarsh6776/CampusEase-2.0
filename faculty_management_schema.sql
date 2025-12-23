-- Create faculty_subjects table to store subjects taught by faculty
CREATE TABLE IF NOT EXISTS public.faculty_subjects (
    id BIGSERIAL PRIMARY KEY,
    faculty_id TEXT NOT NULL REFERENCES public.faculty(user_id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(faculty_id, subject_code, department)
);

-- Create faculty_schedule table to track faculty teaching schedule
CREATE TABLE IF NOT EXISTS public.faculty_schedule (
    id BIGSERIAL PRIMARY KEY,
    faculty_id TEXT NOT NULL REFERENCES public.faculty(user_id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES public.class_details(class_id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 5),
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 5),
    subject TEXT NOT NULL,
    room TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(faculty_id, class_id, day_index, slot_index)
);

-- Add department column to faculty table (if it doesn't exist)
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add mobile_num column to faculty table (if it doesn't exist)
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS mobile_num TEXT;

-- Ensure id column has a default value (UUID auto-generation)
-- Faculty table uses UUID, so we set default to gen_random_uuid()
ALTER TABLE public.faculty 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add additional_departments column to faculty table (for cross-department teaching)
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS additional_departments TEXT[];

-- Add specialization column to faculty table
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faculty_subjects_faculty_id ON public.faculty_subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_subjects_department ON public.faculty_subjects(department);
CREATE INDEX IF NOT EXISTS idx_faculty_schedule_faculty_id ON public.faculty_schedule(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_schedule_class_id ON public.faculty_schedule(class_id);

-- Enable Row Level Security
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faculty table (drop existing policies first if they exist)
DROP POLICY IF EXISTS "Authenticated users can view faculty" ON public.faculty;
DROP POLICY IF EXISTS "Authenticated users can insert faculty" ON public.faculty;
DROP POLICY IF EXISTS "Authenticated users can update faculty" ON public.faculty;
DROP POLICY IF EXISTS "Authenticated users can delete faculty" ON public.faculty;

CREATE POLICY "Authenticated users can view faculty" 
ON public.faculty
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert faculty" 
ON public.faculty
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update faculty" 
ON public.faculty
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete faculty" 
ON public.faculty
FOR DELETE
TO authenticated
USING (true);

-- RLS Policies for faculty_subjects
CREATE POLICY "Authenticated users can view faculty subjects" 
ON public.faculty_subjects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage faculty subjects" 
ON public.faculty_subjects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for faculty_schedule
CREATE POLICY "Authenticated users can view faculty schedule" 
ON public.faculty_schedule
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage faculty schedule" 
ON public.faculty_schedule
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.faculty_subjects IS 'Stores subjects that can be taught by each faculty member';
COMMENT ON TABLE public.faculty_schedule IS 'Stores teaching schedule for faculty members across different classes';
COMMENT ON COLUMN public.faculty.additional_departments IS 'List of additional departments where faculty can teach (cross-department teaching)';
COMMENT ON COLUMN public.faculty.specialization IS 'Faculty specialization or area of expertise';
COMMENT ON COLUMN public.faculty_subjects.faculty_id IS 'References faculty.user_id';
COMMENT ON COLUMN public.faculty_subjects.subject_name IS 'Full name of the subject';
COMMENT ON COLUMN public.faculty_subjects.subject_code IS 'Unique code for the subject';
COMMENT ON COLUMN public.faculty_subjects.department IS 'Department offering this subject';
COMMENT ON COLUMN public.faculty_schedule.faculty_id IS 'References faculty.user_id';
COMMENT ON COLUMN public.faculty_schedule.class_id IS 'References class_details.class_id';
COMMENT ON COLUMN public.faculty_schedule.day_index IS 'Day of week: 0=Monday through 5=Saturday';
COMMENT ON COLUMN public.faculty_schedule.slot_index IS 'Time slot: 0-5 representing 6 daily time slots';
