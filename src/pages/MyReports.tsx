import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertTriangle, Filter, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/UserContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Problem {
  id: number;
  Problem_Category: string;
  Reporter_Type: string;
  Location: string;
  class_No?: number;
  Impact_Scope: string;
  Occurrence_Pattern: string;
  priority_level: number;
  priority_text: string;
  images?: string;
  resolved: boolean;
  resolved_at?: string;
  description?: string;
}

interface FilterState {
  category: string;
  location: string;
  priority: string;
}

const MyReports: React.FC = () => {
  const { toast } = useToast();
  const { userData } = useUser();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    location: 'all',
    priority: 'all',
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const priorityConfig = {
    Critical: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> },
    High: { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-4 w-4" /> },
    Medium: { color: 'bg-yellow-100 text-yellow-800', icon: null },
    Low: { color: 'bg-green-100 text-green-800', icon: null },
  };

  const categories = ['Infrastructure', 'IT/Technical', 'Academic', 'Administrative', 'Safety/Security', 'Maintenance'];
  const locations = ['Class', 'Lab', 'Center Square', 'Hall', 'Institute'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  useEffect(() => {
    fetchProblems();
  }, [userData.user_id, activeTab, filters]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('report')
        .select('*')
        .eq('reporter_id', userData.user_id)
        .order('priority_level', { ascending: false });
      
      if (filters.category !== 'all') {
        query = query.eq('Problem_Category', filters.category);
      }
      
      if (filters.location !== 'all') {
        query = query.eq('Location', filters.location);
      }
      
      if (filters.priority !== 'all') {
        query = query.eq('priority_text', filters.priority);
      }

      if (activeTab === 'resolved') {
        query = query.eq('resolved', true);
      } else {
        query = query.eq('resolved', false);
      }
      
      const { data, error } = await query.order('id', { ascending: false });
      
      if (error) throw error;
      
      setProblems(data || []);
    } catch (error) {
      console.error('Error fetching problems:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your reported problems. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string, filterType: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const renderPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority] || priorityConfig.Medium;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {priority}
      </Badge>
    );
  };

  const handleViewDetails = (problem: Problem) => {
    setSelectedProblem(problem);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderProblemDetails = () => {
    if (!selectedProblem) return null;

    const renderText = (text: any) => {
      if (typeof text === 'object' && text !== null) {
        return text.text || JSON.stringify(text);
      }
      return text || 'Unknown';
    };

    return (
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProblem(null);
          }
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="relative">
            <div className="absolute right-0 top-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedProblem(null);
                  setIsDialogOpen(false);
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="flex items-center justify-between text-xl pr-8">
              <span>
                {renderText(selectedProblem.Problem_Category)} Issue
                {selectedProblem.Location && ` at ${renderText(selectedProblem.Location)}`}
                {selectedProblem.class_No && ` ${renderText(selectedProblem.class_No)}`}
              </span>
              {renderPriorityBadge(selectedProblem.priority_text || 'Medium')}
            </DialogTitle>
            <DialogDescription className="text-base">
              Issue ID: #{selectedProblem.id}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Reported By</h4>
              <p className="text-base mt-1">{renderText(selectedProblem.Reporter_Type)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Impact Scope</h4>
              <p className="text-base mt-1">{renderText(selectedProblem.Impact_Scope)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Occurrence Pattern</h4>
              <p className="text-base mt-1">{renderText(selectedProblem.Occurrence_Pattern)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Status</h4>
              <p className="text-base mt-1">{selectedProblem.resolved ? 'Resolved' : 'Pending'}</p>
            </div>
            {selectedProblem.resolved && selectedProblem.resolved_at && (
              <div className="col-span-2">
                <h4 className="font-semibold text-sm text-gray-500">Resolved At</h4>
                <p className="text-base mt-1">{formatDate(selectedProblem.resolved_at)}</p>
              </div>
            )}
          </div>

          {selectedProblem.description && (
            <div className="mt-6">
              <h4 className="font-semibold text-sm text-gray-500 mb-2">Description</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="whitespace-pre-wrap text-base">{renderText(selectedProblem.description)}</p>
              </div>
            </div>
          )}

          {selectedProblem.images && (
            <div className="mt-6">
              <h4 className="font-semibold text-sm text-gray-500 mb-2">Images</h4>
              <img 
                src={selectedProblem.images} 
                alt="Problem evidence" 
                className="rounded-md max-h-64 object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const renderProblemCards = () => {
    if (problems.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No problems found for the selected filters.</p>
        </div>
      );
    }

    return (
      <>
        {problems.map(problem => (
          <Card key={problem.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {problem.Problem_Category} Issue
                    {problem.Location && ` at ${problem.Location}`}
                    {problem.class_No && ` ${problem.class_No}`}
                  </h3>
                  {renderPriorityBadge(problem.priority_text || 'Medium')}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Reported by</p>
                    <p>{problem.Reporter_Type || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Impact</p>
                    <p>{problem.Impact_Scope || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pattern</p>
                    <p>{problem.Occurrence_Pattern || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p>#{problem.id}</p>
                  </div>
                </div>
                
                {problem.images && (
                  <div className="mt-4">
                    <img 
                      src={problem.images} 
                      alt="Problem evidence" 
                      className="rounded-md max-h-48 object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 flex justify-end">
                <Button variant="outline" onClick={() => handleViewDetails(problem)}>View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {renderProblemDetails()}
      </>
    );
  };

  const renderLoadingSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Reported Problems</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Problem Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => handleFilterChange(value, 'category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">Location</label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => handleFilterChange(value, 'location')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">Priority</label>
                <Select 
                  value={filters.priority} 
                  onValueChange={(value) => handleFilterChange(value, 'priority')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs for Pending/Resolved */}
        <Tabs defaultValue="pending" onValueChange={(value) => setActiveTab(value as 'pending' | 'resolved')}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending Issues</TabsTrigger>
            <TabsTrigger value="resolved">Resolved Issues</TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {loading ? renderLoadingSkeletons() : renderProblemCards()}
          </div>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default MyReports; 