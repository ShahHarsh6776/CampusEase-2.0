import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/supabase/supabaseClient';
import { useUser } from '@/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Trash2,
  User,
  BookOpen,
  Plus,
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  description: string;
  subject: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploader_name: string;
  uploader_role: 'student' | 'faculty' | 'admin';
  department: string;
  semester: number;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

const Resources = () => {
  const { userData } = useUser();
  const { toast } = useToast();

  const [resources, setResources] = useState<Resource[]>([]);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [myPendingResources, setMyPendingResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('browse');

  // Upload form state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subject: '',
    department: userData?.department || '',
    semester: userData?.semester || 1,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Subjects list
  const subjects = [
    'Data Structures',
    'Database Management',
    'Computer Networks',
    'Operating Systems',
    'Software Engineering',
    'Web Development',
    'Machine Learning',
    'Computer Graphics',
    'Mobile App Development',
    'Cyber Security',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Other',
  ];

  const departments = ['IT', 'CE', 'CS', 'DIT', 'DCE', 'DCS'];

  useEffect(() => {
    fetchResources();
    if (userData?.role === 'admin') {
      fetchPendingResources();
    }
    if (userData?.user_id) {
      fetchMyPendingResources();
    }
  }, [userData]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      
      // Fetch approved resources (visible to all)
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched approved resources:', data);
      setResources(data || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingResources = async () => {
    try {
      console.log('Fetching pending resources as admin...');
      console.log('Current user:', userData);
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }

      console.log('Fetched pending resources count:', data?.length);
      console.log('Fetched pending resources:', data);
      setPendingResources(data || []);
    } catch (error: any) {
      console.error('Error fetching pending resources:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pending resources',
        variant: 'destructive',
      });
    }
  };

  const fetchMyPendingResources = async () => {
    try {
      console.log('Fetching my pending resources...');
      console.log('Current user_id:', userData?.user_id);
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by', userData?.user_id)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }

      console.log('Fetched my pending resources count:', data?.length);
      console.log('Fetched my pending resources:', data);
      setMyPendingResources(data || []);
    } catch (error: any) {
      console.error('Error fetching my pending resources:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.title || !uploadForm.subject) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and select a file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      console.log('Starting upload with userData:', userData);
      console.log('user_id:', userData?.user_id);
      console.log('role:', userData?.role);

      // Upload file to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${userData?.user_id}_${Date.now()}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, uploadFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // Faculty uploads are auto-approved, student uploads need approval
      const isAutoApproved = userData?.role === 'faculty' || userData?.role === 'admin';

      console.log('Inserting resource with:', {
        uploaded_by: userData?.user_id,
        uploader_name: `${userData?.fname} ${userData?.lname}`,
        uploader_role: userData?.role,
        is_approved: isAutoApproved
      });

      // Insert resource record
      const { data: insertedData, error: insertError } = await supabase
        .from('resources')
        .insert([{
          title: uploadForm.title,
          description: uploadForm.description,
          subject: uploadForm.subject,
          file_url: urlData.publicUrl,
          file_name: uploadFile.name,
          file_type: uploadFile.type,
          file_size: uploadFile.size,
          uploaded_by: userData?.user_id,
          uploader_name: `${userData?.fname} ${userData?.lname}`,
          uploader_role: userData?.role,
          department: uploadForm.department,
          semester: uploadForm.semester,
          is_approved: isAutoApproved,
          approved_by: isAutoApproved ? userData?.user_id : null,
          approved_at: isAutoApproved ? new Date().toISOString() : null,
        }])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted resource:', insertedData);

      toast({
        title: 'Success',
        description: isAutoApproved 
          ? 'Resource uploaded and published successfully!' 
          : 'Resource uploaded! Waiting for admin approval.',
      });

      // Reset form
      setUploadForm({
        title: '',
        description: '',
        subject: '',
        department: userData?.department || '',
        semester: userData?.semester || 1,
      });
      setUploadFile(null);
      setUploadDialogOpen(false);

      // Refresh resources
      fetchResources();
      if (userData?.role === 'admin') {
        fetchPendingResources();
      }
      if (userData?.user_id) {
        fetchMyPendingResources();
      }
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload resource',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (resourceId: number) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({
          is_approved: true,
          approved_by: userData?.user_id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource approved successfully!',
      });

      fetchResources();
      if (userData?.role === 'admin') {
        fetchPendingResources();
      }
      if (userData?.user_id) {
        fetchMyPendingResources();
      }
    } catch (error: any) {
      console.error('Error approving resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve resource',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (resourceId: number, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/resources/');
      if (urlParts.length > 1) {
        const filePath = `resources/${urlParts[1].split('?')[0]}`;
        
        // Delete file from storage
        await supabase.storage
          .from('resources')
          .remove([filePath]);
      }

      // Delete database record
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource deleted successfully!',
      });

      fetchResources();
      if (userData?.role === 'admin') {
        fetchPendingResources();
      }
      if (userData?.user_id) {
        fetchMyPendingResources();
      }
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || resource.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const uniqueSubjects = ['all', ...Array.from(new Set(resources.map(r => r.subject)))];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Learning Resources</h1>
              <p className="text-gray-600">Access and share academic resources</p>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload New Resource</DialogTitle>
                  <DialogDescription>
                    {userData?.role === 'faculty' || userData?.role === 'admin'
                      ? 'Your resource will be published immediately.'
                      : 'Your resource will be submitted for admin approval.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="e.g., Data Structures Lecture Notes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Brief description of the resource"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select
                        value={uploadForm.subject}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={uploadForm.department}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                    />
                    <p className="text-xs text-gray-500">Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP (Max 50MB)</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="browse">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Resources
            </TabsTrigger>
            {userData?.role !== 'admin' && myPendingResources.length > 0 && (
              <TabsTrigger value="mypending">
                <Clock className="h-4 w-4 mr-2" />
                My Pending ({myPendingResources.length})
              </TabsTrigger>
            )}
            {userData?.role === 'admin' && (
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending Approval ({pendingResources.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject === 'all' ? 'All Subjects' : subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Resources Grid */}
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">Loading resources...</p>
                </CardContent>
              </Card>
            ) : filteredResources.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No resources found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {resource.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{resource.subject}</Badge>
                        <Badge variant="outline">{resource.uploader_role}</Badge>
                        {resource.department && (
                          <Badge variant="outline">{resource.department}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {resource.uploader_name}
                        </p>
                        <p>{formatFileSize(resource.file_size)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                        {userData?.role === 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This will permanently delete "{resource.title}" and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resource.id, resource.file_url)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {userData?.role !== 'admin' && (
            <TabsContent value="mypending" className="space-y-4">
              {myPendingResources.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-500">No pending uploads</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPendingResources.map((resource) => (
                    <Card key={resource.id} className="border-orange-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {resource.description || 'No description'}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{resource.subject}</Badge>
                          {resource.department && (
                            <Badge variant="outline">{resource.department}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{formatFileSize(resource.file_size)}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded {new Date(resource.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-2" />
                              Preview
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Upload</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure? This will permanently delete "{resource.title}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resource.id, resource.file_url)}>
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
              )}
            </TabsContent>
          )}

          {userData?.role === 'admin' && (
            <TabsContent value="pending" className="space-y-4">
              {pendingResources.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-500">No pending resources</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingResources.map((resource) => (
                    <Card key={resource.id} className="border-orange-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {resource.description || 'No description'}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{resource.subject}</Badge>
                          <Badge variant="outline">{resource.uploader_role}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {resource.uploader_name}
                          </p>
                          <p>{formatFileSize(resource.file_size)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleApprove(resource.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject & Delete Resource</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject and delete "{resource.title}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resource.id, resource.file_url)}>
                                  Reject & Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;