
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickLink {
  id: number;
  title: string;
  path: string;
  icon: React.ReactNode;
}

const quickLinks: QuickLink[] = [
  {
    id: 1,
    title: 'Library Resources',
    path: '/resources/library',
    icon: <span className="text-2xl">📚</span>
  },
  {
    id: 2,
    title: 'Campus Map',
    path: '/map',
    icon: <span className="text-2xl">🗺️</span>
  },
  {
    id: 3,
    title: 'Student Services',
    path: '/services',
    icon: <span className="text-2xl">🎓</span>
  },
  {
    id: 4,
    title: 'Academic Calendar',
    path: '/calendar',
    icon: <span className="text-2xl">📅</span>
  },
  {
    id: 5,
    title: 'Contact Support',
    path: '/support',
    icon: <span className="text-2xl">📞</span>
  }
];

const QuickLinks = () => {
  return (
    <Card className="w-full shadow-md" hover>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Link2 className="h-5 w-5 text-campusblue-500" />
          <span>Quick Links</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.id}
              to={link.path}
              className="flex flex-col items-center p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-campusblue-50 dark:hover:bg-campusblue-900/10 hover:border-campusblue-200 dark:hover:border-campusblue-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{link.icon}</div>
              <span className="text-sm text-center font-medium group-hover:text-campusblue-600 dark:group-hover:text-campusblue-400 transition-colors">{link.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickLinks;
