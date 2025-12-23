# Annotated Image Workflow Guide

## Overview
The enhanced face recognition system now includes a complete workflow for viewing annotated images with visual feedback and editing attendance records.

## New Workflow Steps

### 1. **Upload Class Photo**
- User uploads a clear class photo containing students
- Supports JPEG, PNG formats up to 20MB
- Drag-and-drop or click to browse

### 2. **AI Processing**
- System detects and identifies faces using InsightFace
- Creates annotated image with:
  - **Green bounding boxes** → Identified students (with confidence scores)
  - **Red bounding boxes** → Unknown/unidentified faces
  - **Statistics overlay** → Total detected, identified, unidentified counts

### 3. **Review & Edit Attendance**
- Shows complete list of all students in the class
- Displays auto-detected students with confidence scores
- Allows manual status adjustment (Present/Absent/Late)
- Summary statistics: Present, Absent, Late, Auto-Detected counts

### 4. **Save Attendance** ✅
- Click "Save Attendance" to store records in database
- System confirms successful save
- Shows summary of saved records

### 5. **View Annotated Image** (NEW!) 🎨
- **After saving**, a new button appears: "View Annotated Image"
- Click to see the class photo with face detection boxes
- Visual feedback:
  - Green boxes = Identified students
  - Red boxes = Unknown faces
  - Statistics panel showing detection results

### 6. **Edit Attendance from Annotated View** (NEW!) ✏️
- While viewing the annotated image, you can:
  - See the visual face detection results
  - Verify which students were correctly identified
  - Manually mark students as Present/Absent/Late
  - Re-save attendance if changes are made

## User Flow Diagram

```
Upload Photo
    ↓
AI Processing (Face Detection & Recognition)
    ↓
Review Student List → Edit if needed
    ↓
Save Attendance ✅
    ↓
[Saved Successfully Screen]
    ↓
"View Annotated Image" Button 🖼️
    ↓
See Annotated Photo with:
  • Green boxes (identified)
  • Red boxes (unknown)
  • Statistics overlay
    ↓
Edit Attendance (if needed) ✏️
    ↓
Re-save Changes (optional)
    ↓
Close & Return
```

## Features

### Visual Feedback
- **Green Bounding Boxes**: Show identified students with name labels
- **Red Bounding Boxes**: Highlight unknown/unidentified faces
- **Statistics Overlay**: Display on image showing:
  - Total faces detected
  - Number of identified students
  - Number of unidentified faces

### Annotated Image Details
- High-resolution display with zoom support
- Color-coded legend (Green = Identified, Red = Unknown)
- Saved automatically to `logs/annotated_images/` directory
- Base64 encoded for efficient transfer

### Editing Capabilities
- Edit attendance both before and after viewing annotated image
- Changes can be saved multiple times
- Visual confirmation of auto-detected vs manually marked students
- Confidence scores shown for auto-detected students

## API Integration

### Response Structure
```json
{
  "success": true,
  "attendance_results": [...],
  "annotated_image": "base64_encoded_image_string",
  "statistics": {
    "total_detected": 15,
    "identified": 12,
    "unidentified": 3
  },
  "total_students_in_class": 23
}
```

### Annotated Image
- Format: JPEG (base64 encoded)
- Includes all visual annotations
- Ready for display in browser
- Can be downloaded separately via API endpoint

## Benefits

1. **Visual Verification**: Faculty can see exactly which faces were detected
2. **Quality Assurance**: Easy to spot if someone was missed or misidentified
3. **Transparency**: Clear visual feedback on AI performance
4. **Flexibility**: Edit attendance even after initial save
5. **Audit Trail**: Annotated images saved for record-keeping

## Technical Details

### Component States
- `upload`: Initial photo upload
- `processing`: AI processing in progress
- `review`: Review attendance list
- `saving`: Saving to database
- `saved`: Successfully saved (shows "View Annotated Image" button)
- `annotated`: Viewing annotated image with edit options

### Data Flow
1. Photo uploaded → Sent to FastAPI backend
2. Backend processes → Returns attendance results + annotated image
3. Frontend stores both attendance data and base64 image
4. After save → User can optionally view annotated image
5. From annotated view → User can edit and re-save

## Usage Tips

### For Best Results
1. Use clear, well-lit class photos
2. Ensure faces are front-facing and not obstructed
3. Avoid blurry or low-resolution images
4. Review the annotated image to verify correct identifications

### When to Use Annotated View
- **Verification**: Check if all students were correctly identified
- **Manual Correction**: Mark students that were missed by AI
- **Quality Check**: Ensure no false positives
- **Record Keeping**: Visual proof of attendance capture

### Editing from Annotated View
- Green boxes show students that were automatically identified
- Use the student list below the image to adjust any statuses
- Click "Save Attendance Changes" to update records
- Use "Back to Summary" to return without saving changes

## Future Enhancements
- Download annotated image as PDF
- Email annotated image to students/parents
- Compare multiple class photos
- Advanced analytics on recognition accuracy
- Integration with student profiles

---

**Note**: The annotated image feature requires the face recognition API to be running (`python face_recognition_api.py`). Make sure GPU acceleration is enabled for better performance.
