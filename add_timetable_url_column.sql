-- Add timetable_url column to class_details table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.class_details 
ADD COLUMN IF NOT EXISTS timetable_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN public.class_details.timetable_url IS 'URL to uploaded timetable file (PDF/image) stored in Supabase Storage';
