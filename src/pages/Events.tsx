import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
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
}

// 🧩 EventCard component receives an onImageClick function
const EventCard = ({ event, onImageClick }: { event: Event; onImageClick: (img: string) => void }) => (
  <Card className="h-full overflow-hidden hover:shadow-md transition-all">
    <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => onImageClick(event.Ephoto)}>
      <img
        src={event.Ephoto}
        alt={event.Ename}
        className="w-full h-full object-cover transition-transform hover:scale-105"
      />
      <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-medium">
        {event.Etype}
      </div>
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="text-xl">{event.Ename}</CardTitle>
    </CardHeader>
    <CardContent className="pb-3">
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-campusblue-500" />
          <span>{event.Date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-campusblue-500" />
          <span>{event.Time}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-campusblue-500" />
          <span>{event.Location}</span>
        </div>
      </div>
      {event.Description && (
        <p className="mt-3 text-gray-600 text-sm line-clamp-2">{event.Description}</p>
      )}
    </CardContent>
    <CardFooter>
      <Button className="w-full bg-campusblue-500 hover:bg-campusblue-600">Register</Button>
    </CardFooter>
  </Card>
);

const OrganizeEvent = () => {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => navigate('/adminPage')}
      variant="default"
      className="ml-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 shadow-md transition-all"
    >
      Organize Event
    </Button>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // ✅ Modal state

  useEffect(() => {
    const fetchAllEvents = async () => {
      const { data, error } = await supabase
        .from('event')
        .select('*');

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data);
      }
    };

    fetchAllEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Campus Events</h1>
          <p className="text-gray-600">Discover upcoming events and activities</p>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="flex items-center gap-3">
            <TabsTrigger value="all" onClick={() => navigate('/all_eve')} className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all">All Events</TabsTrigger>
            <TabsTrigger value="academic" onClick={() => navigate('/academic_eve')} className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all">Academic</TabsTrigger>
            <TabsTrigger value="social" onClick={() => navigate('/social_eve')} className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all">Social</TabsTrigger>
            <TabsTrigger value="career" onClick={() => navigate('/career_eve')} className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all">Career</TabsTrigger>
            <div className="ml-6">
              <OrganizeEvent />
            </div>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onImageClick={setSelectedImage} />
          ))}
        </div>
      </main>
      <Footer />

      {/* ✅ Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold"
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="Full"
            className="max-w-full max-h-full rounded-xl shadow-xl"
          />
        </div>
      )}
    </div>
  );
};

export default Events;