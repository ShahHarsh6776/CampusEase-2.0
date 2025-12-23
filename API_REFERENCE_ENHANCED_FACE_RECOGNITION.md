# API Quick Reference - Enhanced Face Recognition

## 🎯 New Features Summary

### Visual Enhancements
- ✅ Green bounding boxes for identified students
- ✅ Red bounding boxes for unknown faces  
- ✅ Real-time statistics overlay on images
- ✅ Confidence percentages displayed
- ✅ Professional labeling and styling

### API Improvements
- ✅ Returns annotated images in base64
- ✅ Automatic image saving to disk
- ✅ Statistics breakdown in response
- ✅ Image download endpoints
- ✅ Class-wise image organization

---

## 📡 Updated Endpoints

### 1. POST `/mass-recognition` ⭐ ENHANCED

**What's New:**
- Returns `annotated_image` in base64 format
- Returns `annotated_image_path` for saved file
- Returns detailed `statistics` object
- Automatically saves annotated image to disk

**Request:**
```http
POST /mass-recognition
Content-Type: multipart/form-data

attendance_data: {
  "class_id": "CS-A1",
  "subject": "DSA",
  "class_type": "Lecture",
  "date": "2025-12-17",
  "faculty_id": "FAC001",
  "faculty_name": "Dr. Smith"
}
class_photo: [binary file]
```

**Response:**
```json
{
  "success": true,
  "message": "Detected 8 out of 10 students",
  "attendance_results": [
    {
      "student_id": "CS2025001",
      "student_name": "Alice Johnson",
      "confidence": 0.952,
      "status": "present",
      "detected": true
    }
  ],
  "annotated_image": "base64EncodedImageString...",
  "annotated_image_path": "logs/annotated_images/CS-A1/DSA_20251217_143025.jpg",
  "statistics": {
    "total_detected": 10,
    "identified": 8,
    "not_identified": 2
  },
  "total_faces_detected": 10,
  "total_students_in_class": 15,
  "processing_time_ms": 1234.56,
  "recognition_confidence_threshold": 0.4
}
```

### 2. GET `/download-annotated-image/{class_id}/{filename}` 🆕 NEW

**Purpose:** Download previously saved annotated image

**Request:**
```http
GET /download-annotated-image/CS-A1/DSA_20251217_143025.jpg
```

**Response:**
- Content-Type: `image/jpeg`
- Binary image file with annotations

**Usage:**
```javascript
// Direct download link
window.open(`/download-annotated-image/${classId}/${filename}`, '_blank');

// Display in img tag
<img src={`/download-annotated-image/${classId}/${filename}`} />
```

### 3. GET `/annotated-images/{class_id}` 🆕 NEW

**Purpose:** List all annotated images for a class

**Request:**
```http
GET /annotated-images/CS-A1
```

**Response:**
```json
{
  "success": true,
  "class_id": "CS-A1",
  "images": [
    {
      "filename": "DSA_20251217_143025.jpg",
      "path": "logs/annotated_images/CS-A1/DSA_20251217_143025.jpg",
      "created": "2025-12-17T14:30:25",
      "size": 1234567
    },
    {
      "filename": "WebTech_20251217_150530.jpg",
      "path": "logs/annotated_images/CS-A1/WebTech_20251217_150530.jpg",
      "created": "2025-12-17T15:05:30",
      "size": 987654
    }
  ],
  "total_images": 2
}
```

---

## 🎨 Visual Output Specifications

### Bounding Box Colors
```
✅ Identified Students:
   Color: RGB(0, 255, 0) - Green
   Thickness: 3px
   Label: "Student Name (XX.X%)"
   
❌ Unknown Faces:
   Color: RGB(0, 0, 255) - Red  
   Thickness: 3px
   Label: "Unknown"
```

### Statistics Overlay Layout
```
┌─────────────────────────────────┐
│  ATTENDANCE STATISTICS          │  ← White text on dark bg
├─────────────────────────────────┤
│  Total Heads Detected: 10       │  ← White text
│  🟢 Identified: 8               │  ← Green text
│  🔴 Not Identified: 2           │  ← Red text
└─────────────────────────────────┘
   Position: Top-right corner
   Size: 400x120px
   Background: Semi-transparent black
```

---

## 💻 Frontend Integration Examples

### React/TypeScript

```typescript
// 1. Perform mass recognition
const handleMassRecognition = async (file: File, attendanceData: any) => {
  const formData = new FormData();
  formData.append('class_photo', file);
  formData.append('attendance_data', JSON.stringify(attendanceData));
  
  const response = await fetch('http://localhost:8000/mass-recognition', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data;
};

// 2. Display annotated image
const DisplayAnnotatedImage = ({ base64Image }: { base64Image: string }) => (
  <img 
    src={`data:image/jpeg;base64,${base64Image}`}
    alt="Annotated attendance"
    className="w-full rounded-lg shadow-lg"
  />
);

// 3. Show statistics
const StatisticsDisplay = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-3 gap-4">
    <div className="bg-blue-50 p-4 rounded">
      <p className="text-2xl font-bold">{stats.total_detected}</p>
      <p className="text-sm">Total Detected</p>
    </div>
    <div className="bg-green-50 p-4 rounded">
      <p className="text-2xl font-bold text-green-700">{stats.identified}</p>
      <p className="text-sm">Identified</p>
    </div>
    <div className="bg-red-50 p-4 rounded">
      <p className="text-2xl font-bold text-red-700">{stats.not_identified}</p>
      <p className="text-sm">Not Identified</p>
    </div>
  </div>
);

// 4. Download annotated image
const downloadImage = (classId: string, filename: string) => {
  window.open(
    `http://localhost:8000/download-annotated-image/${classId}/${filename}`,
    '_blank'
  );
};

// 5. List class images
const listImages = async (classId: string) => {
  const response = await fetch(
    `http://localhost:8000/annotated-images/${classId}`
  );
  const data = await response.json();
  return data.images;
};
```

### Vanilla JavaScript

```javascript
// Upload and process
async function processAttendance(fileInput, classId) {
  const formData = new FormData();
  formData.append('class_photo', fileInput.files[0]);
  formData.append('attendance_data', JSON.stringify({
    class_id: classId,
    subject: 'DSA',
    date: new Date().toISOString().split('T')[0],
    // ... other fields
  }));
  
  const response = await fetch('http://localhost:8000/mass-recognition', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  // Display image
  document.getElementById('result-image').src = 
    `data:image/jpeg;base64,${result.annotated_image}`;
  
  // Show statistics
  document.getElementById('total').textContent = result.statistics.total_detected;
  document.getElementById('identified').textContent = result.statistics.identified;
  document.getElementById('unknown').textContent = result.statistics.not_identified;
  
  return result;
}
```

---

## 📁 File Storage Structure

```
project_root/
├── logs/
│   └── annotated_images/
│       ├── CS-A1/
│       │   ├── DSA_20251217_143025.jpg
│       │   ├── WebTech_20251217_150530.jpg
│       │   └── DBMS_20251218_091545.jpg
│       ├── CS-A2/
│       │   └── ...
│       └── CS-B1/
│           └── ...
└── ...
```

**Naming Convention:**
```
{subject}_{YYYYMMDD}_{HHMMSS}.jpg

Examples:
- Data_Structures_20251217_143025.jpg
- Web_Technology_20251217_150530.jpg
- Database_Management_20251218_091545.jpg
```

---

## 🔧 Configuration Options

### Image Quality
```python
# In face_recognition_api.py
JPEG_QUALITY = 95  # Range: 1-100, default: 95
```

### Statistics Overlay
```python
# In ImageProcessor.draw_statistics_overlay()
overlay_height = 120  # Height in pixels
overlay_width = 400   # Width in pixels
padding = 20          # Distance from corner
```

### Bounding Box
```python
# In FaceRecognizerWithSupabase.recognize_faces()
thickness = 3         # Box thickness
font_scale = 0.7      # Label text size
font_thickness = 2    # Label text thickness
```

---

## ⚡ Performance Metrics

### Processing Times (RTX 3050)
```
Face Detection:     50-100ms
Face Recognition:   5-10ms per face
Annotation:         20-30ms
Statistics Overlay: 10-15ms
Image Encoding:     30-50ms
-----------------------------------
Total:             100-200ms (typical class)
```

### Response Sizes
```
Without annotated image: ~5-10 KB
With annotated image:    ~500KB - 2MB (depends on original size)
Base64 encoding overhead: +33%
```

---

## 🚨 Error Handling

### Common Errors

**1. No faces detected**
```json
{
  "success": true,
  "message": "No faces detected in image",
  "faces_detected": 0,
  "statistics": {
    "total_detected": 0,
    "identified": 0,
    "not_identified": 0
  }
}
```

**2. Recognition failed**
```json
{
  "success": false,
  "message": "Face recognition system not initialized",
  "error": "Service unavailable"
}
```

**3. Invalid image**
```json
{
  "detail": "Uploaded file is not an image"
}
```

---

## 📊 Usage Analytics

### Track These Metrics
- Total recognition sessions per day
- Average faces detected per session  
- Identification accuracy rate
- Processing time trends
- Most used classes
- Storage usage

### Example Query
```sql
SELECT 
  class_id,
  COUNT(*) as total_sessions,
  AVG(total_detected) as avg_faces,
  AVG(identified) as avg_identified,
  AVG(processing_time_ms) as avg_processing_time
FROM attendance_logs
WHERE date >= NOW() - INTERVAL '7 days'
GROUP BY class_id
ORDER BY total_sessions DESC;
```

---

## 🎓 Best Practices

1. **Image Quality**
   - Use minimum 640px width
   - Ensure good lighting
   - Avoid heavy shadows
   - Clear, frontal faces

2. **Training Data**
   - 5-10 photos per student
   - Various angles and expressions
   - Consistent lighting conditions
   - Regular retraining

3. **Storage Management**
   - Implement retention policy
   - Compress older images
   - Regular cleanup
   - Monitor disk usage

4. **Security**
   - Authenticate download endpoints
   - Validate file paths
   - Implement rate limiting
   - Secure stored images

5. **User Experience**
   - Show loading states
   - Display progress
   - Handle errors gracefully
   - Provide feedback

---

## 📞 Support Endpoints

### Health Check
```http
GET /health
→ Returns system status and GPU info
```

### System Stats
```http
GET /system/stats
→ Returns recognition statistics
```

### Training Status
```http
GET /students/{student_id}/face-training-status
→ Check if student is trained
```

---

## 🔄 Migration from Old API

### Before (Old Response)
```json
{
  "success": true,
  "attendance_results": [...],
  "total_faces_detected": 10
}
```

### After (New Response)
```json
{
  "success": true,
  "attendance_results": [...],
  "total_faces_detected": 10,
  "annotated_image": "base64...",          // 🆕 NEW
  "annotated_image_path": "logs/...",      // 🆕 NEW
  "statistics": {                          // 🆕 NEW
    "total_detected": 10,
    "identified": 8,
    "not_identified": 2
  }
}
```

### Backward Compatibility
✅ All existing fields remain unchanged
✅ New fields are additional, not breaking changes
✅ Old integrations continue to work
✅ Simply ignore new fields if not needed

---

**Last Updated:** December 17, 2025
**API Version:** 1.0.0
**Python Version:** 3.8+
**GPU Requirement:** CUDA-capable (RTX 3050+)
