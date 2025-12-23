-- Create the class_timetables table
-- Run this in your Supabase SQL Editor first

CREATE TABLE IF NOT EXISTS public.class_timetables (
    id BIGSERIAL PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.class_details(class_id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 5),
    slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 5),
    course TEXT DEFAULT '',
    professor TEXT DEFAULT '',
    room TEXT DEFAULT '',
    is_lab BOOLEAN DEFAULT FALSE,
    batch_number INTEGER,
    lab_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique index to prevent duplicate entries
-- This allows multiple batches (different batch_numbers) for the same slot when is_lab=true
CREATE UNIQUE INDEX IF NOT EXISTS class_timetables_unique_slot 
ON public.class_timetables (class_id, day_index, slot_index, COALESCE(batch_number, 0));

-- Create index for faster lab queries
CREATE INDEX IF NOT EXISTS idx_class_timetables_lab_id 
ON public.class_timetables(lab_id) WHERE lab_id IS NOT NULL;

-- Create index for class_id lookups
CREATE INDEX IF NOT EXISTS idx_class_timetables_class_id 
ON public.class_timetables(class_id);

-- Enable Row Level Security
ALTER TABLE public.class_timetables ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all timetables
CREATE POLICY "Authenticated users can view timetables" 
ON public.class_timetables
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert/update/delete timetables
-- Note: You may want to restrict this to admins only by checking user role in your auth system
CREATE POLICY "Authenticated users can manage timetables" 
ON public.class_timetables
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.class_timetables IS 'Stores class timetables with support for regular slots and lab sessions with batches';
COMMENT ON COLUMN public.class_timetables.day_index IS 'Day of week: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday';
COMMENT ON COLUMN public.class_timetables.slot_index IS 'Time slot: 0=09:10-10:10, 1=10:10-11:10, 2=11:10-12:10, 3=12:10-01:10, 4=02:20-03:20, 5=03:20-04:20';
COMMENT ON COLUMN public.class_timetables.is_lab IS 'True if this is a lab session spanning 2 slots';
COMMENT ON COLUMN public.class_timetables.batch_number IS 'Batch number (1-4) for lab sessions, NULL for regular classes';
COMMENT ON COLUMN public.class_timetables.lab_id IS 'Groups all batches of the same lab session together';
