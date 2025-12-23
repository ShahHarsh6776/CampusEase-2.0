# Face Embedding Storage & Management Guide

## 📊 Where Are Face Embeddings Stored?

### Storage Location: **Supabase Database (Cloud)**

Face embeddings are stored in the **`persons` table** in your Supabase PostgreSQL database.

---

## 🗄️ Database Schema

### Table: `persons`

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (Primary Key) | Unique person ID |
| `name` | Text | Student/Person name |
| `student_id` | Text (Unique) | Student ID (e.g., "202301234") |
| `employee_id` | Text | Employee ID (for faculty/staff) |
| `department` | Text | Department (IT, CE, CS, etc.) |
| `role` | Text | Role (student, faculty, staff, visitor) |
| `email` | Text | Email address |
| `phone` | Text | Phone number |
| **`face_embedding`** | **Text** | **Base64-encoded embedding (512 floats)** |
| `training_images_count` | Integer | Number of images used for training |
| `last_trained` | Timestamp | Last training date/time |
| `recognition_enabled` | Boolean | Whether face recognition is active |
| `is_active` | Boolean | Whether person record is active |
| `created_at` | Timestamp | Record creation time |
| `updated_at` | Timestamp | Last update time |

---

## 🔢 Embedding Format

### What is stored:
- **Original**: 512-dimensional float32 numpy array (from InsightFace ArcFace model)
- **Stored as**: Base64-encoded text string
- **Size**: ~2-3 KB per student

### Example Flow:

```
Training Images (Student Photos)
        ↓
InsightFace Model (GPU Processing)
        ↓
Numpy Array [512 floats]
        ↓
Convert to bytes → Base64 encode
        ↓
Store in Supabase `persons.face_embedding`
```

### Retrieval Flow:

```
Supabase `persons.face_embedding`
        ↓
Base64 decode → Convert to numpy array
        ↓
Use for face comparison (cosine similarity)
        ↓
Identify student in class photo
```

---

## 🗑️ Delete Face Embeddings (NEW FEATURE!)

### Admin Dashboard - Class Management

You can now **delete all face embeddings for an entire class** from the Admin Dashboard!

#### Location: **Class Management Page**

Each class card now has a **"Clear Faces"** button:

```
┌─────────────────────────────────────────┐
│  Class: IT-4A (CSPIT)                   │
│  Class ID: IT4A2024                     │
│  Department: IT                          │
│  Students: 50                           │
│                                         │
│  [View] [Edit] [Clear Faces] [Delete]  │
│                    ↑                    │
│              NEW BUTTON!                │
└─────────────────────────────────────────┘
```

#### How to Use:

1. **Navigate** to Admin Dashboard → Class Management
2. **Find** the class you want to clear face data for
3. **Click** "Clear Faces" button (orange)
4. **Confirm** the action in the dialog
5. **Done!** All face embeddings for that class are deleted

#### What Happens:

✅ **Deleted:**
- Face embeddings (512-dimensional vectors)
- Training data references
- Face recognition cache entries

❌ **NOT Deleted:**
- Student records in `student_records` table
- Personal information (name, email, roll number)
- Attendance history
- Class enrollment

#### When to Use:

- **Semester Change**: New batch of students in same class
- **Data Privacy**: Remove biometric data when requested
- **Re-training**: Clear old data before new training
- **Security**: Remove face data after graduation/leaving
- **Testing**: Reset face recognition during development

---

## 🔧 API Endpoint

### DELETE `/class/{class_id}/face-embeddings`

**Description**: Delete all face embeddings for students in a specific class

**Request:**
```bash
DELETE http://localhost:8000/class/IT4A2024/face-embeddings
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted face embeddings for 50 students",
  "deleted_count": 50,
  "failed_count": 0,
  "total_students": 50,
  "class_id": "IT4A2024",
  "deleted_student_ids": ["202301234", "202301235", ...]
}
```

---

## 📏 Storage Size Estimates

| Students | Embedding Storage Size |
|----------|----------------------|
| 1 | ~2-3 KB |
| 100 | ~200-300 KB |
| 1,000 | ~2-3 MB |
| 5,000 | ~10-15 MB |
| 10,000 | ~20-30 MB |

**Very efficient!** Even 10,000 students = only ~25 MB

---

## 🔐 Security & Privacy

### Data Protection:

1. **Database Security**: Supabase provides row-level security
2. **API Authentication**: Face recognition API requires proper access
3. **Deletion Rights**: Only admins can delete embeddings
4. **Audit Trail**: All operations logged with timestamps
5. **No Raw Images**: Only embeddings stored, not original photos

### Compliance:

- **GDPR**: Right to be forgotten - embeddings can be deleted
- **Data Minimization**: Only mathematical representation stored
- **Purpose Limitation**: Used solely for attendance/identification
- **Consent**: Students should consent to biometric data collection

---

## 🔄 Face Embedding Lifecycle

```
1. ENROLLMENT
   └─► Student uploads face photos
       └─► System generates embedding
           └─► Stored in `persons` table

2. ACTIVE USE
   └─► Class photo uploaded
       └─► Faces detected
           └─► Embeddings compared
               └─► Students identified

3. MAINTENANCE
   └─► Admin reviews face training status
       └─► Re-trains if needed
           └─► Updates embedding

4. DELETION (NEW!)
   └─► Admin clicks "Clear Faces"
       └─► All class embeddings deleted
           └─► Students can be re-trained

5. GRADUATION/LEAVING
   └─► Student record archived
       └─► Embedding optionally deleted
```

---

## 🛠️ Technical Implementation

### Backend (FastAPI):

**File**: `face_recognition_api.py`

**New Endpoint**: `/class/{class_id}/face-embeddings` (DELETE)

**Logic**:
1. Fetch all students in the class from `student_records`
2. For each student, delete their record from `persons` table
3. Refresh face recognizer cache
4. Return deletion summary

### Frontend (React/TypeScript):

**File**: `src/pages/ClassManagement.tsx`

**New Function**: `handleDeleteClassFaceEmbeddings()`

**UI Component**: "Clear Faces" button with confirmation dialog

---

## 📋 Usage Examples

### Scenario 1: New Semester
```
Problem: New batch of students enrolling in IT-4A
Solution: 
1. Click "Clear Faces" for IT-4A class
2. Remove old student face data
3. Train new students
```

### Scenario 2: Privacy Request
```
Problem: Student requests face data deletion
Solution:
1. Use "Clear Faces" to remove all class embeddings
   OR
2. Delete individual student face data via API
```

### Scenario 3: System Reset
```
Problem: Testing new face recognition model
Solution:
1. Clear all face embeddings
2. Re-train with new model
3. Compare accuracy
```

---

## ⚠️ Important Notes

### Before Deleting:

1. **Backup**: Consider exporting data if needed
2. **Notification**: Inform students/faculty
3. **Re-training**: Plan for face re-training session
4. **Attendance**: Existing attendance records are safe

### After Deleting:

1. **No Recognition**: Face recognition won't work for this class
2. **Manual Attendance**: Use manual methods until re-trained
3. **Re-training Required**: Students must upload photos again
4. **Cache Cleared**: Face recognizer cache updated automatically

---

## 🎯 Summary

### Key Points:

✅ **Embeddings stored in**: Supabase `persons` table  
✅ **Format**: Base64-encoded 512-dimensional vectors  
✅ **Size**: ~2-3 KB per student  
✅ **Admin Control**: "Clear Faces" button in Class Management  
✅ **Safe Deletion**: Student records remain intact  
✅ **API Endpoint**: `DELETE /class/{class_id}/face-embeddings`  
✅ **Production Ready**: Full error handling and logging  

### Benefits:

- 🚀 **Efficient Storage**: Minimal database space
- 🔒 **Privacy Compliant**: Easy to delete when needed
- 💾 **Centralized**: All data in one secure location
- 🔄 **Manageable**: Simple admin controls
- ⚡ **Fast Access**: Quick retrieval for recognition

---

## 🆘 Troubleshooting

### "Failed to delete face embeddings"
**Solution**: Make sure face recognition API is running (`python face_recognition_api.py`)

### "No students found in this class"
**Solution**: Verify class_id is correct in `student_records` table

### "Some embeddings failed to delete"
**Solution**: Check backend logs for specific student errors

### "API not responding"
**Solution**: Ensure `http://localhost:8000` is accessible

---

**✨ Your campus e-governance system now has complete control over face recognition data!** 🎓
