import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useUser } from '@/UserContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  BookOpen,
  Calendar,
  Search,
  Save,
  X,
  Upload,
  FileSpreadsheet,
  Eraser,
} from 'lucide-react';

interface FacultyDetail {
  id: string;
  user_id: string;
  fname: string;
  lname: string;
  email: string;
  mobile_num: string;
  department: string;
  specialization?: string;
  subjects?: string[];
  additional_departments?: string[];
  timetable_url?: string;
  created_at?: string;
}

interface FacultySubject {
  id?: string;
  faculty_id: string;
  subject_name: string;
  subject_code: string;
  department: string;
}

type SlotEntry = { course: string; room: string; class_name: string; is_lab?: boolean; batch_number?: number; lab_id?: string };

const FacultyManagement: React.FC = () => {
  const { userData } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [faculty, setFaculty] = useState<FacultyDetail[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');

  const [facultySubjects, setFacultySubjects] = useState<FacultySubject[]>([]);
  
  // Timetable management state
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [timetableUploading, setTimetableUploading] = useState(false);
  const [manualTimetable, setManualTimetable] = useState<Record<number, SlotEntry[]>>({});
  const [timetableSaving, setTimetableSaving] = useState(false);
  const [labMode, setLabMode] = useState<Record<string, { enabled: boolean; batches: number }>>({});

  const [newFacultyForm, setNewFacultyForm] = useState({
    user_id: '',
    fname: '',
    lname: '',
    email: '',
    mobile_num: '',
    department: '',
    specialization: '',
    additional_departments: [] as string[],
  });

  const [editingFaculty, setEditingFaculty] = useState<FacultyDetail | null>(null);
  const [newSubjectForm, setNewSubjectForm] = useState({
    subject_name: '',
    subject_code: '',
    department: '',
  });

  const departments = ['IT', 'CE', 'CS', 'DIT', 'DCE', 'DCS'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['09:10-10:10', '10:10-11:10', '11:10-12:10', '12:10-01:10', '02:20-03:20', '03:20-04:20'];

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
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultySubjects(selectedFaculty.user_id);
      fetchFacultyTimetable(selectedFaculty.user_id);
    }
  }, [selectedFaculty]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faculty')
        .select('*')
        .order('fname');

      if (error) throw error;
      setFaculty(data || []);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      toast({
        title: 'Error',
        description: 'Failed to load faculty list.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultySubjects = async (facultyId: string) => {
    try {
      const { data, error} = await supabase
        .from('faculty_subjects')
        .select('*')
        .eq('faculty_id', facultyId);

      if (error) throw error;
      setFacultySubjects(data || []);
    } catch (err) {
      console.error('Error fetching faculty subjects:', err);
    }
  };

  const fetchFacultyTimetable = async (facultyId: string) => {
    try {
      // Try to fetch with lab columns first
      let { data, error } = await supabase
        .from('faculty_timetables')
        .select('day_index, slot_index, course, room, class_name, is_lab, batch_number, lab_id')
        .eq('faculty_id', facultyId)
        .order('day_index, slot_index, batch_number');

      // If lab columns don't exist, fall back to basic columns
      if (error && error.message?.includes('column')) {
        console.warn('Lab columns not found, using basic timetable structure');
        const fallback = await supabase
          .from('faculty_timetables')
          .select('day_index, slot_index, course, room, class_name, is_lab, batch_number, lab_id')
          .eq('faculty_id', facultyId)
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
      for (let d = 0; d < days.length; d++) {
        init[d] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
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
            room: row.room || '',
            class_name: row.class_name || ''
          };
        }
      });
      
      // Store lab batches in array at the starting slot
      Object.values(labGroups).forEach((batches) => {
        if (batches.length > 0) {
          const first = batches[0];
          const key = `${first.day_index}-${first.slot_index}`;
          labs[key] = { enabled: true, batches: batches.length };
          if (init[first.day_index] && init[first.day_index][first.slot_index]) {
            init[first.day_index][first.slot_index] = batches.map((b: any) => ({
              course: b.course || '',
              room: b.room || '',
              class_name: b.class_name || '',
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

  const handleCreateFaculty = async () => {
    if (!newFacultyForm.user_id || !newFacultyForm.fname || !newFacultyForm.lname || 
        !newFacultyForm.email || !newFacultyForm.mobile_num || !newFacultyForm.department) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create faculty record
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty')
        .insert([{
          user_id: newFacultyForm.user_id,
          fname: newFacultyForm.fname,
          lname: newFacultyForm.lname,
          email: newFacultyForm.email,
          mobile_num: newFacultyForm.mobile_num,
          department: newFacultyForm.department,
          specialization: newFacultyForm.specialization,
          additional_departments: newFacultyForm.additional_departments,
        }])
        .select()
        .single();

      if (facultyError) throw facultyError;

      toast({
        title: 'Success',
        description: `Faculty ${newFacultyForm.fname} ${newFacultyForm.lname} created successfully.`,
      });

      // Reset form
      setNewFacultyForm({
        user_id: '',
        fname: '',
        lname: '',
        email: '',
        mobile_num: '',
        department: '',
        specialization: '',
        additional_departments: [],
      });

      await fetchFaculty();
      setActiveTab('list');
    } catch (err: any) {
      console.error('Error creating faculty:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create faculty.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!selectedFaculty || !newSubjectForm.subject_name || !newSubjectForm.subject_code || !newSubjectForm.department) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all subject fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('faculty_subjects')
        .insert([{
          faculty_id: selectedFaculty.user_id,
          subject_name: newSubjectForm.subject_name,
          subject_code: newSubjectForm.subject_code,
          department: newSubjectForm.department,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subject added successfully.',
      });

      setNewSubjectForm({ subject_name: '', subject_code: '', department: '' });
      await fetchFacultySubjects(selectedFaculty.user_id);
    } catch (err: any) {
      console.error('Error adding subject:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add subject.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('faculty_subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subject removed successfully.',
      });

      if (selectedFaculty) {
        await fetchFacultySubjects(selectedFaculty.user_id);
      }
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete subject.',
        variant: 'destructive',
      });
    }
  };

  const handleTimetableUpload = async () => {
    if (!timetableFile || !selectedFaculty) {
      toast({
        title: 'No File Selected',
        description: 'Please select a timetable file to upload.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTimetableUploading(true);
      const fileExt = timetableFile.name.split('.').pop();
      const fileName = `${selectedFaculty.user_id}_${Date.now()}.${fileExt}`;
      const filePath = `faculty_timetables/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('timetables')
        .upload(filePath, timetableFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('timetables')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('faculty')
        .update({ timetable_url: urlData.publicUrl })
        .eq('user_id', selectedFaculty.user_id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Timetable uploaded successfully.',
      });

      setTimetableFile(null);
      await fetchFaculty();
      setSelectedFaculty({ ...selectedFaculty, timetable_url: urlData.publicUrl });
    } catch (err: any) {
      console.error('Error uploading timetable:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to upload timetable.',
        variant: 'destructive',
      });
    } finally {
      setTimetableUploading(false);
    }
  };

  const handleTimetableExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFaculty) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const init: Record<number, SlotEntry[]> = {};
      for (let d = 0; d < days.length; d++) {
        init[d] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
      }

      for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
        const row = jsonData[rowIdx];
        for (let colIdx = 1; colIdx < row.length && colIdx <= days.length; colIdx++) {
          const cellValue = row[colIdx];
          if (cellValue && typeof cellValue === 'string') {
            const parts = cellValue.split('|').map((s) => s.trim());
            init[colIdx - 1][rowIdx - 1] = {
              course: parts[0] || '',
              room: parts[1] || '',
              class_name: parts[2] || '',
            };
          }
        }
      }

      setManualTimetable(init);
      toast({
        title: 'Success',
        description: 'Excel data imported successfully. Review and save.',
      });
    } catch (err: any) {
      console.error('Error importing Excel:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to import Excel file.',
        variant: 'destructive',
      });
    }
  };

  const saveManualTimetable = async () => {
    if (!selectedFaculty) return;

    try {
      setTimetableSaving(true);

      // Delete existing timetable
      await supabase
        .from('faculty_timetables')
        .delete()
        .eq('faculty_id', selectedFaculty.user_id);

      // Prepare new entries
      const entries: any[] = [];
      Object.keys(manualTimetable).forEach((dayIndexStr) => {
        const dayIndex = parseInt(dayIndexStr);
        manualTimetable[dayIndex].forEach((slotData, slotIndex) => {
          const key = `${dayIndex}-${slotIndex}`;
          const labInfo = labMode[key];

          if (Array.isArray(slotData) && labInfo?.enabled) {
            // Lab with batches
            const labId = `lab_${selectedFaculty.user_id}_${dayIndex}_${slotIndex}`;
            slotData.forEach((batchData, batchIdx) => {
              if (batchData.course || batchData.room || batchData.class_name) {
                entries.push({
                  faculty_id: selectedFaculty.user_id,
                  day_index: dayIndex,
                  slot_index: slotIndex,
                  course: batchData.course || '',
                  room: batchData.room || '',
                  class_name: batchData.class_name || '',
                  is_lab: true,
                  batch_number: batchIdx + 1,
                  lab_id: labId,
                });
              }
            });
          } else if (!Array.isArray(slotData) && (slotData.course || slotData.room || slotData.class_name)) {
            // Regular slot
            entries.push({
              faculty_id: selectedFaculty.user_id,
              day_index: dayIndex,
              slot_index: slotIndex,
              course: slotData.course || '',
              room: slotData.room || '',
              class_name: slotData.class_name || '',
              is_lab: false,
              batch_number: null,
              lab_id: null,
            });
          }
        });
      });

      if (entries.length > 0) {
        const { error } = await supabase
          .from('faculty_timetables')
          .insert(entries);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Timetable saved successfully.',
      });
    } catch (err: any) {
      console.error('Error saving timetable:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save timetable.',
        variant: 'destructive',
      });
    } finally {
      setTimetableSaving(false);
    }
  };

  const clearManualTimetable = () => {
    const init: Record<number, SlotEntry[]> = {};
    for (let d = 0; d < days.length; d++) {
      init[d] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
    }
    setManualTimetable(init);
    setLabMode({});
  };

  const handleUpdateFaculty = async () => {
    if (!editingFaculty) return;

    try {
      const { error } = await supabase
        .from('faculty')
        .update({
          fname: editingFaculty.fname,
          lname: editingFaculty.lname,
          email: editingFaculty.email,
          mobile_num: editingFaculty.mobile_num,
          department: editingFaculty.department,
          specialization: editingFaculty.specialization,
          additional_departments: editingFaculty.additional_departments,
        })
        .eq('id', editingFaculty.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Faculty updated successfully.',
      });

      setEditingFaculty(null);
      await fetchFaculty();
    } catch (err: any) {
      console.error('Error updating faculty:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update faculty.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFaculty = async (facultyItem: FacultyDetail) => {
    try {
      const { error } = await supabase
        .from('faculty')
        .delete()
        .eq('id', facultyItem.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Faculty deleted successfully.',
      });

      if (selectedFaculty?.id === facultyItem.id) {
        setSelectedFaculty(null);
      }

      await fetchFaculty();
    } catch (err: any) {
      console.error('Error deleting faculty:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete faculty.',
        variant: 'destructive',
      });
    }
  };

  const filteredFaculty = faculty.filter(f =>
    `${f.fname} ${f.lname} ${f.user_id} ${f.email} ${f.department}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-600">Manage faculty members, their subjects, and teaching schedules</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="list">
              <Users className="h-4 w-4 mr-2" />
              Faculty List
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              Add New Faculty
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search faculty by name, ID, email, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Faculty Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFaculty.map((facultyItem) => (
                <Card key={facultyItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{facultyItem.fname} {facultyItem.lname}</span>
                      <Badge variant="secondary">{facultyItem.user_id}</Badge>
                    </CardTitle>
                    <CardDescription>{facultyItem.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p><strong>Primary Dept:</strong> {facultyItem.department}</p>
                      {facultyItem.additional_departments && facultyItem.additional_departments.length > 0 && (
                        <p><strong>Also teaches:</strong> {facultyItem.additional_departments.join(', ')}</p>
                      )}
                      {facultyItem.specialization && (
                        <p><strong>Specialization:</strong> {facultyItem.specialization}</p>
                      )}
                      <p><strong>Mobile:</strong> {facultyItem.mobile_num}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFaculty(facultyItem);
                          setActiveTab('list');
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingFaculty(facultyItem)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete {facultyItem.fname} {facultyItem.lname} and all associated subjects and schedules. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteFaculty(facultyItem)}>
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

            {filteredFaculty.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No faculty found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Faculty Member</CardTitle>
                <CardDescription>Add a new faculty member to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_id">Faculty ID *</Label>
                    <Input
                      id="user_id"
                      placeholder="e.g., FAC001"
                      value={newFacultyForm.user_id}
                      onChange={(e) => setNewFacultyForm({ ...newFacultyForm, user_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="faculty@example.com"
                      value={newFacultyForm.email}
                      onChange={(e) => setNewFacultyForm({ ...newFacultyForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fname">First Name *</Label>
                    <Input
                      id="fname"
                      value={newFacultyForm.fname}
                      onChange={(e) => setNewFacultyForm({ ...newFacultyForm, fname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lname">Last Name *</Label>
                    <Input
                      id="lname"
                      value={newFacultyForm.lname}
                      onChange={(e) => setNewFacultyForm({ ...newFacultyForm, lname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      value={newFacultyForm.mobile_num}
                      onChange={(e) => setNewFacultyForm({ ...newFacultyForm, mobile_num: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Primary Department *</Label>
                    <Select
                      value={newFacultyForm.department}
                      onValueChange={(value) => setNewFacultyForm({ ...newFacultyForm, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      placeholder="e.g., Machine Learning, Networks"
                      value={newFacultyForm.specialization}
                      onChange={(e) => setNewFacultyForm({ ...newFacultyForm, specialization: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setActiveTab('list')}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFaculty} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Faculty
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Faculty Management */}
        {selectedFaculty && activeTab === 'list' && (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Managing: {selectedFaculty.fname} {selectedFaculty.lname}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFaculty(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="subjects">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="subjects">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Subjects
                    </TabsTrigger>
                    <TabsTrigger value="timetable">
                      <Calendar className="h-4 w-4 mr-2" />
                      Timetable
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="subjects" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Add Subject</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <Input
                            placeholder="Subject Name"
                            value={newSubjectForm.subject_name}
                            onChange={(e) => setNewSubjectForm({ ...newSubjectForm, subject_name: e.target.value })}
                          />
                          <Input
                            placeholder="Subject Code"
                            value={newSubjectForm.subject_code}
                            onChange={(e) => setNewSubjectForm({ ...newSubjectForm, subject_code: e.target.value })}
                          />
                          <Select
                            value={newSubjectForm.department}
                            onValueChange={(value) => setNewSubjectForm({ ...newSubjectForm, department: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddSubject} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Subject
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Assigned Subjects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {facultySubjects.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No subjects assigned yet</p>
                        ) : (
                          <div className="space-y-2">
                            {facultySubjects.map((subject) => (
                              <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-semibold">{subject.subject_name}</p>
                                  <p className="text-sm text-gray-600">{subject.subject_code} - {subject.department}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => subject.id && handleDeleteSubject(subject.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="timetable" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Faculty Timetable</CardTitle>
                        <CardDescription>
                          Upload or manage weekly teaching schedule for this faculty member
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Upload PDF/Image Section */}
                        <div className="space-y-2">
                          <Label>Upload Timetable (PDF/Image)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => setTimetableFile(e.target.files?.[0] || null)}
                            />
                            <Button onClick={handleTimetableUpload} disabled={timetableUploading || !timetableFile}>
                              <Upload className="h-4 w-4 mr-2" />
                              {timetableUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                          </div>
                          {selectedFaculty.timetable_url && (
                            <p className="text-xs text-green-600">Current: Timetable uploaded</p>
                          )}
                        </div>

                        {/* CSV/Excel Import */}
                        <div className="space-y-2">
                          <Label>Import from CSV/Excel</Label>
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={handleTimetableExcelImport}
                            />
                          </div>
                          <p className="text-xs text-gray-500">Format: Course|Room|Class Name per cell</p>
                        </div>

                        {/* Manual Editor Actions */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <Label>Manual Timetable Editor</Label>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={clearManualTimetable}>
                              <Eraser className="h-4 w-4 mr-2" />
                              Clear All
                            </Button>
                            <Button size="sm" onClick={saveManualTimetable} disabled={timetableSaving}>
                              <Save className="h-4 w-4 mr-2" />
                              {timetableSaving ? 'Saving...' : 'Save Timetable'}
                            </Button>
                          </div>
                        </div>

                        {/* Simple Preview */}
                        <div className="overflow-x-auto bg-white shadow rounded-lg border mt-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                                {days.map((day) => (
                                  <th key={day} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{day}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {timeSlots.map((slotLabel, rowIndex) => (
                                <tr key={rowIndex}>
                                  <td className="px-3 py-2 text-xs text-gray-600 font-medium bg-gray-50 whitespace-nowrap">{slotLabel}</td>
                                  {days.map((_, dayIndex) => {
                                    const entry = (manualTimetable[dayIndex] || [])[rowIndex];
                                    const hasData = entry && !Array.isArray(entry) && (entry.course || entry.room || entry.class_name);
                                    return (
                                      <td key={`${rowIndex}-${dayIndex}`} className="px-2 py-2 align-top">
                                        <div className="space-y-1">
                                          <Input
                                            placeholder="Course"
                                            value={!Array.isArray(entry) ? entry?.course || '' : ''}
                                            className="h-7 text-xs"
                                            onChange={(e) => {
                                              const newTable = { ...manualTimetable };
                                              if (!newTable[dayIndex]) {
                                                newTable[dayIndex] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
                                              }
                                              newTable[dayIndex][rowIndex] = { 
                                                ...(!Array.isArray(newTable[dayIndex][rowIndex]) ? newTable[dayIndex][rowIndex] : { course: '', room: '', class_name: '' }), 
                                                course: e.target.value 
                                              };
                                              setManualTimetable(newTable);
                                            }}
                                          />
                                          <Input
                                            placeholder="Class Name"
                                            value={!Array.isArray(entry) ? entry?.class_name || '' : ''}
                                            className="h-7 text-xs"
                                            onChange={(e) => {
                                              const newTable = { ...manualTimetable };
                                              if (!newTable[dayIndex]) {
                                                newTable[dayIndex] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
                                              }
                                              newTable[dayIndex][rowIndex] = { 
                                                ...(!Array.isArray(newTable[dayIndex][rowIndex]) ? newTable[dayIndex][rowIndex] : { course: '', room: '', class_name: '' }), 
                                                class_name: e.target.value 
                                              };
                                              setManualTimetable(newTable);
                                            }}
                                          />
                                          <Input
                                            placeholder="Room"
                                            value={!Array.isArray(entry) ? entry?.room || '' : ''}
                                            className="h-7 text-xs"
                                            onChange={(e) => {
                                              const newTable = { ...manualTimetable };
                                              if (!newTable[dayIndex]) {
                                                newTable[dayIndex] = Array.from({ length: timeSlots.length }, () => ({ course: '', room: '', class_name: '' }));
                                              }
                                              newTable[dayIndex][rowIndex] = { 
                                                ...(!Array.isArray(newTable[dayIndex][rowIndex]) ? newTable[dayIndex][rowIndex] : { course: '', room: '', class_name: '' }), 
                                                room: e.target.value 
                                              };
                                              setManualTimetable(newTable);
                                            }}
                                          />
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">✏️ Edit the cells above and click "Save Timetable" to apply changes.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Faculty Dialog */}
        <Dialog open={!!editingFaculty} onOpenChange={() => setEditingFaculty(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Faculty: {editingFaculty?.fname} {editingFaculty?.lname}</DialogTitle>
              <DialogDescription>Update faculty member details</DialogDescription>
            </DialogHeader>
            {editingFaculty && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Faculty ID</Label>
                    <Input value={editingFaculty.user_id} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={editingFaculty.email}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={editingFaculty.fname}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, fname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={editingFaculty.lname}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, lname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      value={editingFaculty.mobile_num}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, mobile_num: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Department</Label>
                    <Select
                      value={editingFaculty.department}
                      onValueChange={(value) => setEditingFaculty({ ...editingFaculty, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Specialization</Label>
                    <Input
                      value={editingFaculty.specialization || ''}
                      onChange={(e) => setEditingFaculty({ ...editingFaculty, specialization: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingFaculty(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFaculty}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default FacultyManagement;
