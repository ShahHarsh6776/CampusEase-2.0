
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Book, Search, Clock, MapPin, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Library {
  id: number;
  name: string;
  location: string;
  hours: string;
  description: string;
  availableSeats: number;
  totalSeats: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  available: boolean;
  coverImage: string;
}

const libraries: Library[] = [
  {
    id: 1,
    name: "Main University Library",
    location: "Central Campus, Building A",
    hours: "Mon-Fri: 7:30 AM - 11:00 PM, Sat-Sun: 9:00 AM - 9:00 PM",
    description: "The main library houses over 1 million books, journals, and digital resources.",
    availableSeats: 120,
    totalSeats: 500
  },
  {
    id: 2,
    name: "Science & Engineering Library",
    location: "North Campus, Science Complex",
    hours: "Mon-Fri: 8:00 AM - 10:00 PM, Sat: 10:00 AM - 6:00 PM, Sun: Closed",
    description: "Specialized resources for STEM fields with advanced research databases.",
    availableSeats: 45,
    totalSeats: 150
  },
  {
    id: 3,
    name: "Arts & Humanities Library",
    location: "South Campus, Fine Arts Building",
    hours: "Mon-Fri: 9:00 AM - 8:00 PM, Sat-Sun: 11:00 AM - 5:00 PM",
    description: "Collection focused on literature, history, philosophy, and the arts.",
    availableSeats: 80,
    totalSeats: 200
  },
  {
    id: 4,
    name: "Law Library",
    location: "East Campus, Law School Building",
    hours: "Mon-Fri: 8:00 AM - 10:00 PM, Sat: 9:00 AM - 7:00 PM, Sun: 12:00 PM - 8:00 PM",
    description: "Comprehensive legal resources and quiet study areas for law students.",
    availableSeats: 30,
    totalSeats: 120
  }
];

const popularBooks: Book[] = [
  {
    id: 1,
    title: "Introduction to Computer Science",
    author: "John Smith",
    category: "Technology",
    available: true,
    coverImage: "/placeholder.svg"
  },
  {
    id: 2,
    title: "Advanced Calculus for Engineers",
    author: "Maria Rodriguez",
    category: "Mathematics",
    available: false,
    coverImage: "/placeholder.svg"
  },
  {
    id: 3,
    title: "Modern World History",
    author: "David Chang",
    category: "History",
    available: true,
    coverImage: "/placeholder.svg"
  },
  {
    id: 4,
    title: "Fundamentals of Psychology",
    author: "Sarah Johnson",
    category: "Psychology",
    available: true,
    coverImage: "/placeholder.svg"
  },
  {
    id: 5,
    title: "Organic Chemistry Principles",
    author: "Michael Brown",
    category: "Chemistry",
    available: true,
    coverImage: "/placeholder.svg"
  },
  {
    id: 6,
    title: "Literary Theory and Criticism",
    author: "Emily Wilson",
    category: "Literature",
    available: false,
    coverImage: "/placeholder.svg"
  }
];

const Libraries = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredBooks = popularBooks.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Book className="h-6 w-6 text-campusblue-500" />
          Campus Libraries
        </h1>
        
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              className="pl-10" 
              placeholder="Search for books, resources, or libraries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="libraries">
            <TabsList className="w-full md:w-auto mb-6">
              <TabsTrigger value="libraries">Libraries</TabsTrigger>
              <TabsTrigger value="books">Books & Resources</TabsTrigger>
              <TabsTrigger value="study">Study Spaces</TabsTrigger>
              <TabsTrigger value="events">Library Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="libraries" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {libraries.map(library => (
                  <Card key={library.id}>
                    <CardHeader>
                      <CardTitle>{library.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {library.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{library.description}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Clock className="h-4 w-4" /> {library.hours}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium">Available Seats: {library.availableSeats}/{library.totalSeats}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div 
                            className="bg-campusblue-500 h-2.5 rounded-full" 
                            style={{ width: `${(library.availableSeats / library.totalSeats) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">View Details</Button>
                      <Button>Reserve Seat</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="books">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Popular Books</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {filteredBooks.map(book => (
                    <Card key={book.id} className="overflow-hidden">
                      <div className="aspect-[3/4] relative">
                        <img 
                          src={book.coverImage} 
                          alt={book.title} 
                          className="object-cover w-full h-full"
                        />
                        {!book.available && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            Checked Out
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm truncate">{book.title}</h3>
                        <p className="text-xs text-gray-600 truncate">{book.author}</p>
                        <p className="text-xs mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded">
                          {book.category}
                        </p>
                      </CardContent>
                      <CardFooter className="p-3 pt-0">
                        <Button 
                          variant={book.available ? "default" : "outline"} 
                          size="sm" 
                          className="w-full text-xs"
                          disabled={!book.available}
                        >
                          {book.available ? "Check Out" : "Join Waitlist"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button>Browse All Resources</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="study">
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Study Space Reservations</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Reserve individual or group study rooms across campus libraries.
                </p>
                <Button>Check Availability</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="events">
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Upcoming Library Events</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Workshops, author talks, and library training sessions.
                </p>
                <Button>View Calendar</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Libraries;
