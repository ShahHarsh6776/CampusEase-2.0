-- Create faculty_timetables table (similar to class_timetables but for individual faculty)
CREATE TABLE IF NOT EXISTS public.faculty_timetables (
    id BIGSERIAL PRIMARY KEY,
    faculty_id TEXT NOT NULL REFERENCES public.faculty(user_id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 5),
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 5),
    course TEXT NOT NULL,
    room TEXT DEFAULT '',
    class_name TEXT DEFAULT '',
    is_lab BOOLEAN DEFAULT false,
    batch_number INTEGER DEFAULT NULL,
    lab_id TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add timetable_url column to faculty table (if it doesn't exist)
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS timetable_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_faculty_timetables_faculty_id ON public.faculty_timetables(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_timetables_day_slot ON public.faculty_timetables(day_index, slot_index);
CREATE INDEX IF NOT EXISTS idx_faculty_timetables_lab_id ON public.faculty_timetables(lab_id) WHERE lab_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.faculty_timetables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faculty_timetables
DROP POLICY IF EXISTS "Authenticated users can view faculty timetables" ON public.faculty_timetables;
DROP POLICY IF EXISTS "Authenticated users can manage faculty timetables" ON public.faculty_timetables;

CREATE POLICY "Authenticated users can view faculty timetables" 
ON public.faculty_timetables
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage faculty timetables" 
ON public.faculty_timetables
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.faculty_timetables IS 'Stores individual faculty timetables with lab support';
COMMENT ON COLUMN public.faculty_timetables.faculty_id IS 'References faculty.user_id';
COMMENT ON COLUMN public.faculty_timetables.day_index IS 'Day of week: 0=Monday through 5=Saturday';
COMMENT ON COLUMN public.faculty_timetables.slot_index IS 'Time slot: 0-5 representing 6 daily time slots';
COMMENT ON COLUMN public.faculty_timetables.course IS 'Subject or course name';
COMMENT ON COLUMN public.faculty_timetables.room IS 'Room number or location';
COMMENT ON COLUMN public.faculty_timetables.class_name IS 'Class name for the scheduled session';
COMMENT ON COLUMN public.faculty_timetables.is_lab IS 'Whether this slot is part of a lab session';
COMMENT ON COLUMN public.faculty_timetables.batch_number IS 'Batch number for lab sessions (1-4)';
COMMENT ON COLUMN public.faculty_timetables.lab_id IS 'Groups lab slots that span multiple time periods';
COMMENT ON COLUMN public.faculty.timetable_url IS 'URL to faculty timetable PDF/image file in storage';
