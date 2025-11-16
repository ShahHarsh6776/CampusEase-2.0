
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, MapPin, Calendar, Tag, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Item {
  id: number;
  type: 'lost' | 'found';
  title: string;
  category: string;
  location: string;
  date: string;
  description: string;
  contactName: string;
  contactEmail: string;
  image?: string;
  status: 'open' | 'claimed' | 'resolved';
}

const items: Item[] = [
  {
    id: 1,
    type: 'lost',
    title: "Blue Hydroflask Water Bottle",
    category: "Personal Item",
    location: "Science Building, Room 203",
    date: "2023-10-18",
    description: "Lost my blue 32oz Hydroflask with stickers on it. Last seen during Chemistry lab.",
    contactName: "Alex Johnson",
    contactEmail: "alex.j@university.edu",
    image: "/placeholder.svg",
    status: 'open'
  },
  {
    id: 2,
    type: 'found',
    title: "Apple AirPods Pro",
    category: "Electronics",
    location: "University Library, 2nd Floor",
    date: "2023-10-17",
    description: "Found Apple AirPods Pro in a white case. Left on study table near the windows.",
    contactName: "Library Staff",
    contactEmail: "library@university.edu",
    image: "/placeholder.svg",
    status: 'open'
  },
  {
    id: 3,
    type: 'lost',
    title: "Student ID Card",
    category: "Identification",
    location: "Student Union or Cafeteria",
    date: "2023-10-16",
    description: "Lost my student ID card, possibly during lunch. Name: Jamie Smith, ID: 10054378.",
    contactName: "Jamie Smith",
    contactEmail: "j.smith@university.edu",
    status: 'claimed'
  },
  {
    id: 4,
    type: 'found',
    title: "Gray North Face Jacket",
    category: "Clothing",
    location: "Gymnasium, Locker Room",
    date: "2023-10-15",
    description: "Found a gray North Face jacket in the men's locker room. Size medium.",
    contactName: "Gym Staff",
    contactEmail: "athletics@university.edu",
    image: "/placeholder.svg",
    status: 'open'
  },
  {
    id: 5,
    type: 'lost',
    title: "Graphing Calculator",
    category: "Academic",
    location: "Math Building, Room 105",
    date: "2023-10-14",
    description: "Lost my TI-84 Plus graphing calculator during Calculus class. Has my name (Taylor Wong) on the back.",
    contactName: "Taylor Wong",
    contactEmail: "t.wong@university.edu",
    status: 'resolved'
  }
];

const LostFound = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' ? true : item.type === activeTab;
    
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    
    return matchesSearch && matchesTab && matchesCategory;
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Item Reported",
      description: "Your item has been successfully reported. We'll notify you if there are any updates.",
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-campusblue-500" />
            Lost & Found
          </h1>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Report Item
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Report an Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide details about the lost or found item.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form onSubmit={handleSubmitItem}>
                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="item-type" className="text-sm font-medium">Type</label>
                      <select 
                        id="item-type" 
                        className="w-full rounded-md border border-gray-300 p-2"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="lost">Lost Item</option>
                        <option value="found">Found Item</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="item-category" className="text-sm font-medium">Category</label>
                      <select 
                        id="item-category" 
                        className="w-full rounded-md border border-gray-300 p-2"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="item-title" className="text-sm font-medium">Item Name</label>
                    <Input id="item-title" placeholder="What is the item?" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="item-location" className="text-sm font-medium">Location</label>
                    <Input id="item-location" placeholder="Where was it lost/found?" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="item-date" className="text-sm font-medium">Date</label>
                    <Input id="item-date" type="date" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="item-description" className="text-sm font-medium">Description</label>
                    <Textarea 
                      id="item-description" 
                      placeholder="Please provide details about the item..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="contact-info" className="text-sm font-medium">Contact Information</label>
                    <Input id="contact-name" placeholder="Your Name" className="mb-2" required />
                    <Input id="contact-email" type="email" placeholder="Your Email" required />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Image (Optional)</label>
                    <Input type="file" accept="image/*" />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction type="submit">Submit Report</AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              className="pl-10" 
              placeholder="Search for lost or found items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs 
            defaultValue="all" 
            onValueChange={(value) => setActiveTab(value as 'all' | 'lost' | 'found')}
          >
            <TabsList className="w-full md:w-auto mb-6">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="lost">Lost Items</TabsTrigger>
              <TabsTrigger value="found">Found Items</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-64 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Filter className="h-4 w-4" /> Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Categories</h3>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <div key={category} className="flex items-center">
                            <input 
                              type="checkbox" 
                              id={`category-${category}`} 
                              className="mr-2"
                              checked={selectedCategory === category}
                              onChange={() => setSelectedCategory(selectedCategory === category ? null : category)}
                            />
                            <label htmlFor={`category-${category}`} className="text-sm">{category}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Status</h3>
                      <div className="space-y-2">
                        {['Open', 'Claimed', 'Resolved'].map(status => (
                          <div key={status} className="flex items-center">
                            <input type="checkbox" id={`status-${status}`} className="mr-2" />
                            <label htmlFor={`status-${status}`} className="text-sm">{status}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lost Something?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      Check the found items or report your lost item so others can help you find it.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full">Report Lost Item</Button>
                      </AlertDialogTrigger>
                      {/* Reuse the same dialog content */}
                    </AlertDialog>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex-1">
                <TabsContent value="all" className="mt-0">
                  <div className="space-y-6">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <Card key={item.id} className={`border-l-4 ${
                          item.type === 'lost' ? 'border-l-yellow-500' : 'border-l-green-500'
                        }`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {item.title}
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    item.status === 'open' ? 'bg-blue-100 text-blue-800' : 
                                    item.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </span>
                                </CardTitle>
                                <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> {item.category}
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {item.location}
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {new Date(item.date).toLocaleDateString()}
                                  </span>
                                </CardDescription>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                item.type === 'lost' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {item.type === 'lost' ? 'LOST' : 'FOUND'}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col md:flex-row gap-4">
                              {item.image && (
                                <div className="md:w-1/4">
                                  <div className="aspect-square rounded-md overflow-hidden bg-gray-100">
                                    <img 
                                      src={item.image} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              )}
                              <div className={item.image ? 'md:w-3/4' : 'w-full'}>
                                <p className="text-sm mb-4">{item.description}</p>
                                <div className="text-sm">
                                  <p><span className="font-medium">Contact:</span> {item.contactName}</p>
                                  <p><span className="font-medium">Email:</span> {item.contactEmail}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-4">
                            {item.type === 'lost' && item.status === 'open' && (
                              <Button variant="outline">I Found This</Button>
                            )}
                            {item.type === 'found' && item.status === 'open' && (
                              <Button variant="outline">This Is Mine</Button>
                            )}
                            <Button>Contact</Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No items found</h3>
                        <p className="text-gray-600 mb-6">
                          Try adjusting your search or filters to find more items.
                        </p>
                        <Button onClick={clearFilters}>Clear All Filters</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="lost" className="mt-0">
                  {/* Same structure as "all" but filtered for lost items only */}
                </TabsContent>
                
                <TabsContent value="found" className="mt-0">
                  {/* Same structure as "all" but filtered for found items only */}
                </TabsContent>
                
                {filteredItems.length > 0 && (
                  <div className="flex justify-center mt-8">
                    <Button variant="outline">Load More Items</Button>
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LostFound;
