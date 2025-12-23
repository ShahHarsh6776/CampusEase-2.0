# Resources System Setup Guide

## Overview
Complete resource management system with upload, approval workflow, and role-based access control.

## Features
✅ **All roles can upload**: Students, Faculty, and Admin
✅ **Auto-approval for Faculty**: Faculty uploads are instantly visible
✅ **Admin approval for Students**: Student uploads require admin approval
✅ **Subject-based organization**: Filter by subject
✅ **Search functionality**: Search by title and description
✅ **Download resources**: Direct download links
✅ **Admin dashboard**: Approve/reject pending uploads

---

## Setup Instructions

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click **"New bucket"**
3. Configure:
   - Name: `resources`
   - Public bucket: ✅ **Check this box** (for public downloads)
   - File size limit: 50 MB (optional)
   - Allowed MIME types: Leave empty for all types
4. Click **"Create bucket"**

### Step 2: Set Storage Policies

After creating the bucket, click on the `resources` bucket and go to **Policies** tab.

**Policy 1: Public Read Access**
- Click **"New policy"**
- Template: Custom
- Name: `Public read access`
- Target roles: `public`
- Policy definition:
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'resources');
```

**Policy 2: Authenticated Upload**
- Click **"New policy"**
- Name: `Authenticated users can upload`
- Target roles: `authenticated`
- Policy definition:
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
);
```

**Policy 3: Delete Own Files**
- Click **"New policy"**
- Name: `Users can delete own files`
- Target roles: `authenticated`
- Policy definition:
```sql
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resources' 
  AND auth.role() = 'authenticated'
);
```

### Step 3: Apply Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Click **"New query"**
3. Copy and paste the entire contents of `resources_schema.sql`
4. Click **"Run"**
5. Verify success message

### Step 4: Verify Tables & Policies

Check that the following were created:

**Table:**
```sql
SELECT * FROM resources LIMIT 1;
```

**RLS Policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'resources';
```

Should see 9 policies:
- Anyone can view approved resources
- Users can view their own uploads
- Authenticated users can insert resources
- Admin can update any resource
- Users can update their own pending resources
- Admin can delete any resource
- Users can delete their own pending resources
- Faculty can approve resources
- Admin can approve resources

### Step 5: Test the System

#### Test 1: Faculty Upload (Auto-approved)
1. Login as Faculty
2. Go to Resources page
3. Click **"Upload Resource"**
4. Fill form and upload a file
5. Verify: Resource appears immediately in Browse tab ✅

#### Test 2: Student Upload (Requires approval)
1. Login as Student
2. Upload a resource
3. Verify: Toast says "Waiting for admin approval" ✅
4. Check: Resource NOT visible in Browse tab yet ⏳

#### Test 3: Admin Approval
1. Login as Admin
2. Go to Resources → **"Pending Approval"** tab
3. See student's uploaded resource
4. Click **"Approve"**
5. Verify: Resource now visible in Browse tab ✅

#### Test 4: Search & Filter
1. Search for resource by title
2. Filter by subject
3. Download a resource ✅

---

## Usage Guide

### For Students
1. **Upload Resource**: Click "Upload Resource" button
2. Fill in title, subject, description
3. Select file (PDF, DOC, PPT, etc.)
4. Wait for admin approval
5. Browse approved resources

### For Faculty
1. **Upload Resource**: Same as student
2. **Auto-approval**: Resources published immediately
3. Browse and download resources

### For Admin
1. **Upload Resource**: Auto-approved like faculty
2. **Approve Uploads**: Check "Pending Approval" tab
3. **Review**: Preview file before approval
4. **Approve/Reject**: Click approve or delete
5. **Manage**: Delete any resource if needed

---

## File Upload Configuration

**Supported File Types:**
- PDF (.pdf)
- Word (.doc, .docx)
- PowerPoint (.ppt, .pptx)
- Text (.txt)
- Archives (.zip)

**File Size Limit:** 50 MB (default)

**Storage Path:** `resources/{user_id}_{timestamp}.{extension}`

---

## Database Schema Overview

### Table: `resources`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| title | VARCHAR(255) | Resource title |
| description | TEXT | Optional description |
| subject | VARCHAR(100) | Subject name |
| file_url | TEXT | Storage URL |
| file_name | VARCHAR(255) | Original filename |
| file_type | VARCHAR(50) | MIME type |
| file_size | BIGINT | Size in bytes |
| uploaded_by | VARCHAR(255) | User ID |
| uploader_name | VARCHAR(255) | Full name |
| uploader_role | VARCHAR(20) | student/faculty/admin |
| department | VARCHAR(10) | Department code |
| semester | INTEGER | Semester number |
| is_approved | BOOLEAN | Approval status |
| approved_by | VARCHAR(255) | Approver ID |
| approved_at | TIMESTAMP | Approval time |
| created_at | TIMESTAMP | Upload time |
| updated_at | TIMESTAMP | Last update |

### Approval Logic

```
Student Upload → is_approved = FALSE → Admin reviews → Approve → is_approved = TRUE → Visible to all
Faculty Upload → is_approved = TRUE (auto) → Visible to all immediately
Admin Upload → is_approved = TRUE (auto) → Visible to all immediately
```

---

## Troubleshooting

### Issue: "Failed to upload resource"
**Solution:** Check storage bucket exists and policies are set

### Issue: Resources not visible
**Solution:** Check `is_approved` status and RLS policies

### Issue: "Failed to approve resource"
**Solution:** Verify admin role in `faculty` table

### Issue: File upload fails
**Solution:** 
- Check file size < 50MB
- Verify file type is supported
- Check storage bucket permissions

---

## Security Features

✅ **Row Level Security (RLS)**: All queries filtered by policies
✅ **Role-based access**: Students/Faculty/Admin permissions
✅ **Approval workflow**: Student uploads require review
✅ **Own uploads visible**: Users always see their pending uploads
✅ **Public read**: Approved resources accessible to all authenticated users

---

## Next Steps

After setup is complete:

1. ✅ Create storage bucket
2. ✅ Apply database schema
3. ✅ Test all upload scenarios
4. ✅ Verify approval workflow
5. ✅ Add more subjects if needed (edit subjects array in Resources.tsx)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase dashboard for storage/database
3. Check RLS policies are enabled
4. Verify user role in `faculty` table

