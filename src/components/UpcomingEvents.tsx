
import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Clock } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
}

const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Freshman Orientation',
    date: 'Aug 28, 2023',
    time: '09:00 AM',
    location: 'Main Auditorium'
  },
  {
    id: 2,
    title: 'Career Fair',
    date: 'Sep 15, 2023',
    time: '10:00 AM',
    location: 'Student Center'
  },
  {
    id: 3,
    title: 'Computer Science Workshop',
    date: 'Sep 22, 2023',
    time: '02:00 PM',
    location: 'Tech Building, Room 305'
  }
];

const UpcomingEvents = () => {
  return (
    <Card className="w-full shadow-md" hover>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-campusblue-500" />
          <span>Upcoming Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockEvents.map((event) => (
          <div 
            key={event.id} 
            className="flex items-start p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm group"
          >
            <div className="flex-shrink-0 mr-4 bg-campusblue-100 dark:bg-campusblue-900/30 text-campusblue-600 dark:text-campusblue-400 flex flex-col items-center justify-center w-14 h-16 rounded-lg group-hover:bg-campusblue-200 dark:group-hover:bg-campusblue-900/40 transition-colors">
              <span className="text-xs font-medium">{event.date.split(',')[0]}</span>
              <span className="text-lg font-bold">{event.date.split(' ')[1].replace(',', '')}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium group-hover:text-campusblue-600 dark:group-hover:text-campusblue-400 transition-colors">{event.title}</h4>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <Clock className="h-3 w-3 mr-1" /> 
                <span className="mr-2">{event.time}</span> • 
                <span className="ml-2">{event.location}</span>
              </div>
            </div>
          </div>
        ))}
        <a href="/events" className="block text-center text-sm text-campusblue-500 hover:text-campusblue-600 transition-colors pt-2 relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-1/2 after:bg-campusblue-500 after:transition-all after:duration-300 hover:after:w-20 hover:after:left-[calc(50%-40px)]">
          View all events →
        </a>
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
