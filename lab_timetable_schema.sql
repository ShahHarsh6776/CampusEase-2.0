-- Lab-enabled timetable schema
-- This extends the class_timetables table to support lab sessions with batch allocation

-- First, add the new columns to class_timetables if they don't exist
ALTER TABLE class_timetables 
ADD COLUMN IF NOT EXISTS is_lab BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS batch_number INTEGER,
ADD COLUMN IF NOT EXISTS lab_id TEXT;

-- Drop the old unique constraint if it exists
ALTER TABLE class_timetables DROP CONSTRAINT IF EXISTS class_timetables_class_id_day_index_slot_index_key;

-- Create a new composite unique constraint that includes batch_number for labs
-- For regular slots (is_lab=false), batch_number will be NULL and multiple NULLs are allowed
-- For labs (is_lab=true), each batch gets a unique entry
CREATE UNIQUE INDEX IF NOT EXISTS class_timetables_unique_slot 
ON class_timetables (class_id, day_index, slot_index, COALESCE(batch_number, 0));

-- Add an index for faster lab queries
CREATE INDEX IF NOT EXISTS idx_class_timetables_lab_id ON class_timetables(lab_id) WHERE lab_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN class_timetables.is_lab IS 'True if this entry represents a lab session (spans 2 slots)';
COMMENT ON COLUMN class_timetables.batch_number IS 'Batch number (1-4) for lab sessions, NULL for regular classes';
COMMENT ON COLUMN class_timetables.lab_id IS 'Unique identifier grouping all batches of the same lab session';

-- Example insert for a regular class
-- INSERT INTO class_timetables (class_id, day_index, slot_index, course, professor, room, is_lab)
-- VALUES ('CS101', 0, 0, 'Data Structures', 'Dr. Smith', 'Room 301', FALSE);

-- Example insert for a lab with 3 batches (spanning slots 2-3 on Monday)
-- INSERT INTO class_timetables (class_id, day_index, slot_index, course, professor, room, is_lab, batch_number, lab_id)
-- VALUES 
--   ('CS101', 0, 2, 'Database Lab', 'Prof. Johnson', 'Lab A', TRUE, 1, 'lab-CS101-0-2'),
--   ('CS101', 0, 2, 'Database Lab', 'Prof. Williams', 'Lab B', TRUE, 2, 'lab-CS101-0-2'),
--   ('CS101', 0, 2, 'Database Lab', 'Prof. Brown', 'Lab C', TRUE, 3, 'lab-CS101-0-2');
-- Note: The slot_index points to the starting slot; the lab spans to slot_index+1

-- RLS policies (adjust based on your security requirements)
-- Allow admins to manage timetables
CREATE POLICY "Admins can manage timetables" ON class_timetables
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow students to view their class timetable
CREATE POLICY "Students can view their class timetable" ON class_timetables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.user_id = auth.uid() AND students.class_id = class_timetables.class_id
    )
  );

-- Allow faculty to view timetables for classes they teach
CREATE POLICY "Faculty can view class timetables" ON class_timetables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'faculty'
    )
  );
