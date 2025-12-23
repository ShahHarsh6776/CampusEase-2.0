import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/UserContext';
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
  DialogFooter,
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
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  User,
  Mail,
  Phone,
  Trash2,
  Edit,
  Info,
  UserCheck,
  Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '@/supabase/supabaseClient';

interface Event {
  id: number;
  Ename: string;
  Etype: string;
  Date: string;
  Time: string;
  Location: string;
  Ephoto: string;
  Description?: string;
  capacity?: number;
  registered_count?: number;
  status?: string;
  department?: string;
  created_by?: string;
  contact_email?: string;
  contact_phone?: string;
  speaker?: string;
  registration_deadline?: string;
}

interface Registration {
  id: number;
  event_id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  department?: string;
  semester?: number;
  phone_number?: string;
  registration_date: string;
  attendance_status: string;
  notes?: string;
}

const Events = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('upcoming');
  
  // Registration state
  const [userRegistrations, setUserRegistrations] = useState<number[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<Registration[]>([]);
  const [registerForm, setRegisterForm] = useState({
    phone_number: '',
    notes: '',
  });
  
  // Create event form
  const [createForm, setCreateForm] = useState({
    Ename: '',
    Etype: 'Academic',
    Date: '',
    Time: '',
    Location: '',
    Description: '',
    capacity: 50,
    department: userData?.department || '',
    contact_email: '',
    contact_phone: '',
    speaker: '',
    registration_deadline: '',
  });
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = ['all', 'Academic', 'Social', 'Career', 'Sports', 'Technical', 'Cultural', 'Other'];
  const statuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  useEffect(() => {
    fetchEvents();
    if (userData?.user_id) {
      fetchUserRegistrations();
    }
  }, [userData]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory, selectedStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event')
        .select('*')
        .order('Date', { ascending: true });

      if (error) throw error;
      
      console.log('Fetched events:', data);
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', userData?.user_id);

      if (error) throw error;
      
      const registeredEventIds = data?.map(r => r.event_id) || [];
      setUserRegistrations(registeredEventIds);
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchEventRegistrations = async (eventId: number) => {
    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      
      setEventRegistrations(data || []);
    } catch (error: any) {
      console.error('Error fetching event registrations:', error);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.Ename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.Location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.Etype === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.Date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedStatus === 'upcoming') {
          return eventDate >= today && event.status !== 'cancelled' && event.status !== 'completed';
        } else if (selectedStatus === 'completed') {
          return event.status === 'completed' || eventDate < today;
        } else {
          return event.status === selectedStatus;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const handleRegister = async () => {
    if (!selectedEvent || !userData) {
      toast({
        title: 'Error',
        description: 'Please login to register',
        variant: 'destructive',
      });
      return;
    }

    // Check capacity
    if (selectedEvent.registered_count && selectedEvent.capacity && 
        selectedEvent.registered_count >= selectedEvent.capacity) {
      toast({
        title: 'Event Full',
        description: 'This event has reached maximum capacity',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: selectedEvent.id,
          user_id: userData.user_id,
          user_name: `${userData.fname} ${userData.lname}`,
          user_email: userData.email,
          user_role: userData.role,
          department: userData.department,
          semester: userData.semester,
          phone_number: registerForm.phone_number,
          notes: registerForm.notes,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully registered for the event!',
      });

      setRegisterDialogOpen(false);
      setRegisterForm({ phone_number: '', notes: '' });
      fetchEvents();
      fetchUserRegistrations();
    } catch (error: any) {
      console.error('Error registering:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register for event',
        variant: 'destructive',
      });
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userData?.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Registration cancelled',
      });

      fetchEvents();
      fetchUserRegistrations();
    } catch (error: any) {
      console.error('Error cancelling registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel registration',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEvent = async () => {
    if (!createForm.Ename || !createForm.Date || !createForm.Time || !createForm.Location) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      let imageUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'; // Default image

      // Upload image if provided
      if (eventImage) {
        try {
          const fileExt = eventImage.name.split('.').pop();
          const fileName = `${userData?.user_id}_${Date.now()}.${fileExt}`;
          const filePath = `events/${fileName}`;

          console.log('Uploading image to:', filePath);

          const { error: uploadError } = await supabase.storage
            .from('events')
            .upload(filePath, eventImage, { upsert: false });

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            console.log('Using default image instead');
            // Don't throw, just use default image
          } else {
            const { data: urlData } = supabase.storage
              .from('events')
              .getPublicUrl(filePath);

            imageUrl = urlData.publicUrl;
            console.log('Image uploaded successfully:', imageUrl);
          }
        } catch (imgError) {
          console.error('Image upload failed, using default:', imgError);
          // Continue with default image
        }
      }

      console.log('Creating event with data:', {
        Ename: createForm.Ename,
        Etype: createForm.Etype,
        Date: createForm.Date,
        Time: createForm.Time,
        Location: createForm.Location,
        Ephoto: imageUrl,
      });

      // Insert event
      const { data: eventData, error } = await supabase
        .from('event')
        .insert([{
          Ename: createForm.Ename,
          Etype: createForm.Etype,
          Date: createForm.Date,
          Time: createForm.Time,
          Location: createForm.Location,
          Ephoto: imageUrl,
          Description: createForm.Description,
          capacity: createForm.capacity,
          registered_count: 0,
          status: 'upcoming',
          department: createForm.department,
          created_by: userData?.user_id,
          contact_email: createForm.contact_email,
          contact_phone: createForm.contact_phone,
          speaker: createForm.speaker,
          registration_deadline: createForm.registration_deadline || null,
        }])
        .select();

      if (error) {
        console.error('Event insert error:', error);
        throw error;
      }

      console.log('Event created successfully:', eventData);

      toast({
        title: 'Success',
        description: 'Event created successfully!',
      });

      setCreateEventOpen(false);
      setCreateForm({
        Ename: '',
        Etype: 'Academic',
        Date: '',
        Time: '',
        Location: '',
        Description: '',
        capacity: 50,
        department: userData?.department || '',
        contact_email: '',
        contact_phone: '',
        speaker: '',
        registration_deadline: '',
      });
      setEventImage(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const { error } = await supabase
        .from('event')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });

      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const isRegistered = (eventId: number) => userRegistrations.includes(eventId);
  const isEventFull = (event: Event) => 
    event.capacity && event.registered_count ? event.registered_count >= event.capacity : false;
  const isRegistrationClosed = (event: Event) => {
    if (!event.registration_deadline) return false;
    return new Date(event.registration_deadline) < new Date();
  };

  const EventCard = ({ event }: { event: Event }) => {
    const registered = isRegistered(event.id);
    const full = isEventFull(event);
    const closed = isRegistrationClosed(event);

    return (
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all">
        <div 
          className="relative h-48 overflow-hidden cursor-pointer" 
          onClick={() => setSelectedImage(event.Ephoto)}
        >
          <img
            src={event.Ephoto}
            alt={event.Ename}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold">
            {event.Etype}
          </div>
          {full && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              FULL
            </div>
          )}
          {registered && (
            <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Registered
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{event.Ename}</CardTitle>
          <CardDescription className="line-clamp-2">
            {event.Description || 'No description available'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span>{new Date(event.Date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>{event.Time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>{event.Location}</span>
            </div>
            {event.capacity && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>{event.registered_count || 0} / {event.capacity} registered</span>
              </div>
            )}
          </div>
          {event.speaker && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">Speaker</p>
              <p className="text-sm font-medium">{event.speaker}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => {
              setSelectedEvent(event);
              setEventDetailsOpen(true);
              if (userData?.role === 'admin') {
                fetchEventRegistrations(event.id);
              }
            }}
          >
            <Info className="h-4 w-4 mr-2" />
            Details
          </Button>
          {registered ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your registration for this event?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleCancelRegistration(event.id)}>
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedEvent(event);
                setRegisterDialogOpen(true);
              }}
              disabled={full || closed}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {full ? 'Full' : closed ? 'Closed' : 'Register'}
            </Button>
          )}
          {userData?.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This will permanently delete the event and all registrations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Campus Events</h1>
              <p className="text-gray-600">Discover and register for upcoming events</p>
            </div>
            {userData?.role === 'admin' && (
              <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>Fill in the event details below</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ename">Event Name *</Label>
                        <Input
                          id="ename"
                          value={createForm.Ename}
                          onChange={(e) => setCreateForm({ ...createForm, Ename: e.target.value })}
                          placeholder="e.g., Tech Talk 2025"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="etype">Category *</Label>
                        <Select
                          value={createForm.Etype}
                          onValueChange={(value) => setCreateForm({ ...createForm, Etype: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c !== 'all').map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={createForm.Date}
                          onChange={(e) => setCreateForm({ ...createForm, Date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={createForm.Time}
                          onChange={(e) => setCreateForm({ ...createForm, Time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={createForm.Location}
                        onChange={(e) => setCreateForm({ ...createForm, Location: e.target.value })}
                        placeholder="e.g., Auditorium A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={createForm.Description}
                        onChange={(e) => setCreateForm({ ...createForm, Description: e.target.value })}
                        placeholder="Event description..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={createForm.capacity}
                          onChange={(e) => setCreateForm({ ...createForm, capacity: parseInt(e.target.value) || 50 })}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={createForm.department}
                          onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                          placeholder="e.g., IT, CE, All"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="speaker">Speaker/Organizer</Label>
                      <Input
                        id="speaker"
                        value={createForm.speaker}
                        onChange={(e) => setCreateForm({ ...createForm, speaker: e.target.value })}
                        placeholder="e.g., Dr. John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Contact Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createForm.contact_email}
                          onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                          placeholder="contact@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Contact Phone</Label>
                        <Input
                          id="phone"
                          value={createForm.contact_phone}
                          onChange={(e) => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Registration Deadline (Optional)</Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={createForm.registration_deadline}
                        onChange={(e) => setCreateForm({ ...createForm, registration_deadline: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Event Image</Label>
                      <Input
                        id="image"
                        type="file"
                        onChange={(e) => setEventImage(e.target.files?.[0] || null)}
                        accept="image/*"
                      />
                      <p className="text-xs text-gray-500">Recommended: 1200x600px, Max 5MB</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateEventOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={uploading}>
                      {uploading ? 'Creating...' : 'Create Event'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Loading events...</p>
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No events found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300"
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="Event"
            className="max-w-full max-h-full rounded-xl shadow-xl"
          />
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.Ename}</DialogTitle>
                <DialogDescription>
                  <Badge className="mt-2">{selectedEvent.Etype}</Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedEvent.Ephoto}
                  alt={selectedEvent.Ename}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">{new Date(selectedEvent.Date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span>{selectedEvent.Time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <span>{selectedEvent.Location}</span>
                  </div>
                  {selectedEvent.capacity && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <span>{selectedEvent.registered_count || 0} / {selectedEvent.capacity} registered</span>
                    </div>
                  )}
                </div>
                {selectedEvent.Description && (
                  <div>
                    <h3 className="font-semibold mb-2">About This Event</h3>
                    <p className="text-gray-600">{selectedEvent.Description}</p>
                  </div>
                )}
                {selectedEvent.speaker && (
                  <div>
                    <h3 className="font-semibold mb-2">Speaker/Organizer</h3>
                    <p className="text-gray-600">{selectedEvent.speaker}</p>
                  </div>
                )}
                {(selectedEvent.contact_email || selectedEvent.contact_phone) && (
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-1">
                      {selectedEvent.contact_email && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedEvent.contact_email}
                        </p>
                      )}
                      {selectedEvent.contact_phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {selectedEvent.contact_phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {userData?.role === 'admin' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Registrations ({eventRegistrations.length})</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchEventRegistrations(selectedEvent.id);
                          setRegistrationsDialogOpen(true);
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                    </div>
                    {eventRegistrations.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {eventRegistrations.slice(0, 5).map((reg) => (
                          <div key={reg.id} className="text-sm p-2 bg-gray-50 rounded">
                            <p className="font-medium">{reg.user_name}</p>
                            <p className="text-xs text-gray-500">{reg.user_email} • {reg.user_role}</p>
                          </div>
                        ))}
                        {eventRegistrations.length > 5 && (
                          <p className="text-xs text-gray-500 text-center">
                            And {eventRegistrations.length - 5} more...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>Register for {selectedEvent.Ename}</DialogTitle>
                <DialogDescription>
                  Confirm your registration details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {userData?.fname} {userData?.lname}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {userData?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Role:</strong> {userData?.role}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    value={registerForm.phone_number}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={registerForm.notes}
                    onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })}
                    placeholder="Any special requirements or questions..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRegister}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Registration
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* All Registrations Dialog (Admin) */}
      <Dialog open={registrationsDialogOpen} onOpenChange={setRegistrationsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Registrations</DialogTitle>
            <DialogDescription>
              {eventRegistrations.length} registered attendees
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {eventRegistrations.map((reg) => (
              <Card key={reg.id}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">{reg.user_name}</p>
                      <p className="text-sm text-gray-600">{reg.user_email}</p>
                      {reg.phone_number && (
                        <p className="text-sm text-gray-600">{reg.phone_number}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <Badge>{reg.user_role}</Badge>
                      {reg.department && (
                        <p className="text-gray-600 mt-1">{reg.department}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(reg.registration_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {reg.notes && (
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
                      <strong>Notes:</strong> {reg.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;