# Testing Guide: Enhanced Face Recognition System

## Overview
This guide will help you test the new enhanced face recognition feature with annotated output and statistics overlay.

## Prerequisites

1. **Python Environment** (Already set up)
   - Python 3.8+
   - CUDA-enabled GPU (RTX 3050 or higher)
   - All dependencies from `face_api_requirements.txt`

2. **Required Packages** (Verify installation)
   ```bash
   pip install opencv-python numpy insightface fastapi uvicorn python-multipart supabase
   ```

3. **Environment Variables**
   - Create/update `.env` file with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

## Quick Start

### Step 1: Start the Face Recognition API

Open a terminal and run:

```bash
# Activate your Python environment
& "C:/Users/Harsh Umesh shah/OneDrive/Desktop/SGP5/Multiface-Recognition-Fastapi-main/myenv/Scripts/Activate.ps1"

# Navigate to project directory
cd "C:\Users\Harsh Umesh shah\OneDrive\Desktop\Latest\campus-ease-main"

# Start the API server
python face_recognition_api.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
🚀 GPU Status: ...
✅ Face recognition system initialized successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Verify API is Running

Open your browser and visit:
- http://localhost:8000 - Should show API status
- http://localhost:8000/health - Should show health check with GPU status
- http://localhost:8000/docs - Interactive API documentation

### Step 3: Test with Postman or cURL

#### Test Mass Recognition with Annotation

**Using cURL (PowerShell):**

```powershell
# Prepare test data
$attendanceData = @{
    class_id = "CS-A1"
    subject = "Data Structures"
    class_type = "Lecture"
    date = "2025-12-17"
    faculty_id = "FAC001"
    faculty_name = "Dr. Smith"
} | ConvertTo-Json

# Create multipart form data
$uri = "http://localhost:8000/mass-recognition"
$classPhoto = "path\to\your\class\photo.jpg"

# Make request
curl.exe -X POST $uri `
  -F "attendance_data=$attendanceData" `
  -F "class_photo=@$classPhoto" `
  -H "Content-Type: multipart/form-data"
```

**Using Postman:**

1. **Method**: POST
2. **URL**: `http://localhost:8000/mass-recognition`
3. **Body**: Select `form-data`
4. **Add Fields**:
   - Key: `attendance_data` (Text)
     ```json
     {
       "class_id": "CS-A1",
       "subject": "Data Structures",
       "class_type": "Lecture",
       "date": "2025-12-17",
       "faculty_id": "FAC001",
       "faculty_name": "Dr. Smith"
     }
     ```
   - Key: `class_photo` (File) - Upload your class photo

5. **Click Send**

### Step 4: Verify Response

The response should include:

```json
{
  "success": true,
  "message": "Detected X out of Y students",
  "attendance_results": [...],
  "annotated_image": "base64_encoded_string_here",
  "annotated_image_path": "logs/annotated_images/CS-A1/Data_Structures_20251217_143025.jpg",
  "statistics": {
    "total_detected": 10,
    "identified": 8,
    "not_identified": 2
  },
  "processing_time_ms": 1234.56
}
```

### Step 5: View Annotated Image

**Option 1: From Base64 Response**
- Copy the `annotated_image` value
- Use online base64 to image converter
- Or create an HTML file:

```html
<!DOCTYPE html>
<html>
<head><title>View Annotated Image</title></head>
<body>
  <img id="result" />
  <script>
    const base64Image = "PASTE_BASE64_HERE";
    document.getElementById('result').src = `data:image/jpeg;base64,${base64Image}`;
  </script>
</body>
</html>
```

**Option 2: From Saved File**
- Navigate to the saved file location shown in response
- Example: `logs/annotated_images/CS-A1/Data_Structures_20251217_143025.jpg`
- Open with any image viewer

**Option 3: Download via API**
```
GET http://localhost:8000/download-annotated-image/CS-A1/Data_Structures_20251217_143025.jpg
```

### Step 6: List All Annotated Images

```
GET http://localhost:8000/annotated-images/CS-A1
```

## Expected Results

### Visual Elements in Annotated Image

1. **Green Bounding Boxes**
   - Around identified student faces
   - Student name shown above face
   - Confidence percentage displayed
   - Example: "John Doe (95.2%)"

2. **Red Bounding Boxes**
   - Around unknown/unidentified faces
   - Labeled as "Unknown"
   - No confidence percentage

3. **Statistics Overlay** (Top-right corner)
   ```
   ┌────────────────────────────────┐
   │ ATTENDANCE STATISTICS          │
   ├────────────────────────────────┤
   │ Total Heads Detected: 10       │
   │ 🟢 Identified: 8               │
   │ 🔴 Not Identified: 2           │
   └────────────────────────────────┘
   ```

## Testing Scenarios

### Scenario 1: Perfect Recognition
**Setup**: Class photo with all trained students
**Expected**:
- All faces get green boxes
- Statistics: identified = total_detected
- not_identified = 0

### Scenario 2: Partial Recognition
**Setup**: Class photo with mix of trained and unknown faces
**Expected**:
- Known faces get green boxes
- Unknown faces get red boxes
- Statistics show split

### Scenario 3: No Trained Students
**Setup**: Class photo with no trained faces in database
**Expected**:
- All faces get red boxes
- identified = 0
- not_identified = total_detected

### Scenario 4: Empty Classroom
**Setup**: Photo with no faces
**Expected**:
- Success response
- total_detected = 0
- No bounding boxes

## Integration Testing

### Test with React Frontend

1. **Update your Attendance component** to use the new enhanced viewer:

```typescript
import EnhancedAttendanceViewer from '@/components/EnhancedAttendanceViewer';

// In your page/component
<EnhancedAttendanceViewer />
```

2. **Start your frontend**:
```bash
npm run dev
```

3. **Navigate to the attendance page**

4. **Upload a class photo and verify**:
   - File uploads successfully
   - Processing shows loading state
   - Annotated image displays
   - Statistics cards show correct numbers
   - Green/red boxes are visible
   - Attendance table populates

## Troubleshooting

### Issue: API won't start
**Solution**:
- Check if port 8000 is already in use
- Verify Python environment is activated
- Check GPU drivers are installed

### Issue: No annotated image returned
**Solution**:
- Verify `return_annotated_image=True` in recognize_faces call
- Check image processing didn't fail
- Look for errors in API logs

### Issue: Statistics overlay not visible
**Solution**:
- Ensure image width > 500px
- Check OpenCV is properly installed
- Verify font rendering works: `cv2.FONT_HERSHEY_SIMPLEX`

### Issue: Image not saving to disk
**Solution**:
- Check write permissions in `logs/` directory
- Create directory manually if needed:
  ```bash
  mkdir -p logs/annotated_images
  ```
- Verify sufficient disk space

### Issue: Bounding boxes look incorrect
**Solution**:
- Verify face detection is working
- Check bbox coordinates are valid
- Ensure image isn't corrupted

## Performance Benchmarks

### Expected Processing Times (RTX 3050)

- **Face Detection**: 50-100ms per image
- **Face Recognition**: 5-10ms per face
- **Annotation Drawing**: 20-30ms
- **Statistics Overlay**: 10-15ms
- **Total**: 100-200ms for typical class photo (20-30 students)

### Memory Usage

- **API Server**: ~500MB baseline
- **Per Request**: +200-500MB depending on image size
- **GPU Memory**: 1-2GB for model inference

## Next Steps

1. **Train More Students**
   - Use `/train-student` endpoint
   - Upload 5-10 photos per student
   - Verify training status

2. **Test Different Scenarios**
   - Various lighting conditions
   - Different angles
   - Group photos vs individual
   - Outdoor vs indoor

3. **Frontend Integration**
   - Integrate `EnhancedAttendanceViewer` component
   - Test end-to-end workflow
   - Add download functionality
   - Implement image gallery

4. **Production Readiness**
   - Add authentication
   - Implement rate limiting
   - Set up error tracking
   - Configure logging
   - Add monitoring

## Sample Test Data

### Test Class Configuration
```json
{
  "class_id": "CS-A1",
  "subject": "Data Structures and Algorithms",
  "class_type": "Lecture",
  "date": "2025-12-17",
  "faculty_id": "FAC001",
  "faculty_name": "Dr. John Smith",
  "department": "Computer Science",
  "semester": "Fall 2025"
}
```

### Sample Student for Training
```json
{
  "name": "Alice Johnson",
  "student_id": "CS2025001",
  "department": "Computer Science",
  "role": "student",
  "email": "alice.johnson@college.edu"
}
```

## Success Criteria

✅ API starts without errors
✅ Mass recognition completes successfully
✅ Annotated image shows green boxes for identified faces
✅ Annotated image shows red boxes for unknown faces
✅ Statistics overlay displays correctly
✅ Image saves to disk
✅ Base64 image can be displayed
✅ Processing completes in < 2 seconds
✅ Frontend displays results correctly
✅ Download functionality works

## Support

If you encounter issues:
1. Check API logs in terminal
2. Verify GPU is being utilized
3. Test with smaller images first
4. Ensure all dependencies are installed
5. Check Supabase connection

For optimal results:
- Use well-lit class photos
- Ensure faces are clearly visible
- Photos should be at least 640px wide
- Train each student with 5+ varied photos
- Retrain if confidence scores are consistently low
