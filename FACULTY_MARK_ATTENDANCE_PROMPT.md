# Faculty Mark Attendance - Complete Implementation Prompt

## Context
Build the **Faculty Mark Attendance** feature for the Flutter Campus-Ease app. This feature allows faculty members to mark attendance manually or using AI-powered face recognition. Use the schema from `one_complete_schema.sql` and integrate with the Face Recognition API from `face_recognition_api.py`.

---

## 1. Database Schema Reference

### Tables Used:

**A. `attendance` (write)**
```sql
Columns:
- id (bigint, PK, auto-generated)
- user_id (text, FK → student_records.user_id)
- student_id (text, same as user_id for compatibility)
- student_name (text, full name)
- roll_no (text)
- class_id (text, FK → class_details.class_id)
- department (text)
- date (date, attendance date)
- subject (text, subject/course name)
- class_type (text: 'lecture', 'lab', 'tutorial', 'practical')
- status (text: 'present', 'absent', 'late')
- marked_by (text, faculty user_id)
- faculty_name (text, faculty full name)
- created_at (timestamptz, auto)
- updated_at (timestamptz, auto)

Constraints:
- UNIQUE (user_id, date, subject, class_id, marked_by)
- CHECK status IN ('present', 'absent', 'late')
```

**B. `student_records` (read)**
```sql
Columns:
- id, user_id (unique), auth_id, fname, lname, email
- mobile_num, roll_no, student_id, dob, address, emergency_contact
- course_taken, class_id, department, institute, semester
- academic_year, profile_photo, role, email_verified
- account_activated, created_at, updated_at

Indexes: user_id, class_id, department, roll_no
```

**C. `class_details` (read)**
```sql
Columns:
- id, class_name, class_id (unique), department, institute
- semester, academic_year, description, course_taken
- created_at, updated_at
```

**D. `faculty` (read - for current user info)**
```sql
Columns:
- id (uuid, PK), user_id (unique), fname, lname, email
- mobile_num, dob, address, emergency_contact, course_taken
- profile_photo, has_photo, email_verified, role
- verification_expiry, created_at
```

---

## 2. Face Recognition API Integration

**Base URL:** `http://localhost:8000` (or configured backend URL)

### API Endpoints:

**A. Mass Face Recognition**
```
POST /mass-recognition
Content-Type: multipart/form-data

Body:
- attendance_data (string/JSON): {
    class_id, subject, class_type, date, 
    faculty_id, faculty_name
  }
- class_photo (file): Image file of the class

Response: {
  success: bool,
  message: string,
  attendance_results: [
    {
      student_id: string,
      student_name: string,
      confidence: float,
      status: 'present' | 'absent',
      detected: bool
    }
  ],
  annotated_image: string (base64),
  statistics: {
    total_detected: int,
    identified: int,
    unidentified: int
  },
  processing_time_ms: int
}
```

**B. Save Attendance (Bulk)**
```
POST /save-attendance
Content-Type: application/json

Body: {
  attendance_data: {
    class_id, subject, class_type, date,
    faculty_id, faculty_name
  },
  attendance_results: [
    {
      student_id, student_name, confidence, status
    }
  ]
}

Response: {
  success: bool,
  message: string,
  saved_records: int,
  face_recognition_count: int,
  manual_count: int
}
```

**C. Check Face Training Status**
```
GET /students/{student_id}/face-training-status

Response: {
  trained: bool,
  student_id: string,
  name: string (optional),
  training_date: string (optional),
  embedding_available: bool
}
```

---

## 3. Screen Flow & Navigation

**Route:** `/faculty/mark-attendance`

**Access:** Faculty role only (guard with FacultyRoute wrapper)

### Screen Sections:

#### **Section 1: Session Setup (Header)**
- Date picker (default: today)
- Class selector dropdown (fetch from class_details)
- Subject input field (text or predefined dropdown)
- Class type selector (chips: Lecture, Lab, Tutorial, Practical)
- "Continue" button (validates required fields)

#### **Section 2: Attendance Mode Selection**
Two modes (tabs or cards):
- **Manual Mode** (default)
- **AI Face Recognition Mode**

#### **Section 3A: Manual Attendance (when Manual Mode selected)**
- Student list (fetched from student_records by class_id)
- Each row shows:
  - Profile photo (if available)
  - Student name (fname + lname)
  - Roll number
  - User ID
  - Status toggle buttons:
    - Present (green) ✓
    - Absent (red) ✗
    - Late (amber) ⏰
- Search/filter bar (by name, roll_no, user_id)
- Statistics chips (top):
  - Total: X students
  - Present: Y (green)
  - Absent: Z (red)
  - Late: W (amber)
- "Submit Attendance" button (bottom FAB or fixed button)

#### **Section 3B: AI Face Recognition (when Face Recognition Mode selected)**
- Upload class photo section:
  - Camera button (capture from device camera)
  - Gallery button (select from gallery)
  - Preview uploaded image
- Processing indicator during recognition
- Results display:
  - Annotated image with bounding boxes:
    - Green boxes: Identified students
    - Red boxes: Unknown faces
  - Statistics overlay on image
  - Student list with detection status:
    - Detected students (auto-marked present)
    - Undetected students (marked absent by default)
  - Allow manual correction:
    - Faculty can change status of any student
    - Override face recognition results
- "Save Attendance" button

#### **Section 4: Confirmation & Success**
- Summary dialog before save:
  - Date, Class, Subject, Type
  - Present: X, Absent: Y, Late: Z
  - "Confirm" and "Cancel" buttons
- Success toast/snackbar after save
- Option to "Mark Another Attendance" or "View History"

---

## 4. Database Operations (Step-by-Step)

### **Operation 1: Fetch Faculty Info**
**When:** On screen load
**Query:** 
```dart
final facultyUser = supabase.auth.currentUser;
final facultyData = await supabase
  .from('faculty')
  .select('user_id, fname, lname, email')
  .eq('id', facultyUser!.id)
  .single();

final facultyId = facultyData['user_id'];
final facultyName = '${facultyData['fname']} ${facultyData['lname']}';
```

### **Operation 2: Fetch Classes (for dropdown)**
**When:** On screen load
**Query:**
```dart
final classes = await supabase
  .from('class_details')
  .select('id, class_name, class_id, department, semester, course_taken')
  .order('department')
  .order('semester')
  .order('class_name');

// Build dropdown items
List<DropdownMenuItem> classItems = classes.map((cls) {
  return DropdownMenuItem(
    value: cls['class_id'],
    child: Text('${cls['class_name']} - ${cls['department']} Sem ${cls['semester']}'),
  );
}).toList();
```

### **Operation 3: Fetch Students by Class**
**When:** After class is selected in dropdown
**Query:**
```dart
final students = await supabase
  .from('student_records')
  .select('''
    id, user_id, fname, lname, email, roll_no, 
    student_id, profile_photo, department, 
    course_taken, semester
  ''')
  .eq('class_id', selectedClassId)
  .order('roll_no')
  .order('user_id');

// Transform to local model
List<Student> studentList = students.map((s) => Student(
  userId: s['user_id'],
  name: '${s['fname']} ${s['lname']}',
  rollNo: s['roll_no'],
  profilePhoto: s['profile_photo'],
  status: 'present', // default
)).toList();
```

**Error Handling:**
- If no students found: Show empty state with message
- If network error: Show retry button with error message

### **Operation 4: Check Face Training Status (for Face Recognition mode)**
**When:** After students are fetched (optional background check)
**API Call:**
```dart
for (final student in studentList) {
  try {
    final response = await http.get(
      Uri.parse('$apiBaseUrl/students/${student.userId}/face-training-status'),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      student.faceTrained = data['trained'] ?? false;
    }
  } catch (e) {
    student.faceTrained = false; // default
  }
}
```

### **Operation 5: Submit Manual Attendance**
**When:** Faculty clicks "Submit Attendance" in manual mode
**Process:**
1. Validate: Ensure date, class_id, subject, class_type are filled
2. Build records:
```dart
final attendanceRecords = studentList.map((student) {
  return {
    'user_id': student.userId,
    'student_id': student.userId, // same value
    'student_name': student.name,
    'roll_no': student.rollNo,
    'class_id': selectedClassId,
    'department': student.department,
    'date': selectedDate.toIso8601String().split('T')[0],
    'subject': subjectController.text.trim(),
    'class_type': selectedClassType, // 'lecture', 'lab', etc.
    'status': student.status, // 'present', 'absent', 'late'
    'marked_by': facultyId,
    'faculty_name': facultyName,
    'created_at': DateTime.now().toIso8601String(),
    'updated_at': DateTime.now().toIso8601String(),
  };
}).toList();
```

3. Upsert to database (handles duplicates):
```dart
try {
  final response = await supabase
    .from('attendance')
    .upsert(
      attendanceRecords,
      onConflict: 'user_id,date,subject,class_id,marked_by',
    );
  
  // Success
  showSuccessToast('Attendance saved for ${attendanceRecords.length} students');
  
} catch (e) {
  showErrorToast('Failed to save attendance: ${e.toString()}');
}
```

**Constraints Handling:**
- Unique constraint violation: Automatically handled by upsert (updates existing record)
- Foreign key violation (invalid class_id or user_id): Show error to user
- Check constraint violation (invalid status): Validate before submit

### **Operation 6: Face Recognition Attendance Flow**

**Step 6.1: Upload and Process Image**
```dart
// After image is captured/selected
final imageFile = await ImagePicker().pickImage(source: ImageSource.camera);
if (imageFile == null) return;

// Show loading
showLoadingDialog('Processing class photo...');

// Prepare multipart request
var request = http.MultipartRequest(
  'POST',
  Uri.parse('$apiBaseUrl/mass-recognition'),
);

// Add attendance data
final attendanceData = jsonEncode({
  'class_id': selectedClassId,
  'subject': subjectController.text.trim(),
  'class_type': selectedClassType,
  'date': selectedDate.toIso8601String().split('T')[0],
  'faculty_id': facultyId,
  'faculty_name': facultyName,
});
request.fields['attendance_data'] = attendanceData;

// Add image file
request.files.add(
  await http.MultipartFile.fromPath(
    'class_photo',
    imageFile.path,
  ),
);

// Send request
try {
  final streamedResponse = await request.send();
  final response = await http.Response.fromStream(streamedResponse);
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Process results (see Step 6.2)
  } else {
    throw Exception('Face recognition failed: ${response.body}');
  }
} catch (e) {
  hideLoadingDialog();
  showErrorToast('Face recognition error: ${e.toString()}');
}
```

**Step 6.2: Process Recognition Results**
```dart
final results = data['attendance_results'] as List;
final annotatedImageBase64 = data['annotated_image'];
final statistics = data['statistics'];

// Update student list with recognition results
for (var result in results) {
  final student = studentList.firstWhere(
    (s) => s.userId == result['student_id'],
    orElse: () => null,
  );
  
  if (student != null) {
    student.status = result['status']; // 'present' or 'absent'
    student.confidence = result['confidence'] ?? 0.0;
    student.detected = result['detected'] ?? false;
  }
}

// Display annotated image (base64 to Image widget)
final annotatedImage = base64Decode(annotatedImageBase64);

// Show statistics
setState(() {
  recognitionStats = statistics;
  processedImage = annotatedImage;
});

// Allow manual corrections
showResultsScreen();
```

**Step 6.3: Save Face Recognition Attendance**
```dart
// After faculty reviews and confirms (with optional manual corrections)
final savePayload = {
  'attendance_data': {
    'class_id': selectedClassId,
    'subject': subjectController.text.trim(),
    'class_type': selectedClassType,
    'date': selectedDate.toIso8601String().split('T')[0],
    'faculty_id': facultyId,
    'faculty_name': facultyName,
  },
  'attendance_results': studentList.map((s) => {
    'student_id': s.userId,
    'student_name': s.name,
    'confidence': s.confidence,
    'status': s.status,
  }).toList(),
};

try {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/save-attendance'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(savePayload),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    showSuccessToast(
      'Attendance saved! ${data['face_recognition_count']} by AI, '
      '${data['manual_count']} manually marked'
    );
  } else {
    throw Exception('Failed to save: ${response.body}');
  }
} catch (e) {
  showErrorToast('Save error: ${e.toString()}');
}
```

### **Operation 7: Fetch Attendance History (optional view)**
**When:** Faculty wants to see past attendance records
**Query:**
```dart
final history = await supabase
  .from('attendance')
  .select('''
    id, date, subject, class_type, status, student_name,
    created_at
  ''')
  .eq('marked_by', facultyId)
  .eq('class_id', selectedClassId) // optional filter
  .order('date', ascending: false)
  .order('created_at', ascending: false)
  .limit(100);

// Group by date and subject
Map<String, List<dynamic>> groupedHistory = {};
for (var record in history) {
  final key = '${record['date']}_${record['subject']}';
  groupedHistory[key] ??= [];
  groupedHistory[key]!.add(record);
}
```

---

## 5. UI/UX Components & Widgets

### **Widget 1: Session Setup Card**
```dart
Card(
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Column(
      children: [
        // Date Picker
        InkWell(
          onTap: () => _selectDate(context),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: 'Date',
              suffixIcon: Icon(Icons.calendar_today),
            ),
            child: Text(DateFormat('dd MMM yyyy').format(selectedDate)),
          ),
        ),
        SizedBox(height: 16),
        
        // Class Dropdown
        DropdownButtonFormField(
          decoration: InputDecoration(labelText: 'Select Class'),
          value: selectedClassId,
          items: classItems,
          onChanged: (value) => _onClassSelected(value),
          validator: (v) => v == null ? 'Please select a class' : null,
        ),
        SizedBox(height: 16),
        
        // Subject Input
        TextFormField(
          controller: subjectController,
          decoration: InputDecoration(
            labelText: 'Subject',
            hintText: 'e.g., Data Structures',
          ),
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        ),
        SizedBox(height: 16),
        
        // Class Type Selector (Chips)
        Wrap(
          spacing: 8,
          children: ['Lecture', 'Lab', 'Tutorial', 'Practical']
            .map((type) => ChoiceChip(
              label: Text(type),
              selected: selectedClassType == type.toLowerCase(),
              onSelected: (selected) {
                if (selected) {
                  setState(() => selectedClassType = type.toLowerCase());
                }
              },
            ))
            .toList(),
        ),
      ],
    ),
  ),
)
```

### **Widget 2: Mode Selection Tabs**
```dart
DefaultTabController(
  length: 2,
  child: Column(
    children: [
      TabBar(
        tabs: [
          Tab(icon: Icon(Icons.edit), text: 'Manual'),
          Tab(icon: Icon(Icons.face), text: 'Face Recognition'),
        ],
        onTap: (index) => setState(() => attendanceMode = index),
      ),
      SizedBox(height: 16),
      IndexedStack(
        index: attendanceMode,
        children: [
          ManualAttendanceView(students: studentList),
          FaceRecognitionView(students: studentList),
        ],
      ),
    ],
  ),
)
```

### **Widget 3: Student Row (Manual Mode)**
```dart
Card(
  margin: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
  child: ListTile(
    leading: CircleAvatar(
      backgroundImage: student.profilePhoto != null
        ? NetworkImage(student.profilePhoto!)
        : null,
      child: student.profilePhoto == null
        ? Text(student.name[0])
        : null,
    ),
    title: Text(student.name, style: TextStyle(fontWeight: FontWeight.bold)),
    subtitle: Text('${student.rollNo} • ${student.userId}'),
    trailing: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(Icons.check_circle),
          color: student.status == 'present' ? Colors.green : Colors.grey,
          onPressed: () => _updateStatus(student, 'present'),
        ),
        IconButton(
          icon: Icon(Icons.schedule),
          color: student.status == 'late' ? Colors.amber : Colors.grey,
          onPressed: () => _updateStatus(student, 'late'),
        ),
        IconButton(
          icon: Icon(Icons.cancel),
          color: student.status == 'absent' ? Colors.red : Colors.grey,
          onPressed: () => _updateStatus(student, 'absent'),
        ),
      ],
    ),
  ),
)
```

### **Widget 4: Statistics Bar**
```dart
Container(
  padding: EdgeInsets.all(16),
  color: Colors.grey[100],
  child: Row(
    mainAxisAlignment: MainAxisAlignment.spaceAround,
    children: [
      _buildStatChip('Total', totalCount, Colors.blue),
      _buildStatChip('Present', presentCount, Colors.green),
      _buildStatChip('Absent', absentCount, Colors.red),
      _buildStatChip('Late', lateCount, Colors.amber),
    ],
  ),
)

Widget _buildStatChip(String label, int count, Color color) {
  return Chip(
    avatar: CircleAvatar(
      backgroundColor: color,
      child: Text('$count', style: TextStyle(color: Colors.white, fontSize: 12)),
    ),
    label: Text(label),
  );
}
```

### **Widget 5: Image Upload Card (Face Recognition)**
```dart
Card(
  child: Column(
    children: [
      Container(
        height: 200,
        width: double.infinity,
        color: Colors.grey[200],
        child: selectedImage != null
          ? Image.file(File(selectedImage!.path), fit: BoxFit.cover)
          : Center(
              child: Icon(Icons.add_a_photo, size: 64, color: Colors.grey),
            ),
      ),
      ButtonBar(
        alignment: MainAxisAlignment.center,
        children: [
          ElevatedButton.icon(
            icon: Icon(Icons.camera_alt),
            label: Text('Camera'),
            onPressed: () => _pickImage(ImageSource.camera),
          ),
          ElevatedButton.icon(
            icon: Icon(Icons.photo_library),
            label: Text('Gallery'),
            onPressed: () => _pickImage(ImageSource.gallery),
          ),
        ],
      ),
      if (selectedImage != null)
        ElevatedButton(
          child: Text('Process Class Photo'),
          onPressed: _processImageWithFaceRecognition,
        ),
    ],
  ),
)
```

### **Widget 6: Annotated Image Display**
```dart
Card(
  child: Column(
    children: [
      Image.memory(
        processedImage!,
        fit: BoxFit.contain,
        width: double.infinity,
      ),
      Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'Recognition Results',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatColumn('Detected', recognitionStats['identified']),
                _buildStatColumn('Undetected', recognitionStats['unidentified']),
                _buildStatColumn('Total Faces', recognitionStats['total_detected']),
              ],
            ),
          ],
        ),
      ),
    ],
  ),
)
```

### **Widget 7: Submit Button (FAB)**
```dart
FloatingActionButton.extended(
  onPressed: _submitAttendance,
  icon: Icon(Icons.check),
  label: Text('Submit Attendance'),
  backgroundColor: Colors.green,
)
```

### **Widget 8: Confirmation Dialog**
```dart
Future<bool?> _showConfirmationDialog() {
  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Confirm Attendance'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Date: ${DateFormat('dd MMM yyyy').format(selectedDate)}'),
          Text('Class: $selectedClassName'),
          Text('Subject: ${subjectController.text}'),
          Text('Type: $selectedClassType'),
          Divider(),
          Text('Present: $presentCount', style: TextStyle(color: Colors.green)),
          Text('Absent: $absentCount', style: TextStyle(color: Colors.red)),
          Text('Late: $lateCount', style: TextStyle(color: Colors.amber)),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          child: Text('Confirm'),
        ),
      ],
    ),
  );
}
```

---

## 6. State Management

### **Required State Variables:**
```dart
// Session
DateTime selectedDate = DateTime.now();
String? selectedClassId;
String? selectedClassName;
String selectedClassType = 'lecture';
TextEditingController subjectController = TextEditingController();

// Students
List<Student> studentList = [];
bool loadingStudents = false;

// Attendance mode
int attendanceMode = 0; // 0=manual, 1=face recognition

// Face Recognition
File? selectedImage;
Uint8List? processedImage;
Map<String, dynamic>? recognitionStats;

// Faculty Info
String facultyId = '';
String facultyName = '';

// Statistics
int get totalCount => studentList.length;
int get presentCount => studentList.where((s) => s.status == 'present').length;
int get absentCount => studentList.where((s) => s.status == 'absent').length;
int get lateCount => studentList.where((s) => s.status == 'late').length;
```

### **Student Model:**
```dart
class Student {
  final String userId;
  final String name;
  final String rollNo;
  final String? profilePhoto;
  final String? department;
  String status; // 'present', 'absent', 'late'
  double confidence; // for face recognition
  bool detected; // for face recognition
  bool? faceTrained; // whether student has face training data
  
  Student({
    required this.userId,
    required this.name,
    required this.rollNo,
    this.profilePhoto,
    this.department,
    this.status = 'present',
    this.confidence = 0.0,
    this.detected = false,
    this.faceTrained,
  });
}
```

---

## 7. Validation & Error Handling

### **Form Validation:**
```dart
bool _validateForm() {
  if (selectedClassId == null) {
    showErrorToast('Please select a class');
    return false;
  }
  
  if (subjectController.text.trim().isEmpty) {
    showErrorToast('Please enter subject name');
    return false;
  }
  
  if (selectedClassType.isEmpty) {
    showErrorToast('Please select class type');
    return false;
  }
  
  if (studentList.isEmpty) {
    showErrorToast('No students found in selected class');
    return false;
  }
  
  return true;
}
```

### **Network Error Handling:**
```dart
try {
  // API call or database query
} on SocketException {
  showErrorDialog('Network Error', 'Please check your internet connection');
} on TimeoutException {
  showErrorDialog('Timeout', 'Request took too long. Please try again');
} on PostgrestException catch (e) {
  // Supabase error
  if (e.code == '23505') {
    showErrorToast('Attendance already marked for this session');
  } else {
    showErrorDialog('Database Error', e.message);
  }
} catch (e) {
  showErrorDialog('Error', 'An unexpected error occurred: ${e.toString()}');
}
```

### **Face Recognition Error Handling:**
```dart
if (response.statusCode == 404) {
  showErrorDialog('API Not Available', 
    'Face recognition service is not running. Please contact admin.');
} else if (response.statusCode == 400) {
  showErrorDialog('Invalid Image', 
    'The uploaded image could not be processed. Please try another photo.');
} else if (response.statusCode == 500) {
  showErrorDialog('Recognition Failed', 
    'Face recognition encountered an error. You can mark attendance manually.');
}
```

---

## 8. Performance Optimization

### **Lazy Loading Students:**
```dart
// For large classes (>50 students), implement pagination
Future<void> _fetchStudents({int offset = 0, int limit = 50}) async {
  final students = await supabase
    .from('student_records')
    .select('*')
    .eq('class_id', selectedClassId)
    .range(offset, offset + limit - 1)
    .order('roll_no');
  
  setState(() {
    if (offset == 0) {
      studentList = students.map((s) => Student.fromJson(s)).toList();
    } else {
      studentList.addAll(students.map((s) => Student.fromJson(s)));
    }
  });
}
```

### **Image Compression:**
```dart
import 'package:image/image.dart' as img;

Future<File> _compressImage(File file) async {
  final bytes = await file.readAsBytes();
  final image = img.decodeImage(bytes);
  
  if (image == null) return file;
  
  // Resize if too large
  final resized = image.width > 1920 
    ? img.copyResize(image, width: 1920)
    : image;
  
  // Compress
  final compressed = img.encodeJpg(resized, quality: 85);
  
  // Save to temp file
  final tempDir = await getTemporaryDirectory();
  final tempFile = File('${tempDir.path}/compressed_${DateTime.now().millisecondsSinceEpoch}.jpg');
  await tempFile.writeAsBytes(compressed);
  
  return tempFile;
}
```

### **Debounced Search:**
```dart
import 'package:rxdart/rxdart.dart';

final _searchSubject = PublishSubject<String>();

@override
void initState() {
  super.initState();
  
  _searchSubject
    .debounceTime(Duration(milliseconds: 500))
    .listen((query) {
      _filterStudents(query);
    });
}

void _onSearchChanged(String query) {
  _searchSubject.add(query);
}

void _filterStudents(String query) {
  if (query.isEmpty) {
    setState(() => filteredStudentList = studentList);
    return;
  }
  
  final lowercaseQuery = query.toLowerCase();
  setState(() {
    filteredStudentList = studentList.where((s) =>
      s.name.toLowerCase().contains(lowercaseQuery) ||
      s.rollNo.toLowerCase().contains(lowercaseQuery) ||
      s.userId.toLowerCase().contains(lowercaseQuery)
    ).toList();
  });
}
```

---

## 9. Accessibility & UX

### **Loading States:**
- Skeleton shimmer for student list loading
- Progress indicator during face recognition
- Disabled buttons during save operation
- Loading overlay with message during API calls

### **Empty States:**
- No classes: "No classes assigned. Contact admin."
- No students: "No students enrolled in this class."
- No image selected: Placeholder with instructions

### **Success Feedback:**
- Toast: "Attendance saved successfully for 42 students"
- Vibration feedback (optional)
- Confetti animation (optional)
- Navigate to success screen or back to dashboard

### **Accessibility:**
- Semantic labels for icons
- Sufficient color contrast for status colors
- Font scaling support
- Screen reader support

---

## 10. Project Structure

```
lib/features/faculty/
├── screens/
│   ├── mark_attendance_screen.dart (main screen)
│   ├── attendance_history_screen.dart (optional)
│   └── face_recognition_result_screen.dart
├── widgets/
│   ├── session_setup_card.dart
│   ├── manual_attendance_view.dart
│   ├── face_recognition_view.dart
│   ├── student_row.dart
│   ├── statistics_bar.dart
│   ├── image_upload_card.dart
│   └── confirmation_dialog.dart
├── services/
│   ├── attendance_service.dart (Supabase operations)
│   └── face_recognition_api_service.dart (HTTP calls)
├── models/
│   ├── student_model.dart
│   ├── attendance_session_model.dart
│   └── recognition_result_model.dart
└── providers/
    └── attendance_provider.dart (state management)
```

---

## 11. Testing Scenarios

### **Manual Testing:**
1. Mark attendance for all students as present
2. Mark attendance with mixed status (present/absent/late)
3. Change status multiple times before submit
4. Search and filter students
5. Submit with missing required fields (should validate)
6. Submit duplicate attendance (should upsert)
7. Submit for different dates and subjects

### **Face Recognition Testing:**
1. Upload clear class photo with all faces visible
2. Upload photo with partially visible faces
3. Upload photo with no faces
4. Upload photo with unknown persons
5. Upload low-quality/blurry image
6. Test with students who have face training data
7. Test with students who don't have face training data
8. Override AI results manually
9. Test API timeout scenarios
10. Test API unavailable scenarios

### **Edge Cases:**
- Empty class (no students)
- Very large class (100+ students)
- Slow network connection
- Offline mode (should queue or show error)
- Session expiration during operation
- Concurrent attendance marking by multiple faculty

---

## 12. Deliverables Checklist

- [ ] Session setup UI (date, class, subject, type)
- [ ] Class dropdown with data from class_details
- [ ] Student list fetch from student_records by class_id
- [ ] Manual attendance mode with status toggles
- [ ] Search/filter functionality
- [ ] Live statistics display
- [ ] Face recognition mode with image upload
- [ ] Camera and gallery integration
- [ ] API integration for mass-recognition endpoint
- [ ] Display annotated image with bounding boxes
- [ ] Allow manual corrections to AI results
- [ ] Confirmation dialog before save
- [ ] Upsert attendance to database
- [ ] Success/error toast messages
- [ ] Loading states throughout
- [ ] Error handling for network, API, database
- [ ] Form validation
- [ ] Role guard (faculty only)
- [ ] Navigation to/from faculty dashboard
- [ ] Responsive layout for different screen sizes
- [ ] Consistent theming with Material 3

---

## 13. Configuration

### **Environment Variables (.env):**
```env
FACE_RECOGNITION_API_URL=http://localhost:8000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### **API Configuration:**
```dart
class ApiConfig {
  static const String faceRecognitionBaseUrl = 
    String.fromEnvironment('FACE_RECOGNITION_API_URL', 
      defaultValue: 'http://localhost:8000');
  
  static const Duration apiTimeout = Duration(seconds: 60);
  static const int maxImageSizeMB = 10;
}
```

---

## Final Notes

- Use the schema from `one_complete_schema.sql` as the source of truth for table structure
- Integrate with `face_recognition_api.py` endpoints for AI features
- Follow FLUTTER_APP_PROMPT design guidelines (Material 3, colors, spacing)
- Ensure faculty role is verified before allowing access
- Test thoroughly with both manual and face recognition modes
- Handle all error cases gracefully with user-friendly messages
- Provide clear feedback for all operations
- Optimize for performance with large student lists
- Make the UI intuitive and easy to use for faculty

This feature should provide a seamless attendance marking experience with the flexibility of both manual and AI-powered methods.
