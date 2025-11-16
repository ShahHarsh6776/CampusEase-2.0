import ReactDOM from 'react-dom/client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureCard from '@/components/FeatureCard';
import UpcomingEvents from '@/components/UpcomingEvents';
import QuickLinks from '@/components/QuickLinks';
import Announcements from '@/components/Announcements';
import { 
  CalendarDays, 
  BookOpen, 
  MapPin, 
  Bell, 
  Newspaper,
  MessagesSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Login from './Login';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import App from '../App';

// const root = ReactDOM.createRoot(document.getElementById('root')!);

// const isLoggedIn = localStorage.getItem('isLoggedIn'); // 🔒 Check login status

// if (isLoggedIn) {
//    // Replace current history entry so there's no "back"
//    window.history.replaceState(null, '', '/Index');

//    // Disable back button
//    window.onpopstate = function () {
//      window.history.go(1);
// }

// }

// else {
//   root.render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   );
// }



const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-campusblue-600 to-campusblue-800 text-white py-16">
          <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              Welcome to CampusEase
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mb-8 animate-slide-up opacity-90">
              Your complete campus management app for a seamless college experience
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="bg-white text-campusblue-600 hover:bg-gray-100 px-6 py-5">
                Get Started
              </Button>
              <Button variant="outline" className="border-white text-campusblue-600  hover:bg-white/10 px-6 py-5">
                Learn More
              </Button>
            </div>
          </div>
        </section>
        
        {/* Feature Cards */}
        <section className="py-12 container mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Discover What CampusEase Offers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<CalendarDays className="h-10 w-10" />} 
              title="Class Schedule" 
              description="View and manage your class schedule, receive reminders for upcoming classes." 
              link="/schedule"
            />
            <FeatureCard 
              icon={<BookOpen className="h-10 w-10" />} 
              title="Course Management" 
              description="Register for courses, access course materials, and track your academic progress." 
              link="/courses"
            />
            <FeatureCard 
              icon={<MapPin className="h-10 w-10" />} 
              title="Campus Map" 
              description="Navigate campus with interactive maps showing buildings, classrooms, and facilities." 
              link="/map"
            />
            <FeatureCard 
              icon={<Bell className="h-10 w-10" />} 
              title="Notifications" 
              description="Stay updated with important announcements, deadlines, and campus alerts." 
              link="/notifications"
            />
            <FeatureCard 
              icon={<Newspaper className="h-10 w-10" />} 
              title="Campus News" 
              description="Get the latest news, events, and happenings around your campus community." 
              link="/news"
            />
            <FeatureCard 
              icon={<MessagesSquare className="h-10 w-10" />} 
              title="Student Community" 
              description="Connect with classmates, join groups, and participate in campus discussions." 
              link="/community"
            />
          </div>
        </section>
        
        {/* Dashboard Preview */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Stay Updated With Your Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Announcements />
              </div>
              <div>
                <UpcomingEvents />
              </div>
              <div className="lg:col-span-3">
                <QuickLinks />
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-campusteal-500 text-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Download CampusEase for your device and enhance your campus experience today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="bg-white text-campusteal-600 hover:bg-gray-100">
                Download for Android
              </Button>
              <Button variant="outline" className="border-white text-campusteal-600 hover:bg-white/10">
                Learn How It Works
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
