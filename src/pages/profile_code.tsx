import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '../UserContext';
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
  BellRing 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const Profile = () => {

  const { userData } = useUser();
  console.log(userData);
  












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
                <h1 className="text-2xl font-bold">{userData.fname} {userData.lname} </h1>
                <p className="text-gray-500 mb-2">{userData.course_taken} | {userData.role}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                  <span className="bg-campusblue-100 text-campusblue-700 px-2 py-1 rounded text-xs font-medium">Student ID: {userData.user_id}</span>
                  <span className="bg-campusteal-100 text-campusteal-700 px-2 py-1 rounded text-xs font-medium">GPA: 3.8</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">Credits: 68/120</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 justify-center md:justify-start">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>Add Your Mobile Number</span>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="hidden md:flex">Edit Profile</Button>
            </div>
            <Button variant="outline" className="w-full mt-4 md:hidden">Edit Profile</Button>
          </CardContent>
        </Card>
        
        {/* Profile Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academics">Academics</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
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
                        <p className="font-medium">{userData.fname} {userData.lname}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="font-medium">May 15, 1999</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Student ID</p>
                        <p className="font-medium">{userData.user_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">123 University Ave, Apt 4B<br />College Town, ST 12345</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="font-medium">John Doe (Father)<br />(555) 987-6543</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-campusblue-500" />
                      Upcoming Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50">
                        <div className="bg-campusblue-100 text-campusblue-700 w-16 h-16 flex flex-col items-center justify-center rounded-md">
                          <span className="text-sm font-medium">MON</span>
                          <span className="text-lg font-bold">18</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">CS301: Advanced Algorithms</p>
                          <p className="text-sm text-gray-500">10:00 AM - 11:30 AM • Tech Building, Room 302</p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50">
                        <div className="bg-campusblue-100 text-campusblue-700 w-16 h-16 flex flex-col items-center justify-center rounded-md">
                          <span className="text-sm font-medium">MON</span>
                          <span className="text-lg font-bold">18</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">MATH204: Linear Algebra</p>
                          <p className="text-sm text-gray-500">1:00 PM - 2:30 PM • Science Hall, Room 105</p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50">
                        <div className="bg-campusblue-100 text-campusblue-700 w-16 h-16 flex flex-col items-center justify-center rounded-md">
                          <span className="text-sm font-medium">TUE</span>
                          <span className="text-lg font-bold">19</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">CS Lab Session</p>
                          <p className="text-sm text-gray-500">3:00 PM - 5:00 PM • Computer Lab, Room 105</p>
                        </div>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">View Full Schedule</Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-campusblue-500" />
                      Current Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-md hover:bg-gray-50">
                        <p className="font-medium">CS301: Advanced Algorithms</p>
                        <p className="text-xs text-gray-500">Dr. Sarah Johnson</p>
                      </div>
                      <div className="p-3 border rounded-md hover:bg-gray-50">
                        <p className="font-medium">MATH204: Linear Algebra</p>
                        <p className="text-xs text-gray-500">Prof. Michael Chen</p>
                      </div>
                      <div className="p-3 border rounded-md hover:bg-gray-50">
                        <p className="font-medium">CS310: Database Systems</p>
                        <p className="text-xs text-gray-500">Dr. Robert Lee</p>
                      </div>
                      <div className="p-3 border rounded-md hover:bg-gray-50">
                        <p className="font-medium">ENG210: Technical Writing</p>
                        <p className="text-xs text-gray-500">Prof. Linda Martinez</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4">All Courses</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-campusblue-500" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-full mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Assignment Submitted</p>
                          <p className="text-xs text-gray-500">CS301: Algorithm Analysis Paper</p>
                          <p className="text-xs text-gray-400">Yesterday at 11:42 PM</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-full mt-0.5">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Grade Posted</p>
                          <p className="text-xs text-gray-500">MATH204: Midterm Exam - 92%</p>
                          <p className="text-xs text-gray-400">Oct 15, 2023 at 3:15 PM</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-full mt-0.5">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Event Registration</p>
                          <p className="text-xs text-gray-500">Career Fair: Tech & Engineering</p>
                          <p className="text-xs text-gray-400">Oct 10, 2023 at 9:30 AM</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Academics Tab */}
          <TabsContent value="academics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-campusblue-500" />
                      Academic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Major</p>
                        <p className="font-medium">Computer Science</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Minor</p>
                        <p className="font-medium">Data Science</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Academic Level</p>
                        <p className="font-medium">Junior (3rd Year)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Admission Date</p>
                        <p className="font-medium">August 2021</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expected Graduation</p>
                        <p className="font-medium">May 2025</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Academic Advisor</p>
                        <p className="font-medium">Dr. James Wilson</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">GPA Summary</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="border rounded-md p-3">
                          <p className="text-xs text-gray-500">Cumulative</p>
                          <p className="text-xl font-bold text-campusblue-600">3.8</p>
                        </div>
                        <div className="border rounded-md p-3">
                          <p className="text-xs text-gray-500">Major</p>
                          <p className="text-xl font-bold text-campusblue-600">3.9</p>
                        </div>
                        <div className="border rounded-md p-3">
                          <p className="text-xs text-gray-500">Last Semester</p>
                          <p className="text-xl font-bold text-campusblue-600">3.7</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-campusblue-500" />
                      Course History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3">Fall 2022</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">CS201: Data Structures</p>
                              <p className="text-xs text-gray-500">3 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">A</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">MATH201: Calculus II</p>
                              <p className="text-xs text-gray-500">4 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">A-</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">PHYS101: Physics I</p>
                              <p className="text-xs text-gray-500">4 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">B+</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">ENG101: Composition</p>
                              <p className="text-xs text-gray-500">3 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">A</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Spring 2023</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">CS210: Computer Systems</p>
                              <p className="text-xs text-gray-500">3 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">A</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">MATH202: Discrete Mathematics</p>
                              <p className="text-xs text-gray-500">3 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">A-</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">PHYS102: Physics II</p>
                              <p className="text-xs text-gray-500">4 Credits</p>
                            </div>
                            <span className="font-medium text-blue-600">B</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium">HIS101: World History</p>
                              <p className="text-xs text-gray-500">3 Credits</p>
                            </div>
                            <span className="font-medium text-green-600">A</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-5">View Complete Transcript</Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-campusblue-500" />
                      Degree Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">Core Requirements</p>
                          <p className="text-sm">24/30 credits</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-campusblue-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">Major Requirements</p>
                          <p className="text-sm">32/45 credits</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-campusblue-500 h-2.5 rounded-full" style={{ width: '71%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">Electives</p>
                          <p className="text-sm">12/15 credits</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-campusblue-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">General Education</p>
                          <p className="text-sm">24/30 credits</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-campusblue-500 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      <div className="pt-3">
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium">Total Progress</p>
                          <p className="text-sm">68/120 credits</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '57%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-campusblue-500" />
                      Academic Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-yellow-100 p-1.5 rounded-full mt-0.5">
                          <GraduationCap className="h-4 w-4 text-yellow-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Dean's List</p>
                          <p className="text-xs text-gray-500">Fall 2022, Spring 2023</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                          <FileText className="h-4 w-4 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Programming Competition</p>
                          <p className="text-xs text-gray-500">2nd Place, University Hackathon 2023</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-1.5 rounded-full mt-0.5">
                          <BookOpen className="h-4 w-4 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Academic Scholarship</p>
                          <p className="text-xs text-gray-500">Computer Science Merit Award, 2022-2023</p>
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
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-campusblue-500" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-3">Profile Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Full Name</label>
                            <input 
                              type="text" 
                              value="Jane Marie Doe" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Display Name</label>
                            <input 
                              type="text" 
                              value="Jane Doe" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Email Address</label>
                            <input 
                              type="email" 
                              value="jane.doe@university.edu" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                            <input 
                              type="tel" 
                              value="(555) 123-4567" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Address</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Street Address</label>
                            <input 
                              type="text" 
                              value="123 University Ave, Apt 4B" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-500 block mb-1">City</label>
                              <input 
                                type="text" 
                                value="College Town" 
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 block mb-1">State/Zip</label>
                              <input 
                                type="text" 
                                value="ST 12345" 
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-3">Emergency Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Contact Name</label>
                            <input 
                              type="text" 
                              value="John Doe" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Relationship</label>
                            <input 
                              type="text" 
                              value="Father" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                            <input 
                              type="tel" 
                              value="(555) 987-6543" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Email Address</label>
                            <input 
                              type="email" 
                              value="john.doe@example.com" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full">Save Changes</Button>
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
                      <div>
                        <h3 className="text-sm font-medium mb-3">Change Password</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Current Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">New Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-500 block mb-1">Confirm New Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••" 
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>
                        </div>
                        <Button className="w-full mt-3">Update Password</Button>
                      </div>
                      
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
                      Notification Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-xs text-gray-500">Receive updates via email</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-campusblue-500">
                          <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition"></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2">
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-xs text-gray-500">Receive updates via text message</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                          <span className="translate-x-1 inline-block h-4 w-4 rounded-full bg-white transition"></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-xs text-gray-500">Receive mobile app notifications</p>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-campusblue-500">
                          <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition"></span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="grades" checked className="rounded text-campusblue-500" />
                          <label htmlFor="grades" className="text-sm">Grade Updates</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="assignments" checked className="rounded text-campusblue-500" />
                          <label htmlFor="assignments" className="text-sm">Assignment Deadlines</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="events" checked className="rounded text-campusblue-500" />
                          <label htmlFor="events" className="text-sm">Campus Events</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="announcements" checked className="rounded text-campusblue-500" />
                          <label htmlFor="announcements" className="text-sm">Course Announcements</label>
                        </div>
                      </div>
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
