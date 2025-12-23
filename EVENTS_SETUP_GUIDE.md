# Professional Events System Setup Guide

## Overview
Complete event management system with registration, capacity tracking, and admin dashboard - designed for professional campus event management.

## Features
✅ **Event Creation** (Admin only): Create events with full details
✅ **Event Registration/RSVP**: Students, faculty, and admin can register
✅ **Capacity Management**: Track registrations and prevent overbooking
✅ **Search & Filters**: Filter by category, status, and search
✅ **Registration Tracking**: View who's registered (admin)
✅ **Cancel Registration**: Users can cancel their RSVP
✅ **Event Details**: Full event info with speaker, contact details
✅ **Status Management**: Upcoming, ongoing, completed, cancelled
✅ **Image Upload**: Event photos with storage
✅ **Registration Deadlines**: Auto-close registration after deadline

---

## Setup Instructions

### Step 1: Create Storage Bucket for Event Images

1. Go to Supabase Dashboard → Storage
2. Click **"New bucket"**
3. Configure:
   - Name: `events`
   - Public bucket: ✅ **Check this box**
   - File size limit: 5 MB (recommended)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp` (optional)
4. Click **"Create bucket"**

### Step 2: Set Storage Policies for Events Bucket

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'events');
```

**Policy 2: Admin Upload**
```sql
CREATE POLICY "Admin can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM faculty 
    WHERE user_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
);
```

**Policy 3: Admin Delete**
```sql
CREATE POLICY "Admin can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'events' 
  AND EXISTS (
    SELECT 1 FROM faculty 
    WHERE user_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
);
```

### Step 3: Apply Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Click **"New query"**
3. Copy and paste the entire contents of `events_schema.sql`
4. Click **"Run"**
5. Verify success message

### Step 4: Verify Database Setup

**Check tables:**
```sql
SELECT * FROM event LIMIT 1;
SELECT * FROM event_registrations LIMIT 1;
```

**Check columns were added to event table:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event';
```

Should include:
- capacity, registered_count, status, department
- created_by, created_at, updated_at
- contact_email, contact_phone, speaker
- registration_deadline

**Check triggers:**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('event', 'event_registrations');
```

Should see:
- `update_event_count_trigger` - Auto-updates registered_count
- `update_event_updated_at` - Updates updated_at timestamp
- `update_registration_updated_at` - Updates registration timestamp

### Step 5: Test the System

#### Test 1: Admin Creates Event
1. Login as Admin
2. Go to Events page
3. Click **"Create Event"** button
4. Fill in details:
   - Event Name: "Tech Talk 2025"
   - Category: Academic
   - Date: Tomorrow
   - Time: 14:00
   - Location: Auditorium A
   - Capacity: 50
   - Upload image (optional)
5. Click **"Create Event"**
6. Verify: Event appears in grid ✅

#### Test 2: Student Registers for Event
1. Login as Student
2. Go to Events page
3. Find event and click **"Register"** button
4. Fill phone number and notes (optional)
5. Click **"Confirm Registration"**
6. Verify: 
   - "Registered" badge appears on event card ✅
   - Capacity shows: 1 / 50 registered ✅
   - Button changes to "Cancel" ✅

#### Test 3: Check Registration (Admin)
1. Login as Admin
2. Go to Events page
3. Click **"Details"** on event
4. See registrations list at bottom
5. Click **"View All"** to see full list
6. Verify: Student's registration visible ✅

#### Test 4: Cancel Registration (Student)
1. Login as Student
2. Find registered event
3. Click **"Cancel"** button
4. Confirm cancellation
5. Verify:
   - "Registered" badge removed ✅
   - Capacity shows: 0 / 50 ✅
   - Button changes to "Register" ✅

#### Test 5: Capacity Full
1. Register 50 users (= capacity)
2. Verify:
   - "FULL" badge appears on event ✅
   - Register button disabled ✅
   - Other users cannot register ✅

#### Test 6: Search & Filter
1. Search for event by name
2. Filter by category (Academic, Social, etc.)
3. Filter by status (Upcoming, Completed)
4. Verify results update correctly ✅

---

## Usage Guide

### For Students & Faculty

#### Browse Events
1. View all events on main page
2. Use search bar to find specific events
3. Filter by category or status
4. Click event image to view full-size

#### Register for Event
1. Click **"Register"** button on event card
2. Review your details
3. Add phone number and notes (optional)
4. Click **"Confirm Registration"**
5. Receive confirmation toast

#### View Event Details
1. Click **"Details"** button
2. See full event information:
   - Description, speaker, contact info
   - Date, time, location
   - Registration capacity
3. Register directly from details page

#### Cancel Registration
1. Find event you're registered for (green badge)
2. Click **"Cancel"** button
3. Confirm cancellation
4. Registration removed

### For Admin

#### Create Event
1. Click **"Create Event"** button (top right)
2. Fill in required fields:
   - Event Name *
   - Category *
   - Date *
   - Time *
   - Location *
3. Fill optional fields:
   - Description
   - Capacity (default: 50)
   - Department
   - Speaker/Organizer
   - Contact Email & Phone
   - Registration Deadline
   - Event Image
4. Click **"Create Event"**

#### Manage Registrations
1. Click **"Details"** on any event
2. View registrations section (admin only)
3. Click **"View All"** to see full list with:
   - Name, email, phone
   - Role, department
   - Registration date
   - Notes from attendee
4. Export or contact attendees as needed

#### Delete Event
1. Click trash icon on event card
2. Confirm deletion
3. Event and all registrations removed

---

## Event Categories

| Category | Use Cases |
|----------|-----------|
| **Academic** | Seminars, Workshops, Guest Lectures, Conferences |
| **Social** | Cultural Events, Festivals, Gatherings, Celebrations |
| **Career** | Job Fairs, Placement Drives, Industry Talks, Networking |
| **Sports** | Tournaments, Competitions, Sports Day |
| **Technical** | Hackathons, Coding Competitions, Tech Talks |
| **Cultural** | Music Concerts, Drama, Dance, Art Shows |
| **Other** | Miscellaneous events |

---

## Event Status Flow

```
upcoming → ongoing → completed
   ↓
cancelled (at any time)
```

**Status Definitions:**
- **Upcoming**: Event is scheduled for future date
- **Ongoing**: Event is happening now (can be set manually)
- **Completed**: Event finished (auto or manual)
- **Cancelled**: Event cancelled (manual)

---

## Registration Workflow

```
User clicks Register
    ↓
Registration Dialog Opens
    ↓
User fills optional info (phone, notes)
    ↓
Confirms Registration
    ↓
Check Capacity
    ↓
If not full → Save to event_registrations
    ↓
Trigger updates event.registered_count (+1)
    ↓
User sees "Registered" badge
```

### Cancel Registration:
```
User clicks Cancel
    ↓
Confirmation Dialog
    ↓
Delete from event_registrations
    ↓
Trigger updates event.registered_count (-1)
    ↓
Badge removed, button reset
```

---

## Database Schema Details

### Table: `event`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| Ename | VARCHAR | Event name |
| Etype | VARCHAR | Category (Academic, Social, etc.) |
| Date | DATE | Event date |
| Time | TIME | Event time |
| Location | VARCHAR | Venue |
| Ephoto | TEXT | Image URL |
| Description | TEXT | Event description |
| capacity | INTEGER | Max attendees (default: 50) |
| registered_count | INTEGER | Current registrations (auto-updated) |
| status | VARCHAR(20) | upcoming/ongoing/completed/cancelled |
| department | VARCHAR(50) | Target department |
| created_by | VARCHAR(255) | Admin user ID |
| contact_email | VARCHAR(255) | Contact email |
| contact_phone | VARCHAR(20) | Contact phone |
| speaker | VARCHAR(255) | Speaker/organizer name |
| registration_deadline | TIMESTAMP | Last date to register |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### Table: `event_registrations`

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| event_id | BIGINT | Foreign key to event |
| user_id | VARCHAR(255) | User ID |
| user_name | VARCHAR(255) | Full name |
| user_email | VARCHAR(255) | Email |
| user_role | VARCHAR(20) | student/faculty/admin |
| department | VARCHAR(50) | User's department |
| semester | INTEGER | User's semester |
| phone_number | VARCHAR(20) | Contact phone |
| registration_date | TIMESTAMP | When registered |
| attendance_status | VARCHAR(20) | registered/attended/cancelled/no-show |
| notes | TEXT | User's notes |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

### Unique Constraint
`UNIQUE(event_id, user_id)` - One registration per user per event

---

## Advanced Features

### Auto-Update Registered Count
When user registers or cancels, `registered_count` is automatically updated via database trigger - no manual calculation needed!

### Prevent Duplicate Registration
Unique constraint ensures each user can only register once per event. Attempting duplicate registration will show error.

### Registration Deadline
Set `registration_deadline` to auto-close registration. System checks deadline and disables register button if passed.

### Capacity Enforcement
System checks `registered_count` vs `capacity` before allowing registration. Shows "FULL" badge when at capacity.

### Status-Based Filtering
Filter events by status to show:
- Only upcoming events
- Only completed events
- Cancelled events

---

## Troubleshooting

### Issue: "Failed to create event"
**Solution:** 
- Verify admin role in faculty table
- Check storage bucket exists
- Verify image size < 5MB

### Issue: "Failed to register"
**Solution:**
- Check user is logged in
- Verify event not at capacity
- Check registration deadline not passed

### Issue: Registered count not updating
**Solution:** 
- Verify trigger exists: `update_event_count_trigger`
- Re-run schema to recreate trigger

### Issue: Cannot upload event image
**Solution:**
- Verify 'events' storage bucket exists
- Check bucket is public
- Verify storage policies are set

### Issue: Registration appears twice
**Solution:** Should not happen due to UNIQUE constraint. If it does:
```sql
DELETE FROM event_registrations 
WHERE id NOT IN (
  SELECT MIN(id) FROM event_registrations 
  GROUP BY event_id, user_id
);
```

---

## Security Features

✅ **RLS Policies**: All data access controlled by Row Level Security
✅ **Admin-only Creation**: Only admins can create/delete events
✅ **Unique Registrations**: Database enforces one registration per user
✅ **Capacity Limits**: Frontend and backend enforce capacity
✅ **Own Registration Management**: Users can only cancel their own registrations
✅ **Admin Oversight**: Admins can view all registrations and manage events

---

## Best Practices

### Creating Events
- Use descriptive event names
- Add detailed descriptions
- Set realistic capacity
- Include speaker info for talks/seminars
- Set registration deadline 1-2 days before event
- Upload high-quality images (1200x600px recommended)
- Add contact information for questions

### Managing Registrations
- Review registrations regularly
- Export attendee list before event
- Mark attendance after event (attendance_status)
- Follow up with no-shows for future events

### Event Lifecycle
1. Create event with all details
2. Monitor registrations
3. Close registration before deadline
4. Export attendee list
5. Host event
6. Mark as "completed"
7. (Optional) Mark individual attendance

---

## Export Registrations (Future Enhancement)

To export registrations to CSV:
```sql
COPY (
  SELECT user_name, user_email, phone_number, department, user_role
  FROM event_registrations
  WHERE event_id = <event_id>
  ORDER BY registration_date
) TO '/tmp/registrations.csv' CSV HEADER;
```

Or use Supabase Dashboard → Table view → Export

---

## Next Steps

After setup is complete:

1. ✅ Create storage bucket for events
2. ✅ Apply events_schema.sql
3. ✅ Test event creation (admin)
4. ✅ Test registration (student/faculty)
5. ✅ Test capacity limits
6. ✅ Test search and filters
7. ✅ Verify registration tracking (admin)

Optional enhancements:
- Email notifications for registrations
- Calendar integration
- QR code check-in for attendance
- Event reminders
- Waitlist for full events
- Recurring events support

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase tables and columns exist
3. Check RLS policies are enabled
4. Verify storage bucket and policies
5. Test with different user roles (student, faculty, admin)

The system is production-ready with comprehensive error handling, validation, and security! 🎉
