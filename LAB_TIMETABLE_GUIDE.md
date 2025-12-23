# Lab Timetable Feature Guide

## Overview
The timetable system now supports lab sessions that span 2 consecutive lecture slots with batch-wise allocation (2-4 batches per lab).

## Features

### For Admins (Class Management)
1. **Regular Slots**: Enter course, professor, and room for standard 1-hour lectures
2. **Lab Slots**: 
   - Check the "Lab" checkbox on any slot
   - Select number of batches (2-4)
   - Lab automatically spans 2 consecutive slots
   - Each batch can have different:
     - Course name
     - Professor
     - Room/Lab location

### For Students (Schedule Page)
- **Regular classes** appear in blue boxes
- **Lab sessions** appear in purple boxes spanning 2 time slots
- Each batch is displayed separately with:
  - Batch number (1-4)
  - Course name
  - Professor assigned
  - Lab room location

## How to Use

### Setting Up a Lab (Admin)
1. Navigate to **Class Management** → Select a class → **Timetable** tab
2. Go to **Manual Edit** sub-tab
3. Find the slot where the lab starts
4. Check the **"Lab"** checkbox
5. Select the number of batches (2-4)
6. Fill in details for each batch:
   - Batch 1: Course, Professor, Room
   - Batch 2: Course, Professor, Room
   - (and so on...)
7. Note: The lab will automatically occupy the current slot + next slot
8. Click **Save Timetable**

### Example: Monday Lab (Slots 3-4)
```
Monday, Slot 3 (11:10-12:10):
✓ Lab checkbox enabled
Number of batches: 3

Batch 1:
- Course: Database Lab
- Professor: Dr. Smith
- Room: Lab A

Batch 2:
- Course: Database Lab
- Professor: Dr. Johnson
- Room: Lab B

Batch 3:
- Course: Database Lab
- Professor: Dr. Williams
- Room: Lab C

Monday, Slot 4 (12:10-01:10):
[Shows: Lab (continued)]
```

## Database Schema

### New Columns in `class_timetables`
- `is_lab` (BOOLEAN): TRUE for lab sessions, FALSE for regular classes
- `batch_number` (INTEGER): Batch identifier (1-4) for labs, NULL for regular classes
- `lab_id` (TEXT): Groups all batches of the same lab session (e.g., "lab-CS101-0-2")

### Key Points
- Regular slots: One entry per slot with `is_lab = FALSE`
- Lab slots: Multiple entries (one per batch) at the starting slot with `is_lab = TRUE`
- All batches share the same `lab_id` to group them together
- Labs span 2 consecutive slots but only occupy the starting slot_index in the database

## SQL Migration
Run the provided `lab_timetable_schema.sql` file in your Supabase SQL editor to:
1. Add new columns (`is_lab`, `batch_number`, `lab_id`)
2. Update unique constraints to support multiple batches
3. Add indexes for performance
4. Set up RLS policies

## Visual Indicators
- **Admin UI**: Amber/yellow boxes for lab batches in the editor
- **Student UI**: Purple boxes with "LAB (2 slots)" badge and batch details
- **Occupied slots**: Gray background with "Lab (continued)" text

## Limitations
- Labs must be exactly 2 slots long
- Maximum 4 batches per lab
- Students see all batches (batch assignment to specific students requires additional development)

## Future Enhancements
- Student-batch assignment table
- Personalized view showing only assigned batch
- Support for longer labs (3-4 slots)
- Lab attendance tracking per batch
