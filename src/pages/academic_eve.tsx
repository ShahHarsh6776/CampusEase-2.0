import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/supabase/supabaseClient';

interface Event {
  id: number;
  Ename: string;
  Etype: string;
  Date: string;
  Time: string;
  Location: string;
  Ephoto: string;
}

const AcademicEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocialEvents = async () => {
      const { data, error } = await supabase
        .from('event')
        .select('*')
        .eq('Etype', 'academic');

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data);
      }
    };

    fetchSocialEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Academic Events</h1>
        <p className="text-gray-600 mb-8">Discover all academic events happening on campus.</p>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={event.Ephoto}
                alt={event.Ename}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setSelectedImage(event.Ephoto)}
              />
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2">{event.Ename}</h2>
                <p className="text-gray-600 mb-1"><strong>Location:</strong> {event.Location}</p>
                <p className="text-gray-600 mb-1"><strong>Date:</strong> {event.Date}</p>
                <p className="text-gray-600"><strong>Time:</strong> {event.Time}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />

      {/* Modal for full image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default AcademicEvents;