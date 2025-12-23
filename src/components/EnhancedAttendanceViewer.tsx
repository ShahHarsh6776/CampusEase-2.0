/**
 * Enhanced Attendance Viewer Component
 * Displays annotated face recognition results with statistics
 * Perfect for e-governance system transparency
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, CheckCircle, XCircle, Users } from 'lucide-react';

interface AttendanceStatistics {
  total_detected: number;
  identified: number;
  not_identified: number;
}

interface AttendanceResult {
  student_id: string;
  student_name: string;
  confidence: number;
  status: string;
  detected: boolean;
}

interface MassRecognitionResponse {
  success: boolean;
  message: string;
  attendance_results: AttendanceResult[];
  annotated_image: string;
  annotated_image_path: string;
  statistics: AttendanceStatistics;
  processing_time_ms: number;
  total_faces_detected: number;
  total_students_in_class: number;
}

export const EnhancedAttendanceViewer: React.FC = () => {
  const [recognitionResult, setRecognitionResult] = useState<MassRecognitionResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnnotated, setShowAnnotated] = useState(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleMassRecognition = async () => {
    if (!selectedFile) {
      alert('Please select a class photo first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('class_photo', selectedFile);
      
      // Get attendance data from your form or state
      const attendanceData = {
        class_id: 'CS-A1',
        subject: 'Data Structures',
        class_type: 'Lecture',
        date: new Date().toISOString().split('T')[0],
        faculty_id: 'FAC001',
        faculty_name: 'Dr. Smith'
      };
      
      formData.append('attendance_data', JSON.stringify(attendanceData));

      const response = await fetch('http://localhost:8000/mass-recognition', {
        method: 'POST',
        body: formData
      });

      const data: MassRecognitionResponse = await response.json();
      
      if (data.success) {
        setRecognitionResult(data);
        setShowAnnotated(true);
      } else {
        alert('Recognition failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error during mass recognition:', error);
      alert('Failed to perform face recognition');
    } finally {
      setLoading(false);
    }
  };

  const downloadAnnotatedImage = () => {
    if (recognitionResult?.annotated_image) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${recognitionResult.annotated_image}`;
      link.download = `attendance_${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderStatisticsCards = () => {
    if (!recognitionResult) return null;

    const stats = recognitionResult.statistics;
    const accuracyRate = ((stats.identified / stats.total_detected) * 100).toFixed(1);

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Detected</p>
                <p className="text-3xl font-bold text-blue-700">{stats.total_detected}</p>
              </div>
              <Users className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Identified</p>
                <p className="text-3xl font-bold text-green-700">{stats.identified}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Not Identified</p>
                <p className="text-3xl font-bold text-red-700">{stats.not_identified}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Accuracy</p>
                <p className="text-3xl font-bold text-purple-700">{accuracyRate}%</p>
              </div>
              <Eye className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAttendanceTable = () => {
    if (!recognitionResult) return null;

    const presentStudents = recognitionResult.attendance_results.filter(r => r.status === 'present');
    const absentStudents = recognitionResult.attendance_results.filter(r => r.status === 'absent');

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Present Students */}
            <div>
              <h3 className="font-semibold text-green-700 mb-2">
                Present ({presentStudents.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {presentStudents.map((student, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-lg">{student.student_id}</p>
                      <p className="text-sm text-gray-600">{student.student_name}</p>
                    </div>
                    {student.confidence > 0 && (
                      <span className="text-sm font-semibold text-green-700">
                        {(student.confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Absent Students */}
            {absentStudents.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-700 mb-2">
                  Absent ({absentStudents.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {absentStudents.map((student, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-lg">{student.student_id}</p>
                        <p className="text-sm text-gray-600">{student.student_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Enhanced Face Recognition Attendance</CardTitle>
          <p className="text-gray-600">
            Upload a class photo to automatically mark attendance with visual verification
          </p>
        </CardHeader>
        <CardContent>
          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block mb-2 font-medium">Select Class Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={handleMassRecognition}
              disabled={!selectedFile || loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Perform Face Recognition'}
            </Button>
            
            {recognitionResult && (
              <Button
                onClick={downloadAnnotatedImage}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Result
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          {renderStatisticsCards()}

          {/* Annotated Image Display */}
          {recognitionResult && showAnnotated && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Annotated Recognition Result</CardTitle>
                <p className="text-sm text-gray-600">
                  <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
                  Green boxes = Identified students
                  <span className="inline-block w-3 h-3 bg-red-500 ml-4 mr-2"></span>
                  Red boxes = Unknown faces
                </p>
              </CardHeader>
              <CardContent>
                <img
                  src={`data:image/jpeg;base64,${recognitionResult.annotated_image}`}
                  alt="Annotated class photo"
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="mt-4 text-sm text-gray-600">
                  Processing time: {recognitionResult.processing_time_ms.toFixed(2)}ms
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Table */}
          {renderAttendanceTable()}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAttendanceViewer;
