
import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  link,
  onClick
}) => {
  return (
    <Card 
      className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in cursor-pointer overflow-hidden group"
      onClick={onClick}
      hover
    >
      <CardHeader>
        <div className="flex justify-center mb-3 text-campusblue-500 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <CardTitle className="text-center text-lg font-semibold group-hover:text-campusblue-600 transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardContent>
      {link && (
        <CardFooter className="pt-0">
          <a 
            href={link} 
            className="w-full text-center text-sm text-campusblue-500 hover:text-campusblue-600 transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-campusblue-500 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
          >
            Learn more →
          </a>
        </CardFooter>
      )}
    </Card>
  );
};

export default FeatureCard;
