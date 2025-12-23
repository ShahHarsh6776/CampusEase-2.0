# Faculty Timetable Management - Implementation Summary

## What Has Been Completed

### 1. Database Schema (faculty_timetable_schema.sql)
✅ Created `faculty_timetables` table with full lab support
✅ Added `timetable_url` column to `faculty` table
✅ Set up RLS policies for authenticated users
✅ Created indexes for performance

### 2. Faculty Schedule Page (src/pages/FacultySchedule.tsx)
✅ Created complete faculty-facing schedule viewer
✅ Displays structured timetable in grid format
✅ Supports lab sessions with batch display
✅ Fallback to PDF/image viewer if no structured data
✅ Added route in App.tsx: `/faculty-schedule`
✅ Added navigation link in Header.tsx for faculty users

### 3. FacultyManagement.tsx - Partial Updates
✅ Added XLSX import for CSV/Excel support
✅ Added state management for timetable (manualTimetable, labMode, timetableFile)
✅ Added `SlotEntry` type definition with lab support
✅ Created `fetchFacultyTimetable()` function
✅ Created timetable upload, save, and import functions:
   - `handleTimetableUpload()` - Upload PDF/image to storage
   - `handleTimetableExcelImport()` - Import from CSV/Excel
   - `saveManualTimetable()` - Save structured timetable to database
   - `clearManualTimetable()` - Clear the editor
✅ Updated tabs to include "Timetable" tab

## What Needs to Be Completed

### FacultyManagement.tsx - Timetable Tab UI
The Timetable tab content needs to be added between the Subjects and Schedule tabs. This should include:

1. **Three upload methods** (similar to ClassManagement.tsx):
   - PDF/Image upload with file picker
   - CSV/Excel import button  
   - Manual editor activation button

2. **Manual Timetable Editor** with:
   - 6x6 grid (6 days × 6 time slots)
   - Editable inputs for: Course, Room, Class Name
   - Lab mode checkbox per slot
   - Batch selector (2-4 batches) when lab enabled
   - Save and Clear buttons

3. **Editable Preview Section** showing:
   - Student-view table rendering
   - Inline editing capability
   - Lab toggle checkboxes
   - Save changes button at top

## Implementation Guide

### Step 1: Run the Database Migration
```sql
-- Run this in Supabase SQL Editor
-- File: faculty_timetable_schema.sql
```

### Step 2: Add Timetable Tab Content to FacultyManagement.tsx

Insert this content after the `</TabsContent>` closing tag of the Subjects tab (around line 940):

```tsx
<TabsContent value="timetable" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Faculty Timetable Management</CardTitle>
      <CardDescription>
        Upload or create a weekly timetable for {selectedFaculty.fname} {selectedFaculty.lname}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Upload PDF/Image Section */}
      <div className="space-y-2">
        <Label>Upload Timetable (PDF/Image)</Label>
        <div className="flex gap-2">
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setTimetableFile(e.target.files?.[0] || null)}
          />
          <Button onClick={handleTimetableUpload} disabled={timetableUploading || !timetableFile}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
        {selectedFaculty.timetable_url && (
          <p className="text-xs text-green-600">Current: {selectedFaculty.timetable_url}</p>
        )}
      </div>

      {/* CSV/Excel Import */}
      <div className="space-y-2">
        <Label>Import from CSV/Excel</Label>
        <div className="flex gap-2">
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleTimetableExcelImport}
          />
        </div>
        <p className="text-xs text-gray-500">Format: Course|Room|Class Name per cell</p>
      </div>

      {/* Manual Editor */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Manual Timetable Editor</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearManualTimetable}>
              <Eraser className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button size="sm" onClick={saveManualTimetable} disabled={timetableSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Timetable
            </Button>
          </div>
        </div>
        
        {/* 6x6 Grid Editor - Copy from ClassManagement.tsx lines 1700-1950 */}
        {/* Replace 'professor' field with 'class_name' field */}
        {/* Update all state setters to use faculty timetable structure */}
      </div>
    </CardContent>
  </Card>

  {/* Editable Preview - Copy from ClassManagement.tsx lines 2200-2450 */}
  {/* Update to show Course, Class Name, Room instead of Course, Professor, Room */}
</TabsContent>
```

### Step 3: Test the Implementation

1. **Admin Side**:
   - Go to Faculty Management
   - Select a faculty member
   - Go to Timetable tab
   - Upload a PDF or create a structured timetable
   - Save and verify

2. **Faculty Side**:
   - Login as faculty
   - Navigate to "My Schedule" in header
   - Verify timetable displays correctly
   - Check lab sessions render properly

## Key Differences from Class Timetables

1. **Fields**: Faculty timetables use `course`, `room`, `class_name` (instead of `professor`)
2. **Storage**: Stored in `faculty_timetables` table (not `class_timetables`)
3. **Reference**: Uses `faculty_id` (faculty.user_id) as foreign key
4. **View**: Faculty see their own teaching schedule across multiple classes

## File Locations

- Database: `faculty_timetable_schema.sql`
- Faculty View: `src/pages/FacultySchedule.tsx`
- Admin Management: `src/pages/FacultyManagement.tsx` (needs tab content added)
- Routes: `src/App.tsx`
- Navigation: `src/components/Header.tsx`

## Notes

The timetable management UI in FacultyManagement.tsx requires copying significant code from ClassManagement.tsx with field name changes:
- Replace `professor` → `class_name`
- Replace `class_id` → `faculty_id`
- Use `faculty_timetables` table instead of `class_timetables`

All supporting functions are already in place. Only the tab UI content needs to be added.
