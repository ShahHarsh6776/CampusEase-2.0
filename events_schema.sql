-- ============================================
-- PROFESSIONAL EVENTS MANAGEMENT SYSTEM SCHEMA
-- ============================================
-- Features: Event creation, registration, capacity tracking, categories, RSVP system
-- Roles: Admin creates/manages events, all roles can register
-- ============================================

-- Drop existing tables if they exist (to update structure)
DROP TABLE IF EXISTS event_registrations CASCADE;

-- Update existing event table structure
-- If event table doesn't exist, create it. If it exists, add new columns.

-- First, check if we need to update the existing event table
DO $$ 
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'capacity') THEN
    ALTER TABLE event ADD COLUMN capacity INTEGER DEFAULT 50;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'registered_count') THEN
    ALTER TABLE event ADD COLUMN registered_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'status') THEN
    ALTER TABLE event ADD COLUMN status VARCHAR(20) DEFAULT 'upcoming';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'department') THEN
    ALTER TABLE event ADD COLUMN department VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'created_by') THEN
    ALTER TABLE event ADD COLUMN created_by VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'created_at') THEN
    ALTER TABLE event ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'updated_at') THEN
    ALTER TABLE event ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'contact_email') THEN
    ALTER TABLE event ADD COLUMN contact_email VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'contact_phone') THEN
    ALTER TABLE event ADD COLUMN contact_phone VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'speaker') THEN
    ALTER TABLE event ADD COLUMN speaker VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event' AND column_name = 'registration_deadline') THEN
    ALTER TABLE event ADD COLUMN registration_deadline TIMESTAMP;
  END IF;
END $$;

-- Create event_registrations table for RSVP tracking
CREATE TABLE IF NOT EXISTS event_registrations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('student', 'faculty', 'admin')),
  department VARCHAR(50),
  semester INTEGER,
  phone_number VARCHAR(20),
  registration_date TIMESTAMP DEFAULT NOW(),
  attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
  
  -- Ensure one registration per user per event
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_date ON event("Date");
CREATE INDEX IF NOT EXISTS idx_event_type ON event("Etype");
CREATE INDEX IF NOT EXISTS idx_event_status ON event(status);
CREATE INDEX IF NOT EXISTS idx_event_department ON event(department);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(attendance_status);

-- Enable Row Level Security
ALTER TABLE event ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event table

-- Everyone can view all events
DROP POLICY IF EXISTS "Anyone can view events" ON event;
CREATE POLICY "Anyone can view events" ON event
  FOR SELECT USING (true);

-- Only admin can insert events
DROP POLICY IF EXISTS "Admin can insert events" ON event;
CREATE POLICY "Admin can insert events" ON event
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM faculty 
      WHERE user_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    )
  );

-- Only admin can update events
DROP POLICY IF EXISTS "Admin can update events" ON event;
CREATE POLICY "Admin can update events" ON event
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM faculty 
      WHERE user_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    )
  );

-- Only admin can delete events
DROP POLICY IF EXISTS "Admin can delete events" ON event;
CREATE POLICY "Admin can delete events" ON event
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM faculty 
      WHERE user_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    )
  );

-- RLS Policies for event_registrations table

-- Anyone can view all registrations (for capacity checking)
DROP POLICY IF EXISTS "Anyone can view registrations" ON event_registrations;
CREATE POLICY "Anyone can view registrations" ON event_registrations
  FOR SELECT USING (true);

-- Authenticated users can register for events
DROP POLICY IF EXISTS "Authenticated users can register" ON event_registrations;
CREATE POLICY "Authenticated users can register" ON event_registrations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own registrations (cancel, etc.)
DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;
CREATE POLICY "Users can update own registrations" ON event_registrations
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Users can delete their own registrations
DROP POLICY IF EXISTS "Users can delete own registrations" ON event_registrations;
CREATE POLICY "Users can delete own registrations" ON event_registrations
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Admin can update any registration (mark attendance, etc.)
DROP POLICY IF EXISTS "Admin can update any registration" ON event_registrations;
CREATE POLICY "Admin can update any registration" ON event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM faculty 
      WHERE user_id = auth.jwt() ->> 'sub' 
      AND role = 'admin'
    )
  );

-- Function to update event registered_count
CREATE OR REPLACE FUNCTION update_event_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE event 
    SET registered_count = registered_count + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE event 
    SET registered_count = GREATEST(registered_count - 1, 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update registered_count
DROP TRIGGER IF EXISTS update_event_count_trigger ON event_registrations;
CREATE TRIGGER update_event_count_trigger
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_registered_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on event table
DROP TRIGGER IF EXISTS update_event_updated_at ON event;
CREATE TRIGGER update_event_updated_at
BEFORE UPDATE ON event
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on event_registrations table
DROP TRIGGER IF EXISTS update_registration_updated_at ON event_registrations;
CREATE TRIGGER update_registration_updated_at
BEFORE UPDATE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE event IS 'Stores all campus events with details and capacity tracking';
COMMENT ON TABLE event_registrations IS 'Tracks user registrations/RSVPs for events';
COMMENT ON COLUMN event.capacity IS 'Maximum number of attendees allowed';
COMMENT ON COLUMN event.registered_count IS 'Current number of registered users (auto-updated)';
COMMENT ON COLUMN event.status IS 'Event status: upcoming, ongoing, completed, cancelled';
COMMENT ON COLUMN event_registrations.attendance_status IS 'Registration status: registered, attended, cancelled, no-show';
COMMENT ON TRIGGER update_event_count_trigger ON event_registrations IS 'Automatically updates registered_count in event table';

-- Sample event types for reference
-- Academic: Seminars, Workshops, Guest Lectures, Conferences
-- Social: Cultural Events, Festivals, Gatherings, Celebrations
-- Career: Job Fairs, Placement Drives, Industry Talks, Networking
-- Sports: Tournaments, Competitions, Sports Day
-- Technical: Hackathons, Coding Competitions, Tech Talks
-- Other: Miscellaneous events
