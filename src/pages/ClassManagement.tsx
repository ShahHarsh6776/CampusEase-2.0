import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/UserContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Search,
  Save,
  Eye,
  UserPlus,
  School,
  FileSpreadsheet,
  Camera,
  Eraser
} from 'lucide-react';
import FaceUploadComponent from '@/components/FaceUploadComponent';

interface ClassDetail {
  id: string;
  class_name: string;
  class_id: string;
  department: string;
  institute: string;
  semester: number;
  academic_year: string;
  description?: string;
  created_at?: string;
  student_count?: number;
  timetable_url?: string;
}

interface StudentDetail {
  id?: string;
  user_id: string;
  fname: string;
  lname: string;
  email: string;
  mobile_num: string;
  roll_no: string;
  dob?: string;
  address?: string;
  emergency_contact?: string;
  course_taken: string;
  class_id: string;
  created_at?: string;
}

const ClassManagement: React.FC = () => {
  const { userData } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassDetail[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('classes');
  
  // Class creation/editing state
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDetail | null>(null);
  const [classForm, setClassForm] = useState({
    class_name: '',
    department: '',
    institute: '',
    semester: 1,
    academic_year: '',
    description: ''
  });

  // Student creation/editing state
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDetail | null>(null);
  const [studentForm, setStudentForm] = useState({
    fname: '',
    lname: '',
    email: '',
    mobile_num: '',
    roll_no: '',
    dob: '',
    address: '',
    emergency_contact: ''
  });

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Excel import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Face training state
  const [faceTrainingStudent, setFaceTrainingStudent] = useState<StudentDetail | null>(null);

  // Timetable upload state
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [timetableUploading, setTimetableUploading] = useState(false);
  const [timetableError, setTimetableError] = useState('');

  // Structured timetable (6 slots per day)
  const timetableDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const timetableTimeSlots = [
    '09:10-10:10',
    '10:10-11:10',
    '11:10-12:10',
    '12:10-01:10',
    '02:20-03:20',
    '03:20-04:20'
  ];
  type SlotEntry = { course: string; professor: string; room: string; is_lab?: boolean; batch_number?: number; lab_id?: string };
  const [manualTimetable, setManualTimetable] = useState<Record<number, SlotEntry[]>>({});
  const [timetableSaving, setTimetableSaving] = useState(false);
  const [labMode, setLabMode] = useState<Record<string, { enabled: boolean; batches: number }>>({});

  const departments = ['IT', 'CE', 'CS', 'DIT', 'DCE', 'DCS'];
  const institutes = ['CSPIT', 'DEPSTAR'];
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear-1}-${currentYear}`,
    `${currentYear}-${currentYear+1}`,
    `${currentYear+1}-${currentYear+2}`
  ];

  // Check if user is admin
  useEffect(() => {
    if (!userData || userData.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "This page is only accessible to administrators.",
        variant: "destructive"
      });
      navigate('/Index');
    }
  }, [userData, navigate, toast]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.class_id);
      fetchClassTimetable(selectedClass.class_id);
    }
  }, [selectedClass]);

  useEffect(() => {
    setTimetableFile(null);
    setTimetableError('');
  }, [selectedClass]);

  const fetchClassTimetable = async (classId: string) => {
    try {
      // Try to fetch with lab columns first
      let { data, error } = await supabase
        .from('class_timetables')
        .select('day_index, slot_index, course, professor, room, is_lab, batch_number, lab_id')
        .eq('class_id', classId)
        .order('day_index, slot_index, batch_number');

      // If lab columns don't exist, fall back to basic columns
      if (error && error.message?.includes('column')) {
        console.warn('Lab columns not found, using basic timetable structure');
        const fallback = await supabase
          .from('class_timetables')
          .select('day_index, slot_index, course, professor, room')
          .eq('class_id', classId)
          .order('day_index, slot_index');
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        console.error('Fetch timetable error:', error);
        throw error;
      }

      const init: Record<number, SlotEntry[]> = {};
      const labs: Record<string, { enabled: boolean; batches: number }> = {};
      for (let d = 0; d < timetableDays.length; d++) {
        init[d] = Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }));
      }
      
      // Group lab entries by lab_id
      const labGroups: Record<string, any[]> = {};
      (data || []).forEach((row) => {
        if (row.is_lab && row.lab_id) {
          if (!labGroups[row.lab_id]) labGroups[row.lab_id] = [];
          labGroups[row.lab_id].push(row);
        } else if (init[row.day_index] && init[row.day_index][row.slot_index] !== undefined) {
          init[row.day_index][row.slot_index] = {
            course: row.course || '',
            professor: row.professor || '',
            room: row.room || ''
          };
        }
      });
      
      // Store lab batches in array at the starting slot
      Object.values(labGroups).forEach((batches) => {
        if (batches.length > 0) {
          const first = batches[0];
          const key = `${first.day_index}-${first.slot_index}`;
          labs[key] = { enabled: true, batches: batches.length };
          // Store all batches at starting slot
          if (init[first.day_index] && init[first.day_index][first.slot_index]) {
            init[first.day_index][first.slot_index] = batches.map(b => ({
              course: b.course || '',
              professor: b.professor || '',
              room: b.room || '',
              is_lab: true,
              batch_number: b.batch_number,
              lab_id: b.lab_id
            })) as any;
          }
        }
      });
      
      setManualTimetable(init);
      setLabMode(labs);
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      // First, get classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (classesError && classesError.code !== 'PGRST116') {
        throw classesError;
      }

      // Get student counts for each class
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (classItem) => {
          const { count } = await supabase
            .from('student_records')
            .select('*', { count: 'exact' })
            .eq('class_id', classItem.class_id);
          
          return {
            ...classItem,
            student_count: count || 0
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_records')
        .select('*')
        .eq('class_id', classId)
        .order('user_id');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students.",
        variant: "destructive"
      });
    }
  };

  const generateClassId = (department: string, year: string) => {
    const yearCode = year.split('-')[0].slice(-2);
    const timestamp = Date.now().toString().slice(-4);
    return `${yearCode}${department.toUpperCase()}${timestamp}`;
  };

  const generateStudentId = (department: string, year: string, index: number) => {
    const yearCode = year.split('-')[0].slice(-2);
    const studentNumber = String(index).padStart(3, '0');
    return `${yearCode}${department.toUpperCase()}${studentNumber}`;
  };

  const generatePassword = (studentId: string) => {
    return `${studentId}@${studentId.slice(0, 2)}`;
  };

  const handleCreateClass = async () => {
    if (!classForm.class_name || !classForm.department || !classForm.institute || !classForm.academic_year) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const classId = generateClassId(classForm.department, classForm.academic_year);
      const course_taken = `${classForm.class_name} - ${classForm.department} - ${classForm.institute}`;

      const classData = {
        class_name: classForm.class_name,
        class_id: classId,
        department: classForm.department,
        institute: classForm.institute,
        semester: classForm.semester,
        academic_year: classForm.academic_year,
        description: classForm.description,
        course_taken: course_taken
      };

      const { error } = await supabase
        .from('class_details')
        .insert([classData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Class "${classForm.class_name}" created successfully with ID: ${classId}`,
      });

      setClassForm({
        class_name: '',
        department: '',
        institute: '',
        semester: 1,
        academic_year: '',
        description: ''
      });
      setIsCreateClassOpen(false);
      fetchClasses();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: "Error",
        description: "Failed to create class. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass || !classForm.class_name || !classForm.department || !classForm.institute || !classForm.academic_year) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const course_taken = `${classForm.class_name} - ${classForm.department} - ${classForm.institute}`;

      const { error } = await supabase
        .from('class_details')
        .update({
          class_name: classForm.class_name,
          department: classForm.department,
          institute: classForm.institute,
          semester: classForm.semester,
          academic_year: classForm.academic_year,
          description: classForm.description,
          course_taken: course_taken
        })
        .eq('id', editingClass.id);

      if (error) throw error;

      // Also update course_taken for all students in this class
      await supabase
        .from('users')
        .update({ course_taken })
        .eq('class_id', editingClass.class_id);

      toast({
        title: "Success",
        description: `Class "${classForm.class_name}" updated successfully.`,
      });

      setEditingClass(null);
      setClassForm({
        class_name: '',
        department: '',
        institute: '',
        semester: 1,
        academic_year: '',
        description: ''
      });
      fetchClasses();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: "Failed to update class. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classDetail: ClassDetail) => {
    try {
      setLoading(true);

      // First, delete all students in this class
      await supabase
        .from('users')
        .delete()
        .eq('class_id', classDetail.class_id);

      // Then delete the class
      const { error } = await supabase
        .from('class_details')
        .delete()
        .eq('id', classDetail.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Class "${classDetail.class_name}" and all its students have been deleted.`,
      });

      if (selectedClass?.id === classDetail.id) {
        setSelectedClass(null);
        setStudents([]);
      }
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassFaceEmbeddings = async (classDetail: ClassDetail) => {
    try {
      setLoading(true);
      
      toast({
        title: "Processing...",
        description: "Deleting face embeddings for all students in this class...",
      });

      const FACE_RECOGNITION_API_URL = 'http://localhost:8000';
      
      const response = await fetch(
        `${FACE_RECOGNITION_API_URL}/class/${classDetail.class_id}/face-embeddings`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete face embeddings');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Successfully deleted face embeddings for ${result.deleted_count} students in "${classDetail.class_name}".`,
      });

    } catch (error) {
      console.error('Error deleting face embeddings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete face embeddings. Make sure the face recognition API is running.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimetableUpload = async () => {
    if (!selectedClass || !timetableFile) {
      setTimetableError('Select a class and choose a file first.');
      return;
    }

    try {
      setTimetableError('');
      setTimetableUploading(true);

      const path = `${selectedClass.class_id}/${Date.now()}-${timetableFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('timetables')
        .upload(path, timetableFile, {
          upsert: true,
          contentType: timetableFile.type
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('timetables')
        .getPublicUrl(path);

      const publicUrl = publicUrlData?.publicUrl;

      const { error: updateError } = await supabase
        .from('class_details')
        .update({ timetable_url: publicUrl })
        .eq('class_id', selectedClass.class_id);

      if (updateError) throw updateError;

      setSelectedClass(prev => prev && prev.class_id === selectedClass.class_id
        ? { ...prev, timetable_url: publicUrl }
        : prev);
      await fetchClasses();

      toast({
        title: 'Timetable updated',
        description: 'Students will see the new timetable in their Schedule page.'
      });
      setTimetableFile(null);
    } catch (error) {
      console.error('Error uploading timetable:', error);
      setTimetableError('Failed to upload timetable. Please try again.');
      toast({
        title: 'Upload failed',
        description: 'Could not upload timetable. Check your connection and try again.',
        variant: 'destructive'
      });
    } finally {
      setTimetableUploading(false);
    }
  };

  const handleTimetableRemove = async () => {
    if (!selectedClass) return;
    try {
      setTimetableUploading(true);
      const { error: updateError } = await supabase
        .from('class_details')
        .update({ timetable_url: null })
        .eq('class_id', selectedClass.class_id);

      if (updateError) throw updateError;

      setSelectedClass(prev => prev && prev.class_id === selectedClass.class_id
        ? { ...prev, timetable_url: undefined }
        : prev);
      await fetchClasses();

      toast({
        title: 'Timetable removed',
        description: 'Students will no longer see a timetable for this class until one is uploaded again.'
      });
    } catch (error) {
      console.error('Error removing timetable:', error);
      toast({
        title: 'Removal failed',
        description: 'Could not remove timetable. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setTimetableUploading(false);
    }
  };

  const downloadSampleTimetableCSV = () => {
    const header = ['day','slot','course','professor','room'];
    const rows = [
      ['Monday','1','IT261','(ARP)','125'],
      ['Monday','2','MA262','(VPN)','125'],
      ['Monday','3','','',''],
      ['Monday','4','IT265','(CUR)','125'],
      ['Monday','5','LAB','(Tutor)','107'],
      ['Monday','6','LAB','(Tutor)','107'],
      ['Tuesday','1','MA262','(HSJ)','109'],
      ['Tuesday','2','IT261','(ARP)','125']
    ];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_timetable.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleTimetableExcelImport = async (file: File) => {
    if (!selectedClass) return;
    try {
      setTimetableUploading(true);
      // Parse CSV or Excel
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        rows = text.split(/\r?\n/).filter(line => line.trim()).map(line => line.split(',').map(cell => cell.trim()));
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      } else {
        toast({ title: 'Unsupported file', description: 'Use CSV or Excel (.xlsx/.xls).', variant: 'destructive' });
        return;
      }

      // Filter out empty rows
      rows = rows.filter(r => r && r.length > 0 && r.some((cell: any) => cell !== undefined && cell !== ''));

      if (rows.length === 0) {
        toast({ title: 'Empty file', description: 'The file contains no data.', variant: 'destructive' });
        return;
      }

      // Expect header: day,slot,course,professor,room
      const [header, ...dataRows] = rows;
      const expected = ['day','slot','course','professor','room'];
      const normalizedHeader = (header || []).map((h: string) => String(h).toLowerCase().trim());
      const validHeader = expected.every((col, i) => normalizedHeader[i] === col);
      if (!validHeader) {
        console.error('Invalid header:', normalizedHeader, 'Expected:', expected);
        toast({ title: 'Invalid format', description: 'Header must be: day,slot,course,professor,room', variant: 'destructive' });
        return;
      }

      if (dataRows.length === 0) {
        toast({ title: 'No data rows', description: 'The file contains only a header.', variant: 'destructive' });
        return;
      }

      // Delete existing entries first
      const { error: deleteError } = await supabase
        .from('class_timetables')
        .delete()
        .eq('class_id', selectedClass.class_id);
      if (deleteError) {
        console.error('Delete error during import:', deleteError);
        throw deleteError;
      }

      const inserts: any[] = [];
      for (const r of dataRows) {
        if (!r || r.length < 2) continue;
        const dayStr = String(r[0] || '').trim();
        const slotStr = String(r[1] || '').trim();
        
        if (!dayStr || !slotStr) continue;
        
        const dayIndex = timetableDays.findIndex(d => d.toLowerCase() === dayStr.toLowerCase());
        const slotIndex = parseInt(slotStr) - 1;
        
        if (dayIndex < 0 || slotIndex < 0 || slotIndex >= timetableTimeSlots.length) {
          console.warn('Invalid day/slot:', dayStr, slotStr);
          continue;
        }
        
        inserts.push({
          class_id: selectedClass.class_id,
          day_index: dayIndex,
          slot_index: slotIndex,
          course: String(r[2] || '').trim(),
          professor: String(r[3] || '').trim(),
          room: String(r[4] || '').trim(),
          is_lab: false,
          batch_number: null,
          lab_id: null
        });
      }

      if (inserts.length === 0) {
        toast({ title: 'No valid rows', description: 'Check the day names and slot numbers.', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('class_timetables')
        .insert(inserts);
      
      if (error) {
        console.error('Insert error during import:', error);
        
        // If lab columns don't exist, try without them
        if (error.message?.includes('column') && (error.message?.includes('is_lab') || error.message?.includes('batch_number') || error.message?.includes('lab_id'))) {
          console.warn('Lab columns not found during import, using basic format');
          const basicInserts = inserts.map(({ class_id, day_index, slot_index, course, professor, room }) => ({
            class_id, day_index, slot_index, course, professor, room
          }));
          const { error: basicError } = await supabase
            .from('class_timetables')
            .insert(basicInserts);
          if (basicError) {
            console.error('Basic insert error:', basicError);
            throw basicError;
          }
          toast({ 
            title: 'Timetable imported (basic mode)', 
            description: `Imported ${inserts.length} slots. Run lab_timetable_schema.sql for lab features.` 
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Timetable imported', description: `Successfully imported ${inserts.length} slots.` });
      }

      await fetchClassTimetable(selectedClass.class_id);
    } catch (err: any) {
      console.error('Timetable import failed:', err);
      const errorMsg = err?.message || 'Please verify the file and try again.';
      toast({ 
        title: 'Import failed', 
        description: errorMsg.includes('column') ? 'Database migration needed. Run lab_timetable_schema.sql' : errorMsg,
        variant: 'destructive' 
      });
    } finally {
      setTimetableUploading(false);
    }
  };

  const saveManualTimetable = async () => {
    if (!selectedClass) return;
    try {
      setTimetableSaving(true);
      
      // First, delete all existing entries for this class
      const { error: deleteError } = await supabase
        .from('class_timetables')
        .delete()
        .eq('class_id', selectedClass.class_id);
      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
      
      const upserts: any[] = [];
      for (let d = 0; d < timetableDays.length; d++) {
        const daySlots = manualTimetable[d] || [];
        for (let s = 0; s < timetableTimeSlots.length; s++) {
          const key = `${d}-${s}`;
          const labInfo = labMode[key];
          
          if (labInfo?.enabled) {
            // Lab mode: insert multiple batches
            const labId = `lab-${selectedClass.class_id}-${d}-${s}`;
            const entry = daySlots[s];
            if (Array.isArray(entry)) {
              entry.forEach((batch, idx) => {
                if (batch.course || batch.professor || batch.room) {
                  upserts.push({
                    class_id: selectedClass.class_id,
                    day_index: d,
                    slot_index: s,
                    course: batch.course,
                    professor: batch.professor,
                    room: batch.room,
                    is_lab: true,
                    batch_number: idx + 1,
                    lab_id: labId
                  });
                }
              });
            }
          } else {
            // Regular slot
            const entry = daySlots[s];
            if (!Array.isArray(entry)) {
              upserts.push({
                class_id: selectedClass.class_id,
                day_index: d,
                slot_index: s,
                course: entry?.course || '',
                professor: entry?.professor || '',
                room: entry?.room || '',
                is_lab: false,
                batch_number: null,
                lab_id: null
              });
            }
          }
        }
      }
      
      if (upserts.length > 0) {
        const { error } = await supabase
          .from('class_timetables')
          .insert(upserts);
        
        if (error) {
          console.error('Insert error:', error);
          
          // If lab columns don't exist, try without them
          if (error.message?.includes('column') && (error.message?.includes('is_lab') || error.message?.includes('batch_number') || error.message?.includes('lab_id'))) {
            console.warn('Lab columns not found, saving as basic timetable');
            const basicUpserts = upserts.map(({ class_id, day_index, slot_index, course, professor, room }) => ({
              class_id, day_index, slot_index, course, professor, room
            }));
            const { error: basicError } = await supabase
              .from('class_timetables')
              .insert(basicUpserts);
            if (basicError) {
              console.error('Basic insert error:', basicError);
              throw basicError;
            }
            toast({ 
              title: 'Timetable saved (basic mode)', 
              description: 'Lab features require database migration. Run lab_timetable_schema.sql first.',
              variant: 'default'
            });
            return;
          }
          throw error;
        }
      }
      
      toast({ title: 'Timetable saved', description: 'Manual edits and lab sessions have been applied.' });
    } catch (err: any) {
      console.error('Save manual timetable failed:', err);
      const errorMsg = err?.message || 'Please try again.';
      toast({ 
        title: 'Save failed', 
        description: errorMsg.includes('column') ? 'Database migration needed. Run lab_timetable_schema.sql' : errorMsg,
        variant: 'destructive' 
      });
    } finally {
      setTimetableSaving(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!selectedClass || !studentForm.fname || !studentForm.lname || !studentForm.mobile_num || !studentForm.roll_no) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including Roll Number.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Check if roll number already exists in this class
      const { data: existingStudent, error: checkError } = await supabase
        .from('student_records')
        .select('roll_no')
        .eq('class_id', selectedClass.class_id)
        .eq('roll_no', studentForm.roll_no)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingStudent) {
        toast({
          title: "Duplicate Roll Number",
          description: `Roll number ${studentForm.roll_no} already exists in this class.`,
          variant: "destructive"
        });
        return;
      }

      // Get next student number for this class for user_id generation
      const { count } = await supabase
        .from('student_records')
        .select('*', { count: 'exact' })
        .eq('class_id', selectedClass.class_id);

      // Use roll number as the student ID
      const studentId = studentForm.roll_no;
      const email = studentForm.email || `${studentForm.roll_no.toLowerCase()}@charusat.edu.in`;

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('student_records')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Duplicate Email",
          description: `Email ${email} already exists.`,
          variant: "destructive"
        });
        return;
      }

      // Create student record
      const studentData = {
        user_id: studentId,
        fname: studentForm.fname,
        lname: studentForm.lname,
        email: email,
        mobile_num: studentForm.mobile_num,
        roll_no: studentForm.roll_no,
        dob: studentForm.dob || null,
        address: studentForm.address || null,
        emergency_contact: studentForm.emergency_contact || null,
        course_taken: `${selectedClass.class_name} - ${selectedClass.department} - ${selectedClass.institute}`,
        class_id: selectedClass.class_id,
        role: 'student',
        email_verified: false,
        account_activated: false
      };

      const { error: dbError } = await supabase
        .from('student_records')
        .insert([studentData]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: `Student "${studentForm.fname} ${studentForm.lname}" created successfully.\nID: ${studentForm.roll_no}`,
      });

      setStudentForm({
        fname: '',
        lname: '',
        email: '',
        mobile_num: '',
        roll_no: '',
        dob: '',
        address: '',
        emergency_contact: ''
      });
      setIsCreateStudentOpen(false);
      fetchStudents(selectedClass.class_id);
      fetchClasses(); // Update student count
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: "Failed to create student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !studentForm.fname || !studentForm.lname || !studentForm.mobile_num || !studentForm.roll_no) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including Roll Number.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Check if roll number already exists in this class (excluding current student)
      const { data: existingStudent, error: checkError } = await supabase
        .from('student_records')
        .select('roll_no, user_id')
        .eq('class_id', selectedClass.class_id)
        .eq('roll_no', studentForm.roll_no)
        .neq('user_id', editingStudent.user_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingStudent) {
        toast({
          title: "Duplicate Roll Number",
          description: `Roll number ${studentForm.roll_no} already exists in this class.`,
          variant: "destructive"
        });
        return;
      }

      // Update user details including roll number
      const { error: userError } = await supabase
        .from('student_records')
        .update({
          fname: studentForm.fname,
          lname: studentForm.lname,
          email: studentForm.email,
          mobile_num: studentForm.mobile_num,
          roll_no: studentForm.roll_no,
          dob: studentForm.dob || null,
          address: studentForm.address || null,
          emergency_contact: studentForm.emergency_contact || null,
        })
        .eq('id', editingStudent.id);

      if (userError) throw userError;

      toast({
        title: "Success",
        description: `Student "${studentForm.fname} ${studentForm.lname}" (ID: ${studentForm.roll_no}) updated successfully.`,
        variant: "default"
      });

      setEditingStudent(null);
      setStudentForm({
        fname: '',
        lname: '',
        email: '',
        mobile_num: '',
        dob: '',
        roll_no: '',
        address: '',
        emergency_contact: ''
      });
      fetchStudents(selectedClass!.class_id);
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (student: StudentDetail) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('student_records')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Student "${student.fname} ${student.lname}" has been deleted.`,
      });

      fetchStudents(selectedClass!.class_id);
      fetchClasses(); // Update student count
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFaceTrainingComplete = () => {
    setFaceTrainingStudent(null);
    toast({
      title: "Success",
      description: "Face training completed successfully!",
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['fname', 'lname', 'email', 'mobile_num', 'roll_no', 'dob'],
      ['John', 'Doe', 'john.doe@example.com', '1234567890', 'CS001', '2000-01-15'],
      ['Jane', 'Smith', 'jane.smith@example.com', '9876543210', 'CS002', '2000-02-20'],
      ['Mike', 'Johnson', '', '5555555555', 'CS003', '']
    ];
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClass) return;

    try {
      setLoading(true);
      
      let rows: string[][] = [];
      
      // Parse CSV or Excel file
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        rows = jsonData as string[][];
      } else {
        toast({
          title: "Unsupported File Format",
          description: "Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.",
          variant: "destructive"
        });
        return;
      }

      // Skip header row and filter out empty rows
      const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0]);
      
      if (dataRows.length === 0) {
        toast({
          title: "Empty File",
          description: "No student data found in the file.",
          variant: "destructive"
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      toast({
        title: "Processing Import",
        description: `Processing ${dataRows.length} students. Please wait...`,
        variant: "default"
      });

      // Process students with delay to avoid rate limiting
      for (const [index, row] of dataRows.entries()) {
        try {
          // Expected format: fname, lname, email, mobile_num, roll_no, dob
          const [fname, lname, email, mobile_num, roll_no, dob] = row;
          
          if (!fname || !lname || !mobile_num || !roll_no) {
            errors.push(`Row ${index + 2}: Missing required fields (fname, lname, mobile_num, roll_no)`);
            errorCount++;
            continue;
          }

          // Clean and validate roll number
          const cleanRollNo = String(roll_no).trim();
          if (!cleanRollNo) {
            errors.push(`Row ${index + 2}: Roll number cannot be empty`);
            errorCount++;
            continue;
          }

          // Check if roll number already exists
          const { data: existingStudent } = await supabase
            .from('student_records')
            .select('roll_no')
            .eq('class_id', selectedClass.class_id)
            .eq('roll_no', cleanRollNo)
            .maybeSingle();

          if (existingStudent) {
            errors.push(`Row ${index + 2}: Roll number ${cleanRollNo} already exists`);
            errorCount++;
            continue;
          }

          // Generate student details
          const { count } = await supabase
            .from('student_records')
            .select('*', { count: 'exact' })
            .eq('class_id', selectedClass.class_id);

          // Use roll number as the student ID
          const studentId = cleanRollNo;
          const studentEmail = email || `${cleanRollNo.toLowerCase()}@charusat.edu.in`;

          // Check if email already exists
          const { data: existingUser } = await supabase
            .from('student_records')
            .select('email')
            .eq('email', studentEmail)
            .maybeSingle();

          if (existingUser) {
            errors.push(`Row ${index + 2}: Email ${studentEmail} already exists`);
            errorCount++;
            continue;
          }

          // Create student record in student_records table
          const studentData = {
            user_id: studentId,
            fname: String(fname).trim(),
            lname: String(lname).trim(),
            email: studentEmail,
            mobile_num: parseInt(String(mobile_num).replace(/\D/g, '')) || null,
            roll_no: cleanRollNo,
            dob: dob ? String(dob).trim() : null,
            course_taken: `${selectedClass.class_name} - ${selectedClass.department} - ${selectedClass.institute}`,
            class_id: selectedClass.class_id,
            role: 'student',
            email_verified: false,
            account_activated: false
          };

          const { error: dbError } = await supabase
            .from('student_records')
            .insert([studentData]);

          if (dbError) {
            console.error('Database error for row', index + 2, ':', dbError);
            errors.push(`Row ${index + 2}: ${dbError.message}`);
            errorCount++;
            continue;
          }

          successCount++;

          // Update progress
          if ((successCount + errorCount) % 5 === 0) {
            toast({
              title: "Processing...",
              description: `Processed ${successCount + errorCount}/${dataRows.length} students`,
              variant: "default"
            });
          }

          // Add small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error('Unexpected error for row', index + 2, ':', error);
          errors.push(`Row ${index + 2}: Unexpected error - ${error}`);
          errorCount++;
        }
      }

      // Show final results
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} students. ${errorCount} errors occurred.${errorCount > 0 ? ' Check console for details.' : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });

      if (errors.length > 0) {
        console.log("Import Errors:", errors);
      }

      // Refresh the data if any students were imported
      if (successCount > 0) {
        await fetchStudents(selectedClass.class_id);
        await fetchClasses();
      }
      
      // Reset file input
      event.target.value = '';

    } catch (error) {
      console.error('Error importing file:', error);
      toast({
        title: "Import Failed",
        description: `Failed to process the file: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditClass = (classDetail: ClassDetail) => {
    setEditingClass(classDetail);
    setClassForm({
      class_name: classDetail.class_name,
      department: classDetail.department,
      institute: classDetail.institute,
      semester: classDetail.semester,
      academic_year: classDetail.academic_year,
      description: classDetail.description || ''
    });
  };

  const openEditStudent = (student: StudentDetail) => {
    setEditingStudent(student);
    setStudentForm({
      fname: student.fname,
      lname: student.lname,
      email: student.email,
      mobile_num: student.mobile_num,
      roll_no: student.roll_no,
      dob: student.dob || '',
      address: student.address || '',
      emergency_contact: student.emergency_contact || ''
    });
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.class_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || classItem.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const filteredStudents = students.filter(student =>
    student.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userData || userData.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Management</h1>
          <p className="text-gray-600">Create and manage classes and student details</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes">Class Management</TabsTrigger>
            <TabsTrigger value="students">Student Management</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-6">
            {/* Class Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    Classes ({filteredClasses.length})
                  </span>
                  <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Class
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Class</DialogTitle>
                        <DialogDescription>
                          Create a new class and generate a unique class ID for student management.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="className">Class Name *</Label>
                            <Input
                              id="className"
                              placeholder="e.g., Depstar IT"
                              value={classForm.class_name}
                              onChange={(e) => setClassForm({...classForm, class_name: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="institute">Institute *</Label>
                            <Select value={classForm.institute} onValueChange={(value) => setClassForm({...classForm, institute: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select institute" />
                              </SelectTrigger>
                              <SelectContent>
                                {institutes.map(institute => (
                                  <SelectItem key={institute} value={institute}>{institute}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department">Department *</Label>
                            <Select value={classForm.department} onValueChange={(value) => setClassForm({...classForm, department: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map(dept => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="semester">Semester</Label>
                            <Select value={String(classForm.semester)} onValueChange={(value) => setClassForm({...classForm, semester: parseInt(value)})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1,2,3,4,5,6,7,8].map(sem => (
                                  <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="academicYear">Academic Year *</Label>
                            <Select value={classForm.academic_year} onValueChange={(value) => setClassForm({...classForm, academic_year: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {academicYears.map(year => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Optional description about the class"
                            value={classForm.description}
                            onChange={(e) => setClassForm({...classForm, description: e.target.value})}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateClass} disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            Create Class
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search classes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClasses.map(classItem => (
                    <Card key={classItem.id} className={`cursor-pointer transition-colors ${
                      selectedClass?.id === classItem.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{classItem.class_name}</CardTitle>
                          <div className="flex gap-1">
                            <Badge variant="outline">{classItem.institute}</Badge>
                            <Badge variant="secondary">{classItem.department}</Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Class ID: {classItem.class_id}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>Institute: {classItem.institute}</div>
                          <div>Department: {classItem.department}</div>
                          <div>Semester: {classItem.semester}</div>
                          <div>Academic Year: {classItem.academic_year}</div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{classItem.student_count} Students</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedClass(classItem)}
                            variant={selectedClass?.id === classItem.id ? "default" : "outline"}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditClass(classItem)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-orange-600 hover:text-orange-700">
                                <Eraser className="h-4 w-4 mr-1" />
                                Clear Faces
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Face Embeddings</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete all face recognition data (embeddings) for {classItem.student_count} students in "{classItem.class_name}". 
                                  Student records will remain intact. Students will need to be retrained for face recognition. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteClassFaceEmbeddings(classItem)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  Delete Embeddings
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete the class "{classItem.class_name}" and all {classItem.student_count} students in it. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteClass(classItem)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedClass && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Timetable for {selectedClass.class_name}</span>
                    <Badge variant="secondary">Class ID: {selectedClass.class_id}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Upload a PDF or image timetable for this class. Students assigned to this class will see the latest version on their Schedule page.
                  </p>

                  {selectedClass.timetable_url ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">Current timetable:</p>
                      <a
                        href={selectedClass.timetable_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-campusblue-600 underline"
                      >
                        View / Download timetable
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No timetable uploaded yet.</p>
                  )}

                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setTimetableFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleTimetableUpload}
                        disabled={!timetableFile || timetableUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedClass.timetable_url ? 'Replace timetable' : 'Upload timetable'}
                      </Button>
                      {selectedClass.timetable_url && (
                        <Button
                          variant="outline"
                          onClick={handleTimetableRemove}
                          disabled={timetableUploading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {timetableFile && (
                    <p className="text-xs text-gray-500">Selected file: {timetableFile.name}</p>
                  )}
                  {timetableError && (
                    <p className="text-sm text-red-500">{timetableError}</p>
                  )}

                  {/* Structured timetable via Excel or Manual Edit */}
                  <div className="pt-4 border-t">
                    <Tabs defaultValue="excel" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="excel">Upload Excel/CSV</TabsTrigger>
                        <TabsTrigger value="manual">Manual Edit (6 slots/day)</TabsTrigger>
                      </TabsList>
                      <TabsContent value="excel" className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Expected columns: <span className="font-mono">day, slot, course, professor, room</span>. Day is one of {timetableDays.join(', ')}. Slot is 1–{timetableTimeSlots.length}.
                        </p>
                        <div className="flex gap-2">
                          <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files && handleTimetableExcelImport(e.target.files[0])} />
                          <Button variant="outline" onClick={downloadSampleTimetableCSV}>
                            <Download className="h-4 w-4 mr-2" /> Sample CSV
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">Tip: Use CSV for quick edits, Excel for richer formatting.</p>
                      </TabsContent>
                      <TabsContent value="manual" className="space-y-4">
                        <div className="mb-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-900"><strong>Lab Mode:</strong> Check "Lab" to enable batch allocation (2-4 batches). Labs span 2 consecutive slots.</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm border">
                            <thead>
                              <tr>
                                <th className="p-2 border bg-gray-50">Day</th>
                                {timetableTimeSlots.map((t, i) => (
                                  <th key={i} className="p-2 border bg-gray-50">Slot {i+1}<br/><span className="text-xs text-gray-500">{t}</span></th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {timetableDays.map((day, dIdx) => (
                                <tr key={day}>
                                  <td className="p-2 border font-medium align-top">{day}</td>
                                  {Array.from({ length: timetableTimeSlots.length }).map((_, sIdx) => {
                                    const key = `${dIdx}-${sIdx}`;
                                    const labInfo = labMode[key] || { enabled: false, batches: 2 };
                                    const entry = (manualTimetable[dIdx] || [])[sIdx];
                                    const isOccupiedByPreviousLab = sIdx > 0 && labMode[`${dIdx}-${sIdx-1}`]?.enabled;
                                    
                                    if (isOccupiedByPreviousLab) {
                                      return (
                                        <td key={sIdx} className="p-2 border bg-gray-100 text-center text-xs text-gray-500">
                                          Lab (continued)
                                        </td>
                                      );
                                    }
                                    
                                    return (
                                      <td key={sIdx} className="p-2 border align-top">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              id={`lab-${key}`}
                                              checked={labInfo.enabled}
                                              onChange={(e) => {
                                                const newEnabled = e.target.checked;
                                                setLabMode(prev => ({
                                                  ...prev,
                                                  [key]: { enabled: newEnabled, batches: newEnabled ? (prev[key]?.batches || 2) : 0 }
                                                }));
                                                if (newEnabled) {
                                                  // Initialize batches
                                                  const numBatches = labInfo.batches || 2;
                                                  setManualTimetable(prev => ({
                                                    ...prev,
                                                    [dIdx]: (prev[dIdx] || Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => 
                                                      i === sIdx ? Array.from({ length: numBatches }, () => ({ course: '', professor: '', room: '' })) as any : v
                                                    )
                                                  }));
                                                } else {
                                                  // Reset to regular slot
                                                  setManualTimetable(prev => ({
                                                    ...prev,
                                                    [dIdx]: (prev[dIdx] || []).map((v, i) => i === sIdx ? { course: '', professor: '', room: '' } : v)
                                                  }));
                                                }
                                              }}
                                              className="rounded"
                                            />
                                            <label htmlFor={`lab-${key}`} className="text-xs font-semibold">Lab</label>
                                            {labInfo.enabled && (
                                              <Select
                                                value={String(labInfo.batches)}
                                                onValueChange={(val) => {
                                                  const count = parseInt(val);
                                                  setLabMode(prev => ({ ...prev, [key]: { enabled: true, batches: count } }));
                                                  setManualTimetable(prev => ({
                                                    ...prev,
                                                    [dIdx]: (prev[dIdx] || []).map((v, i) => {
                                                      if (i === sIdx) {
                                                        const existing = Array.isArray(v) ? v : [];
                                                        const newArr = Array.from({ length: count }, (_, idx) => existing[idx] || { course: '', professor: '', room: '' });
                                                        return newArr as any;
                                                      }
                                                      return v;
                                                    })
                                                  }));
                                                }}
                                              >
                                                <SelectTrigger className="h-6 text-xs w-16">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="2">2</SelectItem>
                                                  <SelectItem value="3">3</SelectItem>
                                                  <SelectItem value="4">4</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            )}
                                          </div>
                                          
                                          {labInfo.enabled && Array.isArray(entry) ? (
                                            <div className="space-y-3">
                                              {entry.map((batch, bIdx) => (
                                                <div key={bIdx} className="p-2 bg-amber-50 rounded space-y-1 border border-amber-200">
                                                  <div className="text-xs font-bold text-amber-900">Batch {bIdx + 1}</div>
                                                  <Input
                                                    placeholder="Course"
                                                    value={batch.course || ''}
                                                    className="h-7 text-xs"
                                                    onChange={(e) => setManualTimetable(prev => ({
                                                      ...prev,
                                                      [dIdx]: (prev[dIdx] || []).map((v, i) => {
                                                        if (i === sIdx && Array.isArray(v)) {
                                                          return v.map((b, bi) => bi === bIdx ? { ...b, course: e.target.value } : b) as any;
                                                        }
                                                        return v;
                                                      })
                                                    }))}
                                                  />
                                                  <Input
                                                    placeholder="Professor"
                                                    value={batch.professor || ''}
                                                    className="h-7 text-xs"
                                                    onChange={(e) => setManualTimetable(prev => ({
                                                      ...prev,
                                                      [dIdx]: (prev[dIdx] || []).map((v, i) => {
                                                        if (i === sIdx && Array.isArray(v)) {
                                                          return v.map((b, bi) => bi === bIdx ? { ...b, professor: e.target.value } : b) as any;
                                                        }
                                                        return v;
                                                      })
                                                    }))}
                                                  />
                                                  <Input
                                                    placeholder="Room"
                                                    value={batch.room || ''}
                                                    className="h-7 text-xs"
                                                    onChange={(e) => setManualTimetable(prev => ({
                                                      ...prev,
                                                      [dIdx]: (prev[dIdx] || []).map((v, i) => {
                                                        if (i === sIdx && Array.isArray(v)) {
                                                          return v.map((b, bi) => bi === bIdx ? { ...b, room: e.target.value } : b) as any;
                                                        }
                                                        return v;
                                                      })
                                                    }))}
                                                  />
                                                </div>
                                              ))}
                                              <div className="text-xs text-gray-500 italic">Spans slots {sIdx+1} & {sIdx+2}</div>
                                            </div>
                                          ) : (
                                            <div className="space-y-1">
                                              <Input
                                                placeholder="Course"
                                                value={!Array.isArray(entry) ? entry?.course || '' : ''}
                                                className="h-7 text-xs"
                                                onChange={(e) => setManualTimetable((prev) => ({
                                                  ...prev,
                                                  [dIdx]: (prev[dIdx] ? [...prev[dIdx]] : Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => i === sIdx ? { ...(!Array.isArray(v) ? v : { course: '', professor: '', room: '' }), course: e.target.value } : v)
                                                }))}
                                              />
                                              <Input
                                                placeholder="Professor"
                                                value={!Array.isArray(entry) ? entry?.professor || '' : ''}
                                                className="h-7 text-xs"
                                                onChange={(e) => setManualTimetable((prev) => ({
                                                  ...prev,
                                                  [dIdx]: (prev[dIdx] ? [...prev[dIdx]] : Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => i === sIdx ? { ...(!Array.isArray(v) ? v : { course: '', professor: '', room: '' }), professor: e.target.value } : v)
                                                }))}
                                              />
                                              <Input
                                                placeholder="Room"
                                                value={!Array.isArray(entry) ? entry?.room || '' : ''}
                                                className="h-7 text-xs"
                                                onChange={(e) => setManualTimetable((prev) => ({
                                                  ...prev,
                                                  [dIdx]: (prev[dIdx] ? [...prev[dIdx]] : Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => i === sIdx ? { ...(!Array.isArray(v) ? v : { course: '', professor: '', room: '' }), room: e.target.value } : v)
                                                }))}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={saveManualTimetable} disabled={timetableSaving}>
                            <Save className="h-4 w-4 mr-2" /> Save Timetable
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  {/* Timetable Preview - Editable */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Quick Edit & Preview (Student View)
                      </h3>
                      <Button onClick={saveManualTimetable} disabled={timetableSaving} size="sm">
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                      </Button>
                    </div>
                    <div className="overflow-x-auto bg-white shadow rounded-lg border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                            {timetableDays.map((day) => (
                              <th key={day} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{day}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timetableTimeSlots.map((slotLabel, rowIndex) => {
                            const isSkipRow = timetableDays.some((_, dayIndex) => {
                              const key = `${dayIndex}-${rowIndex - 1}`;
                              return labMode[key]?.enabled;
                            });
                            
                            if (isSkipRow) return null;
                            
                            return (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs text-gray-600 font-medium bg-gray-50 whitespace-nowrap align-top">{slotLabel}</td>
                                {timetableDays.map((_, dayIndex) => {
                                  const key = `${dayIndex}-${rowIndex}`;
                                  const labInfo = labMode[key];
                                  const entry = (manualTimetable[dayIndex] || [])[rowIndex];
                                  const isLabArray = labInfo?.enabled && Array.isArray(entry);
                                  
                                  if (isLabArray) {
                                    return (
                                      <td key={`${rowIndex}-${dayIndex}`} className="px-2 py-2 align-top" rowSpan={2}>
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-1 rounded">LAB</div>
                                            <input
                                              type="checkbox"
                                              checked={true}
                                              onChange={() => {
                                                setLabMode(prev => ({ ...prev, [key]: { enabled: false, batches: 0 } }));
                                                setManualTimetable(prev => ({
                                                  ...prev,
                                                  [dayIndex]: (prev[dayIndex] || []).map((v, i) => i === rowIndex ? { course: '', professor: '', room: '' } : v)
                                                }));
                                              }}
                                              className="rounded"
                                              title="Uncheck to convert to regular slot"
                                            />
                                          </div>
                                          {(entry as any[]).map((batch, bIdx) => (
                                            <div key={bIdx} className="p-2 bg-purple-50 rounded border border-purple-200 space-y-1">
                                              <div className="text-xs font-bold text-purple-800">Batch {bIdx + 1}</div>
                                              <Input
                                                placeholder="Course"
                                                value={batch.course || ''}
                                                className="h-7 text-xs"
                                                onChange={(e) => setManualTimetable(prev => ({
                                                  ...prev,
                                                  [dayIndex]: (prev[dayIndex] || []).map((v, i) => {
                                                    if (i === rowIndex && Array.isArray(v)) {
                                                      return v.map((b, bi) => bi === bIdx ? { ...b, course: e.target.value } : b) as any;
                                                    }
                                                    return v;
                                                  })
                                                }))}
                                              />
                                              <Input
                                                placeholder="Professor"
                                                value={batch.professor || ''}
                                                className="h-7 text-xs"
                                                onChange={(e) => setManualTimetable(prev => ({
                                                  ...prev,
                                                  [dayIndex]: (prev[dayIndex] || []).map((v, i) => {
                                                    if (i === rowIndex && Array.isArray(v)) {
                                                      return v.map((b, bi) => bi === bIdx ? { ...b, professor: e.target.value } : b) as any;
                                                    }
                                                    return v;
                                                  })
                                                }))}
                                              />
                                              <Input
                                                placeholder="Room"
                                                value={batch.room || ''}
                                                className="h-7 text-xs"
                                                onChange={(e) => setManualTimetable(prev => ({
                                                  ...prev,
                                                  [dayIndex]: (prev[dayIndex] || []).map((v, i) => {
                                                    if (i === rowIndex && Array.isArray(v)) {
                                                      return v.map((b, bi) => bi === bIdx ? { ...b, room: e.target.value } : b) as any;
                                                    }
                                                    return v;
                                                  })
                                                }))}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    const hasData = !Array.isArray(entry) && (entry?.course || entry?.professor || entry?.room);
                                    return (
                                      <td key={`${rowIndex}-${dayIndex}`} className="px-2 py-2 align-top">
                                        <div className={`p-2 rounded space-y-1 ${hasData ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-500">Regular</span>
                                            <input
                                              type="checkbox"
                                              checked={false}
                                              onChange={() => {
                                                setLabMode(prev => ({ ...prev, [key]: { enabled: true, batches: 2 } }));
                                                setManualTimetable(prev => ({
                                                  ...prev,
                                                  [dayIndex]: (prev[dayIndex] || []).map((v, i) => 
                                                    i === rowIndex ? Array.from({ length: 2 }, () => ({ course: '', professor: '', room: '' })) as any : v
                                                  )
                                                }));
                                              }}
                                              className="rounded"
                                              title="Check to convert to lab"
                                            />
                                          </div>
                                          <Input
                                            placeholder="Course"
                                            value={!Array.isArray(entry) ? entry?.course || '' : ''}
                                            className="h-7 text-xs"
                                            onChange={(e) => setManualTimetable((prev) => ({
                                              ...prev,
                                              [dayIndex]: (prev[dayIndex] || Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => 
                                                i === rowIndex ? { ...(!Array.isArray(v) ? v : { course: '', professor: '', room: '' }), course: e.target.value } : v
                                              )
                                            }))}
                                          />
                                          <Input
                                            placeholder="Professor"
                                            value={!Array.isArray(entry) ? entry?.professor || '' : ''}
                                            className="h-7 text-xs"
                                            onChange={(e) => setManualTimetable((prev) => ({
                                              ...prev,
                                              [dayIndex]: (prev[dayIndex] || Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => 
                                                i === rowIndex ? { ...(!Array.isArray(v) ? v : { course: '', professor: '', room: '' }), professor: e.target.value } : v
                                              )
                                            }))}
                                          />
                                          <Input
                                            placeholder="Room"
                                            value={!Array.isArray(entry) ? entry?.room || '' : ''}
                                            className="h-7 text-xs"
                                            onChange={(e) => setManualTimetable((prev) => ({
                                              ...prev,
                                              [dayIndex]: (prev[dayIndex] || Array.from({ length: timetableTimeSlots.length }, () => ({ course: '', professor: '', room: '' }))).map((v, i) => 
                                                i === rowIndex ? { ...(!Array.isArray(v) ? v : { course: '', professor: '', room: '' }), room: e.target.value } : v
                                              )
                                            }))}
                                          />
                                        </div>
                                      </td>
                                    );
                                  }
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✏️ Edit directly in the preview. Check/uncheck the box to toggle between regular slot and lab mode. Click "Save Changes" to apply.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Class Dialog */}
            <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Class: {editingClass?.class_name}</DialogTitle>
                  <DialogDescription>
                    Update class details. Class ID cannot be changed.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editClassName">Class Name *</Label>
                      <Input
                        id="editClassName"
                        value={classForm.class_name}
                        onChange={(e) => setClassForm({...classForm, class_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Class ID (Read-only)</Label>
                      <Input value={editingClass?.class_id || ''} disabled />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editInstitute">Institute *</Label>
                      <Select value={classForm.institute} onValueChange={(value) => setClassForm({...classForm, institute: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {institutes.map(institute => (
                            <SelectItem key={institute} value={institute}>{institute}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editDepartment">Department *</Label>
                      <Select value={classForm.department} onValueChange={(value) => setClassForm({...classForm, department: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editSemester">Semester</Label>
                      <Select value={String(classForm.semester)} onValueChange={(value) => setClassForm({...classForm, semester: parseInt(value)})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editAcademicYear">Academic Year *</Label>
                      <Select value={classForm.academic_year} onValueChange={(value) => setClassForm({...classForm, academic_year: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      value={classForm.description}
                      onChange={(e) => setClassForm({...classForm, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditingClass(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateClass} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Update Class
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            {!selectedClass ? (
              <Card>
                <CardContent className="text-center py-8">
                  <School className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Please select a class from the "Class Management" tab to manage students.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Student Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Students in {selectedClass.class_name} ({filteredStudents.length})
                      </span>
                      <div className="flex gap-2">
                        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                              <FileSpreadsheet className="h-4 w-4" />
                              Import Students
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Import Students from File</DialogTitle>
                              <DialogDescription>
                                Upload a CSV or Excel file with student data. Follow the format guidelines below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="csvFile">Select File (CSV or Excel)</Label>
                                <Input
                                  id="csvFile"
                                  type="file"
                                  accept=".csv,.xlsx,.xls"
                                  onChange={handleFileImport}
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={downloadSampleCSV}
                                  className="flex items-center gap-2 mt-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download Sample CSV Template
                                </Button>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p><strong>File format requirements:</strong></p>
                                <ul className="list-disc list-inside mt-2">
                                  <li>Supported formats: CSV (.csv), Excel (.xlsx, .xls)</li>
                                  <li>Header row: fname,lname,email,mobile_num,roll_no,dob</li>
                                  <li>First Name (required)</li>
                                  <li>Last Name (required)</li>
                                  <li>Email (optional - will auto-generate if empty)</li>
                                  <li>Mobile Number (required)</li>
                                  <li>Roll Number (required - must be unique within class)</li>
                                  <li>Date of Birth (optional - format: YYYY-MM-DD)</li>
                                </ul>
                                <p className="mt-2 text-blue-600">
                                  <strong>Example CSV:</strong><br/>
                                  <code className="text-xs">fname,lname,email,mobile_num,roll_no,dob<br/>
                                  John,Doe,john.doe@example.com,1234567890,CS001,2000-01-15</code>
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={isCreateStudentOpen} onOpenChange={setIsCreateStudentOpen}>
                          <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Add Student
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add New Student</DialogTitle>
                              <DialogDescription>
                                Add a new student to {selectedClass.class_name}. Student ID and password will be auto-generated.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="studentFirstName">First Name *</Label>
                                  <Input
                                    id="studentFirstName"
                                    value={studentForm.fname}
                                    onChange={(e) => setStudentForm({...studentForm, fname: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="studentLastName">Last Name *</Label>
                                  <Input
                                    id="studentLastName"
                                    value={studentForm.lname}
                                    onChange={(e) => setStudentForm({...studentForm, lname: e.target.value})}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="studentRollNo">Roll Number *</Label>
                                  <Input
                                    id="studentRollNo"
                                    placeholder="e.g., 001, 002, etc."
                                    value={studentForm.roll_no}
                                    onChange={(e) => setStudentForm({...studentForm, roll_no: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="studentMobile">Mobile Number *</Label>
                                  <Input
                                    id="studentMobile"
                                    value={studentForm.mobile_num}
                                    onChange={(e) => setStudentForm({...studentForm, mobile_num: e.target.value})}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="studentEmail">Email (Optional)</Label>
                                  <Input
                                    id="studentEmail"
                                    type="email"
                                    placeholder="Will auto-generate if empty"
                                    value={studentForm.email}
                                    onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="studentDob">Date of Birth</Label>
                                  <Input
                                    id="studentDob"
                                    type="date"
                                    value={studentForm.dob}
                                    onChange={(e) => setStudentForm({...studentForm, dob: e.target.value})}
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="studentEmergency">Emergency Contact</Label>
                                  <Input
                                    id="studentEmergency"
                                    value={studentForm.emergency_contact}
                                    onChange={(e) => setStudentForm({...studentForm, emergency_contact: e.target.value})}
                                  />
                                </div>
                                <div></div> {/* Empty cell for spacing */}
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="studentAddress">Address</Label>
                                <Textarea
                                  id="studentAddress"
                                  value={studentForm.address}
                                  onChange={(e) => setStudentForm({...studentForm, address: e.target.value})}
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsCreateStudentOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleCreateStudent} disabled={loading}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Add Student
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>

                    <div className="space-y-2">
                      {filteredStudents.map(student => (
                        <div key={student.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{student.fname} {student.lname}</div>
                            <div className="text-sm text-gray-500 space-y-1">
                              <div>ID: {student.roll_no}</div>
                              <div>Email: {student.email} • Mobile: {student.mobile_num}</div>
                              {student.dob && <div>DOB: {student.dob}</div>}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditStudent(student)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => setFaceTrainingStudent(student)}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Train Face
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {student.fname} {student.lname} from the system. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteStudent(student)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No students found in this class.</p>
                        <p className="text-sm">Use the "Add Student" button to add students manually.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Edit Student Dialog */}
                <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Student: {editingStudent?.fname} {editingStudent?.lname}</DialogTitle>
                      <DialogDescription>
                        Update student details. Student ID cannot be changed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editStudentFirstName">First Name *</Label>
                          <Input
                            id="editStudentFirstName"
                            value={studentForm.fname}
                            onChange={(e) => setStudentForm({...studentForm, fname: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editStudentLastName">Last Name *</Label>
                          <Input
                            id="editStudentLastName"
                            value={studentForm.lname}
                            onChange={(e) => setStudentForm({...studentForm, lname: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Student ID (Read-only)</Label>
                          <Input value={editingStudent?.user_id || ''} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editStudentRollNo">Roll Number *</Label>
                          <Input
                            id="editStudentRollNo"
                            value={studentForm.roll_no}
                            onChange={(e) => setStudentForm({...studentForm, roll_no: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editStudentEmail">Email *</Label>
                          <Input
                            id="editStudentEmail"
                            type="email"
                            value={studentForm.email}
                            onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editStudentMobile">Mobile Number *</Label>
                          <Input
                            id="editStudentMobile"
                            value={studentForm.mobile_num}
                            onChange={(e) => setStudentForm({...studentForm, mobile_num: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editStudentEmergency">Emergency Contact</Label>
                          <Input
                            id="editStudentEmergency"
                            value={studentForm.emergency_contact}
                            onChange={(e) => setStudentForm({...studentForm, emergency_contact: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editStudentAddress">Address</Label>
                          <Textarea
                            id="editStudentAddress"
                            value={studentForm.address}
                            onChange={(e) => setStudentForm({...studentForm, address: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingStudent(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateStudent} disabled={loading}>
                          <Save className="h-4 w-4 mr-2" />
                          Update Student
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Face Training Dialog */}
                <Dialog open={!!faceTrainingStudent} onOpenChange={() => setFaceTrainingStudent(null)}>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Train Face Recognition for {faceTrainingStudent?.fname} {faceTrainingStudent?.lname}
                      </DialogTitle>
                      <DialogDescription>
                        Upload training photos for {faceTrainingStudent?.fname} {faceTrainingStudent?.lname} (ID: {faceTrainingStudent?.roll_no}) to enable face recognition in attendance marking.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      {faceTrainingStudent && (
                        <FaceUploadComponent
                          studentId={faceTrainingStudent.roll_no}
                          studentName={`${faceTrainingStudent.fname} ${faceTrainingStudent.lname}`}
                          department={selectedClass ? `${selectedClass.institute} ${selectedClass.department}` : faceTrainingStudent.course_taken}
                          onTrainingComplete={handleFaceTrainingComplete}
                          showUploadOption={true}
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ClassManagement;