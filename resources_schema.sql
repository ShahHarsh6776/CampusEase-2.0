-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by TEXT NOT NULL,
    uploader_name TEXT NOT NULL,
    uploader_role TEXT NOT NULL CHECK (uploader_role IN ('student', 'faculty', 'admin')),
    department TEXT,
    semester INTEGER,
    is_approved BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_is_approved ON public.resources(is_approved);
CREATE INDEX IF NOT EXISTS idx_resources_department ON public.resources(department);
CREATE INDEX IF NOT EXISTS idx_resources_semester ON public.resources(semester);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
DROP POLICY IF EXISTS "Anyone can view approved resources" ON public.resources;
DROP POLICY IF EXISTS "Faculty can view all resources" ON public.resources;
DROP POLICY IF EXISTS "Admin can view all resources" ON public.resources;
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admin can update resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update their own pending resources" ON public.resources;
DROP POLICY IF EXISTS "Admin can delete resources" ON public.resources;
DROP POLICY IF EXISTS "Users can delete their own pending resources" ON public.resources;

-- View policies: Everyone sees approved resources, faculty/admin see all, users see their own
CREATE POLICY "Anyone can view approved resources" 
ON public.resources
FOR SELECT
TO authenticated
USING (is_approved = true);

CREATE POLICY "Users can view their own uploads" 
ON public.resources
FOR SELECT
TO authenticated
USING (auth.uid()::text = uploaded_by);

CREATE POLICY "Admin can view all resources" 
ON public.resources
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
        AND role = 'admin'
    )
);

-- Insert policy: All authenticated users can upload
CREATE POLICY "Authenticated users can insert resources" 
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update policy: Admin can approve/update any, users can update their own pending resources
CREATE POLICY "Admin can update resources" 
ON public.resources
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
        AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.student_records 
        WHERE user_id = auth.uid()::text 
        AND EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
    )
)
WITH CHECK (true);

CREATE POLICY "Users can update their own pending resources" 
ON public.resources
FOR UPDATE
TO authenticated
USING (auth.uid()::text = uploaded_by AND is_approved = false)
WITH CHECK (auth.uid()::text = uploaded_by);

-- Delete policy: Admin can delete any, users can delete their own pending
CREATE POLICY "Admin can delete resources" 
ON public.resources
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.faculty 
        WHERE user_id = auth.uid()::text 
    )
);

CREATE POLICY "Users can delete their own pending resources" 
ON public.resources
FOR DELETE
TO authenticated
USING (auth.uid()::text = uploaded_by AND is_approved = false);

-- Add comments for documentation
COMMENT ON TABLE public.resources IS 'Stores learning resources uploaded by students, faculty, and admin';
COMMENT ON COLUMN public.resources.title IS 'Title or name of the resource';
COMMENT ON COLUMN public.resources.description IS 'Description of the resource content';
COMMENT ON COLUMN public.resources.subject IS 'Subject/course this resource belongs to';
COMMENT ON COLUMN public.resources.file_url IS 'URL to the uploaded file in storage';
COMMENT ON COLUMN public.resources.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN public.resources.uploaded_by IS 'User ID of the uploader';
COMMENT ON COLUMN public.resources.uploader_role IS 'Role of the person who uploaded (student/faculty/admin)';
COMMENT ON COLUMN public.resources.is_approved IS 'Whether resource is approved for public viewing (faculty uploads auto-approved)';
COMMENT ON COLUMN public.resources.approved_by IS 'User ID of admin who approved the resource';
