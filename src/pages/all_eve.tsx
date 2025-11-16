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

const all_eve = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      const { data, error } = await supabase
        .from('event')
        .select('*');

      if (error) {
        console.error('Error fetching all events:', error);
      } else {
        setEvents(data);
      }
    };

    fetchAllEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">All Events</h1>
        <p className="text-gray-600 mb-8">Explore all events happening on campus.</p>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <img
                src={event.Ephoto}
                alt={event.Ename}
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2">{event.Ename}</h2>
                <p className="text-gray-600 mb-1"><strong>Type:</strong> {event.Etype}</p>
                <p className="text-gray-600 mb-1"><strong>Location:</strong> {event.Location}</p>
                <p className="text-gray-600 mb-1"><strong>Date:</strong> {event.Date}</p>
                <p className="text-gray-600"><strong>Time:</strong> {event.Time}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default all_eve;