
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'high';
}

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'Campus Wi-Fi Maintenance',
    content: 'The campus Wi-Fi network will be undergoing maintenance on Saturday from 10pm to 2am.',
    date: '2 days ago',
    priority: 'normal'
  },
  {
    id: 2,
    title: 'Fall Registration Deadline',
    content: 'The deadline for Fall semester course registration is August 15th. Please ensure all selections are finalized.',
    date: '1 week ago',
    priority: 'high'
  },
  {
    id: 3,
    title: 'Library Extended Hours',
    content: 'The main library will have extended hours during finals week, open 24/7 from December 10-17.',
    date: '2 weeks ago',
    priority: 'normal'
  }
];

const Announcements = () => {
  return (
    <Card className="w-full shadow-md" hover>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-campusblue-500" />
          <span>Announcements</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockAnnouncements.map((announcement) => (
          <div 
            key={announcement.id} 
            className={`p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${
              announcement.priority === 'high' 
                ? 'border-l-4 border-l-campusorange-500 bg-campusorange-50/50 dark:bg-campusorange-950/10' 
                : 'border-l-4 border-l-campusblue-500 bg-campusblue-50/50 dark:bg-campusblue-950/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-medium">{announcement.title}</h4>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">{announcement.date}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{announcement.content}</p>
          </div>
        ))}
        <a href="/announcements" className="block text-center text-sm text-campusblue-500 hover:text-campusblue-600 transition-colors pt-2 relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bottom-0 after:left-1/2 after:bg-campusblue-500 after:transition-all after:duration-300 hover:after:w-24 hover:after:left-[calc(50%-48px)]">
          View all announcements →
        </a>
      </CardContent>
    </Card>
  );
};

export default Announcements;
