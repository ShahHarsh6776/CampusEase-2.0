# Flutter Campus-Ease Mobile App Development Prompt

## Context
I have a complete database schema file (`one_complete_schema.sql`) for a Campus Management System called "Campus-Ease". I need you to help me create a modern, professional Flutter mobile application that integrates with this Supabase backend.

## Project Overview
**App Name:** Campus-Ease Mobile  
**Technology Stack:**
- Flutter (latest stable version)
- Dart
- Supabase (Backend as a Service)
- supabase_flutter package for integration

## Database Schema Reference
The complete database schema is provided in `one_complete_schema.sql` which includes:
- **User Management:** student_records, faculty, admin tables
- **Authentication:** Multi-role system (Student/Faculty/Admin)
- **Class Management:** class_details table
- **Attendance System:** attendance table with face recognition support
- **Community Features:** community_messages table
- **Reporting:** report table for campus issues

## Phase 1 Requirements: Basic Setup & Core Screens

### 1. Project Setup
Create a Flutter project with:
```yaml
# Required dependencies in pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^latest
  flutter_dotenv: ^latest
  provider: ^latest (or riverpod for state management)
  go_router: ^latest (for navigation)
  shared_preferences: ^latest
  google_fonts: ^latest
  flutter_svg: ^latest
  intl: ^latest (for date formatting)
```

### 2. Supabase Configuration

#### Environment Setup
Create `.env` file:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

#### Supabase Client Initialization
```dart
// lib/core/services/supabase_service.dart
- Initialize Supabase client
- Handle authentication state changes
- Provide global access to Supabase instance
```

### 3. Multi-Role Authentication System

#### Authentication Features Required:

**A. Student Login:**
- ID Format: `[2][0-5](dit|dce|dcs|it|ce|cs)\d{3}` (e.g., 23DIT001, 24DCS042)
- Email Format: `{userId}@charusat.edu.in`
- Default Password System: `{userId}@{year}` (e.g., 23DIT001@23)
- Database: `student_records` table
- Special Features:
  - Auto-create auth account on first login with default password
  - Show default password hint on login screen
  - Track `account_activated` status
  - Prompt for password change after first login

**B. Faculty Login:**
- ID Format: `fac_(dit|dce|dcs|it|ce|cs)\d{3}` (e.g., fac_dit001)
- Email Format: `{userId}@charusat.ac.in`
- Database: `faculty` table

**C. Admin Login:**
- ID Format: `admin\d{3}` (e.g., admin001)
- Email Format: `{userId}_ad@charusat.ac.in`
- Database: `admin` table

### 4. User State Management

Create a User Provider/State that stores:
```dart
class UserData {
  String id;
  String userId;
  String fname;
  String lname;
  String email;
  String? courseTaken;
  String? mobileNum;
  String? address;
  String? dob;
  String? emergencyContact;
  String? profilePhoto;
  String role; // 'student', 'faculty', 'admin'
  bool? accountActivated; // For students only
}
```

### 5. Required UI Screens

#### A. Authentication Screens

**1. Splash Screen**
- Campus-Ease logo
- Loading animation
- Auto-navigate to Login or Home based on auth state

**2. Login Screen**
- Modern card-based design with gradient background
- ID Number input field with validation
- Password field with show/hide toggle
- Default password hint box (for students, visible when ID matches pattern)
- "Forgot Password?" link
- "Sign Up" navigation link
- Loading state during authentication
- Error handling with toast/snackbar messages

**3. Signup Screen (Optional for Phase 1)**
- Two-step process:
  - Step 1: Basic info (Name, ID, Email, Password)
  - Step 2: Profile photo upload
- Role-based validation for ID and email formats
- Progress indicator between steps

#### B. Home/Dashboard Screens

**4. Student Dashboard**
- Welcome header with student name and photo
- Quick stats cards:
  - Attendance percentage
  - Upcoming classes
  - Pending assignments
  - Announcements count
- Navigation grid/cards to main features:
  - My Attendance
  - Schedule
  - Courses
  - Community Chat
  - Profile
  - Reports
  - Events
  - Lost & Found
- Bottom navigation bar

**5. Faculty Dashboard**
- Welcome header with faculty name
- Quick action cards:
  - Mark Attendance
  - View Class Schedule
  - Class Management
  - Student List
- Recent attendance summary
- Bottom navigation bar

**6. Admin Dashboard**
- System overview cards:
  - Total Students
  - Total Faculty
  - Total Classes
  - Pending Reports
- Quick actions:
  - Manage Classes
  - Student Records
  - View Reports
  - Data Analysis
- Bottom navigation bar

#### C. Core Feature Screens

**7. Attendance Screen (Faculty)**
- Class selector dropdown
- Date picker
- Subject input/dropdown
- Student list with:
  - Profile photo
  - Name
  - Roll number
  - Attendance status buttons (Present/Absent/Late)
- Submit attendance button
- Statistics display (Present/Absent/Late counts)

**8. View Attendance Screen (Student)**
- Date range selector
- Subject filter
- Attendance records list:
  - Date
  - Subject
  - Status badge (color-coded)
  - Marked by (faculty name)
- Overall attendance percentage
- Monthly attendance calendar view

**9. Profile Screen (All Roles)**
- Profile photo with edit option
- Editable fields:
  - Name (display only)
  - Email (display only)
  - Mobile number
  - Address
  - Emergency contact
  - Date of birth
- Change password option (especially for students with default password)
- Logout button

**10. Community Chat Screen**
- Real-time message list
- Message input field
- Send button
- Display sender name and role
- Timestamp for each message
- Auto-scroll to latest message

**11. Reports/Problems Screen**
- Create new report button (FAB)
- Report list with filters:
  - Category filter
  - Status filter (Resolved/Pending)
  - Priority level
- Each report card shows:
  - Problem category
  - Location
  - Priority badge
  - Timestamp
  - Resolved status

**12. Schedule/Timetable Screen**
- Week view calendar
- Day-wise class schedule
- Each class card shows:
  - Subject name
  - Time
  - Class type (Lecture/Lab/Tutorial)
  - Room number
  - Faculty name

### 6. Navigation Structure

```dart
// Using go_router or similar
Routes:
  / (Splash)
  /login
  /signup
  /home (Role-based redirect to student/faculty/admin dashboard)
  /student/dashboard
  /student/attendance
  /student/schedule
  /student/profile
  /student/community
  /student/reports
  /faculty/dashboard
  /faculty/mark-attendance
  /faculty/schedule
  /faculty/profile
  /faculty/community
  /admin/dashboard
  /admin/class-management
  /admin/student-records
  /admin/reports
  /admin/profile
```

### 7. UI/UX Design Guidelines

#### Color Scheme
```dart
// Primary Colors
primaryColor: Color(0xFF2196F3) // Modern Blue
primaryDark: Color(0xFF1976D2)
accent: Color(0xFF03DAC6) // Teal

// Status Colors
success: Color(0xFF4CAF50) // Green
warning: Color(0xFFFFC107) // Amber
error: Color(0xFFF44336) // Red
info: Color(0xFF2196F3) // Blue

// Background
background: Color(0xFFF5F5F5) // Light Grey
surface: Colors.white
```

#### Typography
```dart
// Use Google Fonts
- Headlines: Poppins (Bold, 24-32px)
- Subheadings: Poppins (SemiBold, 18-20px)
- Body: Roboto (Regular, 14-16px)
- Captions: Roboto (Light, 12px)
```

#### Design Principles
1. **Card-Based Layout:** Use Material cards with subtle shadows for content sections
2. **Bottom Navigation:** For main navigation (4-5 items max)
3. **FAB:** For primary actions (e.g., Add Report, Mark Attendance)
4. **Consistent Spacing:** Use multiples of 8px for padding/margins
5. **Icons:** Use Material Icons or Cupertino Icons consistently
6. **Loading States:** Shimmer effects for loading content
7. **Empty States:** Friendly illustrations with helpful text
8. **Error States:** Clear error messages with retry options
9. **Animations:** Smooth page transitions and micro-interactions
10. **Responsive:** Support both phone and tablet layouts

#### Component Examples

**Status Badge:**
```dart
Container(
  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  decoration: BoxDecoration(
    color: status == 'present' ? Colors.green[100] : Colors.red[100],
    borderRadius: BorderRadius.circular(12),
  ),
  child: Text(
    status.toUpperCase(),
    style: TextStyle(
      color: status == 'present' ? Colors.green[800] : Colors.red[800],
      fontWeight: FontWeight.bold,
      fontSize: 12,
    ),
  ),
)
```

**Info Card:**
```dart
Card(
  elevation: 2,
  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 32, color: primaryColor),
        SizedBox(height: 8),
        Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(value, style: TextStyle(fontSize: 24, color: primaryColor)),
      ],
    ),
  ),
)
```

### 8. Project Structure

```
lib/
├── main.dart
├── core/
│   ├── services/
│   │   ├── supabase_service.dart
│   │   ├── auth_service.dart
│   │   └── storage_service.dart
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── attendance_model.dart
│   │   ├── class_model.dart
│   │   └── report_model.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   └── user_provider.dart
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_strings.dart
│   │   └── app_routes.dart
│   └── utils/
│       ├── validators.dart
│       ├── helpers.dart
│       └── extensions.dart
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── splash_screen.dart
│   │   │   ├── login_screen.dart
│   │   │   └── signup_screen.dart
│   │   └── widgets/
│   ├── student/
│   │   ├── screens/
│   │   │   ├── student_dashboard.dart
│   │   │   ├── view_attendance_screen.dart
│   │   │   └── student_schedule_screen.dart
│   │   └── widgets/
│   ├── faculty/
│   │   ├── screens/
│   │   │   ├── faculty_dashboard.dart
│   │   │   ├── mark_attendance_screen.dart
│   │   │   └── faculty_schedule_screen.dart
│   │   └── widgets/
│   ├── admin/
│   │   ├── screens/
│   │   │   ├── admin_dashboard.dart
│   │   │   ├── class_management_screen.dart
│   │   │   └── student_records_screen.dart
│   │   └── widgets/
│   ├── profile/
│   │   ├── screens/
│   │   │   ├── profile_screen.dart
│   │   │   └── edit_profile_screen.dart
│   │   └── widgets/
│   ├── community/
│   │   ├── screens/
│   │   │   └── community_chat_screen.dart
│   │   └── widgets/
│   └── reports/
│       ├── screens/
│       │   ├── reports_list_screen.dart
│       │   └── create_report_screen.dart
│       └── widgets/
└── shared/
    ├── widgets/
    │   ├── custom_button.dart
    │   ├── custom_text_field.dart
    │   ├── loading_indicator.dart
    │   ├── status_badge.dart
    │   └── info_card.dart
    └── theme/
        └── app_theme.dart
```

### 9. Authentication Flow Implementation

```dart
// Pseudo-code for Student Login
Future<void> loginStudent(String userId, String password) async {
  // 1. Validate ID format
  final studentIdPattern = RegExp(r'^[2][0-5](dit|dce|dcs|it|ce|cs)\d{3}$', caseSensitive: false);
  
  if (!studentIdPattern.hasMatch(userId)) {
    throw Exception('Invalid student ID format');
  }
  
  // 2. Check if student exists in student_records
  final studentRecord = await supabase
    .from('student_records')
    .select()
    .eq('user_id', userId)
    .single();
  
  if (studentRecord == null) {
    throw Exception('Student not found. Contact admin.');
  }
  
  // 3. Generate email and default password
  final email = '${userId.toLowerCase()}@charusat.edu.in';
  final year = userId.substring(0, 2);
  final defaultPassword = '$userId@$year';
  
  // 4. Attempt authentication
  try {
    if (password == defaultPassword) {
      // Try login with default password
      try {
        final authResponse = await supabase.auth.signInWithPassword(
          email: email,
          password: defaultPassword,
        );
        // Success - using default password
        await updateAccountActivation(userId, false);
        showPasswordChangePrompt();
      } catch (e) {
        // Account doesn't exist, create it
        if (studentRecord['auth_id'] == null) {
          final signUpResponse = await supabase.auth.signUp(
            email: email,
            password: defaultPassword,
          );
          // Update student_records with auth_id
          await supabase.from('student_records').update({
            'auth_id': signUpResponse.user!.id,
            'account_activated': false,
          }).eq('user_id', userId);
        }
      }
    } else {
      // Regular password login
      await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      await updateAccountActivation(userId, true);
    }
  } catch (e) {
    throw Exception('Login failed: ${e.toString()}');
  }
}
```

### 10. Key Features to Implement

#### A. Session Management
- Persist login state using SharedPreferences
- Auto-logout on token expiration
- Handle auth state changes globally

#### B. Error Handling
- Network error handling with retry
- Form validation with clear error messages
- Toast/Snackbar for user feedback
- Graceful error states in UI

#### C. Loading States
- Shimmer loading for lists
- Progress indicators for buttons
- Skeleton screens for complex views

#### D. Role-Based Access Control
- Route guards based on user role
- Conditional UI rendering
- Protected API calls

### 11. Phase 1 Deliverables

**Must Have:**
1. ✅ Working authentication (Login for all three roles)
2. ✅ Role-based dashboard screens
3. ✅ Bottom navigation setup
4. ✅ Profile screen with basic info
5. ✅ Supabase integration (auth + basic queries)
6. ✅ Attendance view (student) - read-only
7. ✅ Mark attendance (faculty) - basic form
8. ✅ Modern, clean UI with consistent design
9. ✅ Responsive layout for different screen sizes
10. ✅ Session persistence

**Nice to Have (if time permits):**
- Community chat with real-time updates
- Reports creation and listing
- Schedule/timetable view
- Push notifications setup
- Profile photo upload
- Dark mode support

### 12. Testing Credentials

Ensure the app can login with test accounts:

**Student:**
- ID: `24DIT001`
- Email: `24dit001@charusat.edu.in`
- Default Password: `24DIT001@24`

**Faculty:**
- ID: `fac_dit001`
- Email: `fac_dit001@charusat.ac.in`
- Password: (custom password set during signup)

**Admin:**
- ID: `admin001`
- Email: `admin001_ad@charusat.ac.in`
- Password: (custom password set during signup)

### 13. Code Quality Standards

- Use meaningful variable and function names
- Add comments for complex logic
- Follow Flutter/Dart style guide
- Implement proper error handling
- Use const constructors where possible
- Optimize widget rebuilds
- Implement null safety properly

### 14. Additional Notes

- Focus on clean, maintainable code
- Prioritize user experience and smooth interactions
- Ensure app works on both Android and iOS
- Use Material Design 3 components
- Implement proper loading states everywhere
- Add appropriate spacing and padding throughout
- Use asset images/icons where it improves UX
- Make sure all forms have proper validation
- Test on different screen sizes

---

## How to Use This Prompt

1. **Provide Context:** Share this prompt with the `one_complete_schema.sql` file
2. **Start with Setup:** Ask to create the project structure and setup Supabase
3. **Build Incrementally:** Request screens one at a time or in logical groups
4. **Test Frequently:** After each major feature, test the authentication and data flow
5. **Iterate on Design:** Refine UI/UX based on feedback

## Example First Request

"Using the schema in `one_complete_schema.sql` and following the guidelines in this prompt, please:
1. Create the Flutter project structure as outlined
2. Set up Supabase integration with authentication
3. Implement the Splash Screen and Login Screen with student default password support
4. Create the basic Student Dashboard with navigation structure
Focus on clean, modern UI following Material Design 3 principles."

---

**Good luck with your Flutter Campus-Ease app development! 🚀**
