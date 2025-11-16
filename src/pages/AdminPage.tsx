import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/supabase/supabaseClient';

const AdminPage = () => {
  const [formData, setFormData] = useState({
    Ename: '',
    Etype: '',
    Date: '',
    Time: '',
    Location: '',
    Ephoto: null as File | null,
  });

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.Ephoto) return alert('Please upload an event photo.');

    const imagePath = `event/${formData.Ephoto.name}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-pic')
      .upload(imagePath, formData.Ephoto, { upsert: true });

    if (uploadError) return alert('Image upload failed');

    const { data: publicUrlData } = supabase.storage
      .from('profile-pic')
      .getPublicUrl(imagePath);

    const { error: insertError } = await supabase
      .from('event')
      .insert([
        {
          Ename: formData.Ename,
          Etype: formData.Etype,
          Date: formData.Date,
          Time: formData.Time,
          Location: formData.Location,
          Ephoto: publicUrlData.publicUrl,
        },
      ]);

    if (insertError) return alert('Event creation failed.');

    alert('Event created successfully');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-campusblue-500 text-center mb-6">Organize New Event</h1>

        <div className="space-y-4">
          <div>
            <Label>Event Name</Label>
            <Input name="Ename" onChange={handleChange} placeholder="Enter event name" />
          </div>

          <div>
            <Label>Event Type</Label>
            <Select onValueChange={(val) => setFormData({ ...formData, Etype: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="career">Career</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Input name="Date" type="date" onChange={handleChange} />
          </div>

          <div>
            <Label>Start Time</Label>
            <Input name="Time" type="time" onChange={handleChange} />
          </div>

          <div>
            <Label>Location</Label>
            <Input name="Location" onChange={handleChange} placeholder="Enter location" />
          </div>

          <div>
            <Label>Event Photo</Label>
            <Input name="Ephoto" type="file" accept="image/*" onChange={handleChange} />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            className="w-full bg-campusblue-500 hover:bg-campusblue-600 text-white font-semibold py-3 rounded-lg transition-all"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
