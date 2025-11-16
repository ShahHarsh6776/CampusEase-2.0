import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AlertTriangle, ChevronDown, ChevronUp, Filter, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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

// Types
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

interface PriorityConfig {
  color: string;
  icon: React.ReactNode | null;
}

interface FilterState {
  category: string;
  location: string;
  priority: string;
}

// Local ML service URL
const ML_SERVICE_URL = 'http://localhost:5000';

const ProblemDashboard: React.FC = () => {
  const { toast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modelStatus, setModelStatus] = useState<'unknown' | 'active' | 'error' | 'unavailable'>('unknown');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    location: 'all',
    priority: 'all',
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Priority colors and icons
  const priorityConfig: Record<string, PriorityConfig> = {
    Critical: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> },
    High: { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-4 w-4" /> },
    Medium: { color: 'bg-yellow-100 text-yellow-800', icon: null },
    Low: { color: 'bg-green-100 text-green-800', icon: null },
  };

  // Categories for filters
  const categories = ['Infrastructure', 'IT/Technical', 'Academic', 'Administrative', 'Safety/Security', 'Maintenance'];
  const locations = ['Class', 'Lab', 'Center Square', 'Hall', 'Institute'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  useEffect(() => {
    checkModelStatus();
    fetchProblems();
  }, [filters]);

  const checkModelStatus = async () => {
    try {
      const response = await fetch(`${ML_SERVICE_URL}/health`);
      if (response.ok) {
        setModelStatus('active');
      } else {
        setModelStatus('error');
      }
    } catch (error) {
      console.error('ML service not responding:', error);
      setModelStatus('unavailable');
    }
  };

  const fetchProblems = async () => {
    try {
      setLoading(true);
      
      // Start with the base query
      let query = supabase
        .from('report')
        .select('*')
        .order('priority_level', { ascending: false });
      
      // Apply filters
      if (filters.category !== 'all') {
        query = query.eq('Problem_Category', filters.category);
      }
      
      if (filters.location !== 'all') {
        query = query.eq('Location', filters.location);
      }
      
      if (filters.priority !== 'all') {
        query = query.eq('priority_text', filters.priority);
      }

      // Filter by resolved status based on active tab
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
        description: 'Failed to load problems. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async (useSynthetic = false) => {
    try {
      setRefreshing(true);
      
      toast({
        title: 'Training Model',
        description: `Training ML model ${useSynthetic ? 'with synthetic data' : 'with real data'}...`,
      });
      
      const response = await fetch(`${ML_SERVICE_URL}/train?synthetic=${useSynthetic}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to train model: ${response.statusText}`);
      }
      
      toast({
        title: 'Success',
        description: 'Model trained successfully',
      });
      
      // Update priorities after training
      await refreshPriorities();
      
    } catch (error) {
      console.error('Error training model:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to train model. Please check ML service.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const refreshPriorities = async () => {
    try {
      setRefreshing(true);
      
      toast({
        title: 'Updating Priorities',
        description: 'Recalculating problem priorities...',
      });
      
      const response = await fetch(`${ML_SERVICE_URL}/update_priorities`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update priorities: ${response.statusText}`);
      }
      
      // Refetch problems with updated priorities
      await fetchProblems();
      
      toast({
        title: 'Success',
        description: 'Problem priorities have been updated.',
      });
    } catch (error) {
      console.error('Error refreshing priorities:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update priorities. Check ML service.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
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

    // Helper function to safely render text
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

  const renderProblemCards = (priority: string) => {
    const filteredProblems = problems.filter(p => 
      priority.toLowerCase() === 'all' || 
      (p.priority_text && p.priority_text.toLowerCase() === priority.toLowerCase())
    );

    if (filteredProblems.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No problems found for the selected filters.</p>
        </div>
      );
    }

    return (
      <>
        {filteredProblems.map(problem => (
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
              
              <div className="bg-gray-50 p-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleViewDetails(problem)}>View Details</Button>
                {!problem.resolved && (
                  <Button onClick={() => resolveIssue(problem.id)}>Resolve Issue</Button>
                )}
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

  const resolveIssue = async (problemId: number) => {
    try {
      const { error } = await supabase
        .from('report')
        .update({ 
          resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', problemId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Issue has been resolved successfully.',
      });

      // Remove the resolved issue from the current problems list
      setProblems(prevProblems => prevProblems.filter(p => p.id !== problemId));

      // If we're in the resolved tab, fetch the updated resolved issues
      if (activeTab === 'resolved') {
        await fetchProblems();
      }
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve issue. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add useEffect to fetch problems when activeTab changes
  useEffect(() => {
    fetchProblems();
  }, [activeTab, filters]);

  // Remove the previous useEffect hooks for dialog state management
  // and add a new one that handles both tab changes and component unmount
  useEffect(() => {
    return () => {
      setSelectedProblem(null);
      setIsDialogOpen(false);
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Problem Dashboard</h1>
          <div className="flex gap-2 items-center">
            {modelStatus === 'unavailable' && (
              <Badge className="bg-red-100 text-red-800 mb-2">ML Service Offline</Badge>
            )}
            <Button 
              onClick={() => refreshPriorities()} 
              disabled={refreshing || modelStatus !== 'active'}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Recalculate Priorities
            </Button>
          </div>
        </div>

        {/* Machine Learning Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ML Model Status: {modelStatus === 'active' ? 'Active' : modelStatus === 'error' ? 'Error' : 'Unavailable'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                onClick={() => trainModel(false)} 
                disabled={refreshing || modelStatus !== 'active'}
                variant="outline"
              >
                Train with Real Data
              </Button>
              <Button 
                onClick={() => trainModel(true)} 
                disabled={refreshing || modelStatus !== 'active'}
              >
                Train with Synthetic Data
              </Button>
              <div className="text-sm text-gray-500 ml-auto mt-2 md:mt-0">
                {modelStatus === 'active' ? 
                  'ML service is running locally at localhost:5000' : 
                  'Start the Python ML service to enable priority sorting'
                }
              </div>
            </div>
          </CardContent>
        </Card>

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

          {/* Priority Tabs */}
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Problems</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="high">High</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="low">Low</TabsTrigger>
            </TabsList>
            
            {['all', 'critical', 'high', 'medium', 'low'].map(tab => (
              <TabsContent key={tab} value={tab}>
                <div className="space-y-4">
                  {loading ? renderLoadingSkeletons() : renderProblemCards(tab)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ProblemDashboard;