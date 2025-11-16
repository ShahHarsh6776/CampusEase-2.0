import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Flag, AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mlService } from '@/services/mlService';
import { useUser } from '@/UserContext';

const Reports = () => {
  const { toast } = useToast();
  const { user, userData } = useUser();
  const [modelStatus, setModelStatus] = useState<'unknown' | 'active' | 'error'>('unknown');
  const [isTraining, setIsTraining] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    Problem_Category: '',
    Reporter_Type: '',
    Location: '',
    class_No: '',
    Impact_Scope: '',
    Occurrence_Pattern: '',
    description: '',
    attachment: null as File | null,
  });

  const [locationType, setLocationType] = useState('');

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    const isHealthy = await mlService.checkHealth();
    setModelStatus(isHealthy ? 'active' : 'error');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'attachment' && e.target instanceof HTMLInputElement && e.target.files) {
      setFormData({
        ...formData,
        [name]: e.target.files[0] || null,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
      if (name === 'Location') setLocationType(value);
    }
  };

  const trainModel = async (useSynthetic = false) => {
    try {
      setIsTraining(true);
      const success = await mlService.trainModel(useSynthetic);
      if (success) {
        toast({
          title: 'Success',
          description: 'Model trained successfully',
        });
      } else {
        throw new Error('Model training failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsTraining(false);
      checkModelStatus();
    }
  };

  const updatePriorities = async () => {
    try {
      setIsUpdating(true);
      const count = await mlService.updatePriorities();
      toast({
        title: 'Success',
        description: `Updated priorities for ${count} reports`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const validateForm = () => {
    const requiredFields = ['Problem_Category', 'Reporter_Type', 'Location', 'Impact_Scope', 'Occurrence_Pattern', 'description'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: 'Validation Error',
          description: `Please fill in the ${field.replace('_', ' ')} field`,
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      let imageUrl = null;
  
      if (formData.attachment) {
        const fileName = `images/${Date.now()}_${formData.attachment.name}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('profile-pic')
          .upload(fileName, formData.attachment);
  
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
  
        const { data: publicURLData } = supabase
          .storage
          .from('profile-pic')
          .getPublicUrl(fileName);
  
        if (!publicURLData?.publicUrl) {
          throw new Error('Failed to retrieve public URL.');
        }
  
        imageUrl = publicURLData.publicUrl;
      }
  
      const classNo = formData.class_No ? parseInt(formData.class_No, 10) : null;
      const descriptionJson = {
        text: formData.description,
      };
      
      let prediction = { priority_level: 1, priority_text: 'Medium' };
      
      // Get priority prediction from ML model if it's active
      if (modelStatus === 'active') {
        prediction = await mlService.predictPriority({
          Problem_Category: formData.Problem_Category,
          Reporter_Type: formData.Reporter_Type,
          Location: formData.Location,
          Impact_Scope: formData.Impact_Scope,
          Occurrence_Pattern: formData.Occurrence_Pattern,
          description: formData.description,
        });
      }
  
      const { error: insertError } = await supabase
        .from('report')
        .insert([
          {
            Problem_Category: formData.Problem_Category,
            Reporter_Type: formData.Reporter_Type,
            Location: formData.Location,
            class_No: classNo,
            Impact_Scope: formData.Impact_Scope,
            Occurrence_Pattern: formData.Occurrence_Pattern,
            description: descriptionJson,
            images: imageUrl,
            priority_level: prediction.priority_level,
            priority_text: prediction.priority_text,
            reporter_id: userData.user_id,
          },
        ]);
  
      if (insertError) {
        throw new Error(`Failed to insert report: ${insertError.message}`);
      }
  
      setFormData({
        Problem_Category: '',
        Reporter_Type: '',
        Location: '',
        class_No: '',
        Impact_Scope: '',
        Occurrence_Pattern: '',
        description: '',
        attachment: null,
      });
      setLocationType('');
      toast({ title: 'Success', description: 'Report submitted successfully!' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-campusblue-500" />
            Report System
          </h1>
          <div className="flex gap-2">
            {modelStatus === 'error' && (
              <Alert variant="destructive" className="mb-0">
                <AlertTitle>ML Service Offline</AlertTitle>
                <AlertDescription>
                  The priority prediction service is currently unavailable.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => trainModel(false)}
              disabled={isTraining || modelStatus !== 'active'}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isTraining ? 'animate-spin' : ''}`} />
              Train with Real Data
            </Button>
            <Button
              onClick={() => trainModel(true)}
              disabled={isTraining || modelStatus !== 'active'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isTraining ? 'animate-spin' : ''}`} />
              Train with Synthetic Data
            </Button>
            <Button
              onClick={updatePriorities}
              disabled={isUpdating || modelStatus !== 'active'}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              Update Priorities
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Report</CardTitle>
                <CardDescription>Fill the form to report an issue on campus.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  
                  <div>
                    <label className="text-sm font-medium">Problem Category*</label>
                    <select 
                      name="Problem_Category" 
                      value={formData.Problem_Category}
                      onChange={handleChange} 
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select --</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="IT/Technical">IT/Technical</option>
                      <option value="Academic">Academic</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Safety/Security">Safety/Security</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Reporter Type*</label>
                    <select 
                      name="Reporter_Type" 
                      value={formData.Reporter_Type}
                      onChange={handleChange} 
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select --</option>
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Admin">Admin</option>
                      <option value="Visitor">Visitor</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Location*</label>
                    <select 
                      name="Location" 
                      value={formData.Location}
                      onChange={handleChange} 
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select --</option>
                      <option value="Class">Class</option>
                      <option value="Lab">Lab</option>
                      <option value="Center Square">Center Square</option>
                      <option value="Hall">Hall</option>
                      <option value="Institute">Institute</option>
                    </select>
                  </div>

                  {(locationType === 'Class' || locationType === 'Lab' || locationType === 'Hall' || locationType === 'Institute') && (
                    <div>
                      <label className="text-sm font-medium">
                        {locationType} Number
                      </label>
                      <Input
                        name="class_No"
                        value={formData.class_No}
                        onChange={handleChange}
                        placeholder={`Enter ${locationType} Number`}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Impact Scope*</label>
                    <select 
                      name="Impact_Scope" 
                      value={formData.Impact_Scope}
                      onChange={handleChange} 
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select --</option>
                      <option value="Single person affected">Single person affected</option>
                      <option value="Whole class affected">Whole class affected</option>
                      <option value="Everyone affected">Everyone affected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Occurrence Pattern*</label>
                    <select 
                      name="Occurrence_Pattern" 
                      value={formData.Occurrence_Pattern}
                      onChange={handleChange} 
                      className="w-full p-2 border rounded"
                    >
                      <option value="">-- Select --</option>
                      <option value="First occurrence">First occurrence</option>
                      <option value="Recurring issue">Recurring issue</option>
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Problem Description*</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe the issue..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Attachment (Optional)</label>
                    <Input 
                      type="file" 
                      name="attachment" 
                      onChange={handleChange as any} 
                      accept="image/*" 
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                      Submit Report
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Emergency Reporting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">For emergencies, contact:</p>
                <div className="bg-red-50 p-4 rounded-md border border-red-100 mb-4">
                  <p className="font-bold">Campus Security: 555-123-4567</p>
                  <p className="text-sm text-gray-600">Available 24/7</p>
                </div>
                <Button variant="destructive" className="w-full">Call Emergency Number</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-campusblue-500" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>Facility Update</AlertTitle>
                  <AlertDescription>
                    Science Building west wing will be closed for maintenance on Friday.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertTitle>Campus Safety</AlertTitle>
                  <AlertDescription>
                    Increased security patrols near the student parking area.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Alerts</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Reports;