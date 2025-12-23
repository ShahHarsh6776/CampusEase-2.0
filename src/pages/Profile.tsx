import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '../UserContext';
import FaceTrainingStatus from '@/components/FaceTrainingStatus';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Settings, 
  Shield, 
  BellRing,
  CheckCircle2,
  Circle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from "react-router-dom"; // assuming you're using react-router



const Profile = () => {

  const { userData, setUserData } = useUser();
  console.log(userData);

  const [editing, setEditing] = useState(false);
  const [studentDepartment, setStudentDepartment] = useState<string | null>(null);
  const { toast } = useToast();

  const [editedData, setEditedData] = useState({
    fname: userData.fname,
    lname: userData.lname,
    mobile_num:userData.mobile_num,
    dob: userData.dob,  // Initialize with the existing data
    address: userData.address,
    emergencyContact: userData.emergency_contact, // Adjusted to match the database column name
    // Add other fields if needed (e.g., profile photo)
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Generate default password for students
  const generateDefaultPassword = (studentId: string) => {
    const year = studentId.substring(0, 2);
    return `${studentId}@${year}`;
  };

  // Fetch student's class information to get department
  useEffect(() => {
    const fetchStudentDepartment = async () => {
      if (userData?.role === 'student' && userData?.user_id) {
        try {
          // Get student's class information
          const { data: studentData, error: studentError } = await supabase
            .from('student_records')
            .select('class_id, course_taken')
            .eq('user_id', userData.user_id)
            .single();

          if (studentData?.class_id) {
            // Get class details to find department
            const { data: classData, error: classError } = await supabase
              .from('class_details')
              .select('department, institute')
              .eq('class_id', studentData.class_id)
              .single();

            if (classData) {
              const departmentInfo = `${classData.institute} ${classData.department}`;
              setStudentDepartment(departmentInfo);
            }
          }
        } catch (error) {
          console.error('Error fetching student department:', error);
          // Fallback to course_taken if available
          if (userData.course_taken) {
            setStudentDepartment(userData.course_taken);
          }
        }
      }
    };

    fetchStudentDepartment();
  }, [userData]);

  const navigate = useNavigate();

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    try {
      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error('Please fill in all password fields');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // For students, check if current password is the default password
      const isStudent = userData.role === 'student';
      const defaultPassword = isStudent ? generateDefaultPassword(userData.user_id) : '';
      
      console.log('Password change attempt:', {
        isStudent,
        defaultPassword,
        currentPasswordIsDefault: passwordData.currentPassword === defaultPassword
      });

      // Verify current password by attempting to sign in
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user?.email) {
        throw new Error('User not found');
      }

      // Test current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      // If this is a student and they changed from default password, mark account as activated
      if (isStudent && passwordData.currentPassword === defaultPassword) {
        const { error: updateRecordError } = await supabase
          .from('student_records')
          .update({ 
            account_activated: true
          })
          .eq('user_id', userData.user_id);

        if (updateRecordError) {
          console.error('Failed to update account activation status:', updateRecordError);
          // Don't throw error here as password was successfully changed
        }
      }

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
      return;
    }

    // Clear all local session
    sessionStorage.removeItem('userData');
    sessionStorage.setItem('isLoggedIn', 'false');
    setUserData({
      id: '',
      user_id: '',
      fname: '',
      lname: '',
      email: '',
      course_taken:'',
      mobile_num:'',
      dob:'',
      address:'',
      emergency_contact:'',
      profile_photo: '',
      role: '',
    });

    // Redirect to login
    toast({
      title: 'Success!',
      description: 'Logged Out Successfuly!',
    });
    navigate("/", { replace: true }); // 👈 "replace" prevents going back
  } catch (err) {
    console.error('Unexpected logout error:', err.message);
  }
};











































  const handleSave = async () => {
    // Define a mapping of roles to tables
    const roleToTableMap = {
      student: 'users',
      faculty: 'faculty',
      admin: 'admin',
    };

    const tableName = roleToTableMap[userData.role];

    if (!tableName) {
      console.error('Invalid role');
      return;
    }
    console.log("Trying to update with:", editedData);
    console.log("Table:", tableName);
    console.log("user_id:", userData.user_id);
    // Update the correct table in the database
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          fname: editedData.fname,
          lname: editedData.lname,
          mobile_num: editedData.mobile_num,
          dob: editedData.dob,
          address: editedData.address,
          emergency_contact: editedData.emergencyContact,
        })
        .eq('id', userData.id)
        .select();  // 👈 to get the updated row back
    
      if (error) {
        console.error('Error updating profile:', error.message);
        toast({
          title: 'Error',
          description: 'Failed To Update Profile, Please Try Again!',
          variant: 'destructive',
        });
      } else {
        console.log('Profile updated successfully:', data);
    
        const updatedUser = {
          ...userData, // 🛡️ keep all other existing fields
          fname: data[0].fname,
          lname: data[0].lname,
          mobile_num: data[0].mobile_num,
          dob: data[0].dob,
          address: data[0].address,
          emergency_contact: data[0].emergency_contact,
        };
    
        setUserData(updatedUser);
        sessionStorage.setItem('userData', JSON.stringify(updatedUser)); // 🔥 update sessionStorage too!
    
        toast({
          title: 'Success!',
          description: 'Profile Updated Successfully!',
        });
    
        setEditing(false);
        
        // Add a small delay before refreshing to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: 'Error',
        description: 'Something Went Wrong, Please Try Again!',
        variant: 'destructive',
      });
    }
  }
    












  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="border-none shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                <AvatarImage src={userData.profile_photo} alt="Profile" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar> 
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">
                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={editedData.fname}
                        onChange={(e) =>
                          setEditedData((prev) => ({ ...prev, fname: e.target.value }))
                        }
                        placeholder="First Name"
                        className="text-2xl font-bold border rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={editedData.lname}
                        onChange={(e) =>
                          setEditedData((prev) => ({ ...prev, lname: e.target.value }))
                        }
                        placeholder="Last Name"
                        className="text-2xl font-bold border rounded px-2 py-1"
                      />
                    </>
                  ) : (
                    <h1 className="text-2xl font-bold">
                      {userData.fname} {userData.lname}
                    </h1>
                  )}
                </h1>
                <p className="text-gray-500 mb-2">{userData.course_taken || 'Department'} | {userData.role}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                  <span className="bg-campusblue-100 text-campusblue-700 px-2 py-1 rounded text-xs font-medium">ID: {userData.user_id}</span>
                  {studentDepartment && (
                    <span className="bg-campusteal-100 text-campusteal-700 px-2 py-1 rounded text-xs font-medium">{studentDepartment}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    {editing ? (
                      <input
                        type="text"
                        value={editedData.mobile_num || ""}
                        onChange={(e) => setEditedData(prev => ({ ...prev, mobile_num: e.target.value }))}
                        placeholder="Enter Mobile Number"
                        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-campusblue-500 w-full md:w-64"
                      />
                    ) : (
                      <span className="text-gray-600">
                        {userData.mobile_num ? userData.mobile_num : "Add Your Mobile Number"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button 
                        onClick={handleSave}
                        variant="outline"
                        className="min-w-[100px]"
                      >
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => setEditing(false)}
                        variant="outline"
                        className="min-w-[100px]"
                      >
                        Cancel Edit
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setEditing(true)}
                      variant="outline"
                      className="min-w-[100px]"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  className="min-w-[100px]"
                >
                  Logout
                </Button>
              </div>
            </div>
            {/* <Button variant="outline" className="w-full mt-4 md:hidden">Edit Profile</Button> */}
          </CardContent>
        </Card>
        
        {/* Profile Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="face-recognition">Face Recognition</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-campusblue-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{userData.fname}  {userData.lname}</p>
                      </div>
                      <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          {editing ? (
                            <input
                              type="date"
                              value={editedData.dob}
                              onChange={(e) => setEditedData({ ...editedData, dob: e.target.value })}
                              className="font-medium border p-2 rounded"
                            />
                          ) : (
                            <p className="font-medium">{userData.dob || 'Not provided'}</p>
                          )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ID</p>
                        <p className="font-medium">{userData.user_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        {editing ? (
                          <textarea
                            value={editedData.address}
                            onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                            className="font-medium border p-2 rounded w-full"
                          />
                        ) : (
                          <p className="font-medium">{userData.address || 'Not provided'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        {editing ? (
                          <textarea
                            value={editedData.emergencyContact}
                            onChange={(e) => setEditedData({ ...editedData, emergencyContact: e.target.value })}
                            className="font-medium border p-2 rounded w-full"
                          />
                        ) : (
                          <p className="font-medium">{userData.emergency_contact || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-campusblue-500" />
                      Quick Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/schedule'}>
                        <Calendar className="h-4 w-4 mr-2" />
                        View My Schedule
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/resources'}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Browse Resources
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/events'}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Campus Events
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-campusblue-500" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{studentDepartment || userData.course_taken || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium capitalize">{userData.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Student ID</p>
                        <p className="font-medium">{userData.user_id}</p>
                      </div>
                      {userData.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-sm">{userData.email}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-campusblue-500" />
                      Profile Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Profile Status</span>
                          <span className="text-sm text-gray-500">
                            {[userData.mobile_num, userData.dob, userData.address, userData.emergency_contact].filter(Boolean).length}/4
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-campusblue-500 h-2 rounded-full" 
                            style={{ width: `${([userData.mobile_num, userData.dob, userData.address, userData.emergency_contact].filter(Boolean).length / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {userData.mobile_num ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-300" />}
                          <span>Mobile Number</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {userData.dob ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-300" />}
                          <span>Date of Birth</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {userData.address ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-300" />}
                          <span>Address</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {userData.emergency_contact ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-gray-300" />}
                          <span>Emergency Contact</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-campusblue-500" />
                    Academic Documents
                  </CardTitle>
                  <CardDescription>Access your official academic records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Official Transcript</p>
                          <p className="text-xs text-gray-500">Last updated: Oct 1, 2023</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Enrollment Verification</p>
                          <p className="text-xs text-gray-500">Last updated: Sep 5, 2023</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Degree Audit</p>
                          <p className="text-xs text-gray-500">Last updated: Sep 30, 2023</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-campusblue-500" />
                    Financial Documents
                  </CardTitle>
                  <CardDescription>Access your financial records and statements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Tuition Statement - Fall 2023</p>
                          <p className="text-xs text-gray-500">Issued: Aug 15, 2023</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Financial Aid Award Letter</p>
                          <p className="text-xs text-gray-500">Issued: Jul 20, 2023</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">1098-T Tax Form (2022)</p>
                          <p className="text-xs text-gray-500">Issued: Jan 31, 2023</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-campusblue-500" />
                    Forms & Applications
                  </CardTitle>
                  <CardDescription>Access and submit various forms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Course Add/Drop Form</p>
                          <p className="text-xs text-gray-500">For changing your course schedule</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Declaration of Major/Minor</p>
                          <p className="text-xs text-gray-500">For changing your academic program</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-campusblue-500" />
                        <div>
                          <p className="font-medium">Request for Incomplete Grade</p>
                          <p className="text-xs text-gray-500">For requesting an incomplete grade</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-campusblue-500" />
                    Upload Documents
                  </CardTitle>
                  <CardDescription>Submit required documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-4">Drag and drop files here, or click to select files</p>
                      <Button variant="outline">Select Files</Button>
                      <p className="text-xs text-gray-400 mt-3">PDF, JPG, or PNG files up to 10MB</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Recently Uploaded</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>Internship_Letter.pdf</span>
                          </div>
                          <span className="text-xs text-gray-500">Oct 12, 2023</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>Housing_Application.pdf</span>
                          </div>
                          <span className="text-xs text-gray-500">Sep 28, 2023</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Face Recognition Tab */}
          <TabsContent value="face-recognition">
            <div className="space-y-6">
              <FaceTrainingStatus
                studentId={userData?.user_id || ''}
                studentName={`${userData?.fname || ''} ${userData?.lname || ''}`.trim()}
                department={studentDepartment || userData?.course_taken || 'Unknown'}
                showUploadOption={true}
              />
              
              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Face Recognition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• Upload 2-5 clear photos of your face</li>
                      <li>• AI processes your photos to create a unique face signature</li>
                      <li>• Faculty can use class photos for automatic attendance marking</li>
                      <li>• Your photos are processed securely and stored encrypted</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">Benefits:</h3>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li>• No need to manually mark attendance in every class</li>
                      <li>• Faster attendance process for faculty</li>
                      <li>• More accurate attendance records</li>
                      <li>• Reduces chances of proxy attendance</li>
                    </ul>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-medium text-amber-900 mb-2">Photo Guidelines:</h3>
                    <ul className="text-sm text-amber-800 space-y-2">
                      <li>• Clear, front-facing photos with good lighting</li>
                      <li>• No sunglasses, masks, or face coverings</li>
                      <li>• Include different angles and expressions</li>
                      <li>• File size should be less than 10MB each</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-campusblue-500" />
                      Edit Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal details. Click "Edit Profile" at the top to make changes.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-3">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">First Name</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50">{userData.fname || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Last Name</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50">{userData.lname || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Email Address</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50">{userData.email || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50">{userData.mobile_num || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Date of Birth</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50">{userData.dob || 'Not set'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Student/Faculty ID</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50">{userData.user_id || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Address</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Full Address</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50 min-h-[80px]">{userData.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Emergency Contact</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Emergency Contact Details</label>
                            <p className="px-3 py-2 border rounded-md bg-gray-50 min-h-[80px]">{userData.emergency_contact || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          💡 To update these details, click the <strong>"Edit Profile"</strong> button at the top of the page.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-campusblue-500" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <form onSubmit={handlePasswordChange}>
                        <h3 className="text-sm font-medium mb-3">Change Password</h3>
                        {userData.role === 'student' && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-700">
                              💡 <strong>First time?</strong> Use your default password: <code className="bg-blue-100 px-1 py-0.5 rounded">{generateDefaultPassword(userData.user_id)}</code>
                            </p>
                          </div>
                        )}
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Current Password</label>
                            <input 
                              type="password" 
                              placeholder="Enter your current password" 
                              className="w-full px-3 py-2 border rounded-md"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">New Password</label>
                            <input 
                              type="password" 
                              placeholder="Enter new password (min 6 characters)" 
                              className="w-full px-3 py-2 border rounded-md"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              minLength={6}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Confirm New Password</label>
                            <input 
                              type="password" 
                              placeholder="Confirm your new password" 
                              className="w-full px-3 py-2 border rounded-md"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full mt-3" 
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </form>
                      
                      <div className="pt-3">
                        <h3 className="text-sm font-medium mb-3">Two-Factor Authentication</h3>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium">Enable 2FA</p>
                            <p className="text-xs text-gray-500">Add an extra layer of security</p>
                          </div>
                          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                            <span className="translate-x-1 inline-block h-4 w-4 rounded-full bg-white transition"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-campusblue-500" />
                      Notifications
                    </CardTitle>
                    <CardDescription>Notification preferences coming soon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <BellRing className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm">Notification settings will be available in future updates.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
