//DataAnalysis page
import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
);

interface Report {
  id: number;
  Problem_Category: string | null;
  Reporter_Type: string | null;
  Location: string | null;
  class_No: number | null;
  Impact_Scope: string | null;
  Occurrence_Pattern: string | null;
  images: string | null;
  priority_level: number;
  priority_text: string;
  description: any;
  resolved: boolean;
  resolved_at: string | null;
  reporter_id: string | null;
}

interface LostFoundItem {
  id: string;
  item_name: string;
  description: string;
  status: string;
  location: string;
  date_reported: string;
  reporter_id: string;
  image_url: string;
}

interface CommunityMessage {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  college_id: string;
}

const DataAnalysis = () => {
  // State for Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [reportStats, setReportStats] = useState({
    total: 0,
    resolved: 0,
    unresolved: 0,
    categoryCount: {} as Record<string, number>,
    priorityCount: {} as Record<string, number>,
    timeSeriesData: [] as { date: string; count: number }[],
  });

  // State for Lost & Found
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [lostFoundStats, setLostFoundStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    resolved: 0,
    categoryCount: {} as Record<string, number>,
    timeSeriesData: [] as { date: string; lost: number; found: number }[],
  });

  // State for Community Messages
  const [messageStats, setMessageStats] = useState({
    total: 0,
    timeSeriesData: [] as { date: string; count: number }[],
  });

  const [activeTab, setActiveTab] = useState('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    const channels = setupRealtimeSubscriptions();
    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchReports(),
      fetchLostFound(),
      fetchCommunityMessages(),
    ]);
    setLoading(false);
  };

  const setupRealtimeSubscriptions = (): RealtimeChannel[] => {
    const channels: RealtimeChannel[] = [];
    // Reports subscription
    channels.push(
      supabase
        .channel('reports-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'report' }, () => {
          fetchReports();
        })
        .subscribe()
    );

    // Lost & Found subscription
    channels.push(
      supabase
        .channel('lostfound-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_found' }, () => {
          fetchLostFound();
        })
        .subscribe()
    );

    // Community messages subscription
    channels.push(
      supabase
        .channel('messages-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages' }, () => {
          fetchCommunityMessages();
        })
        .subscribe()
    );

    return channels;
  };

  const fetchReports = async () => {
    try {
      console.log('Starting to fetch reports...');
      const { data: reportData, error, status } = await supabase
        .from('report')
        .select('*')
        .order('id', { ascending: false });

      console.log('Supabase response:', { status, error, dataLength: reportData?.length });

      if (error) {
        console.error('Detailed error fetching reports:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast({
          title: 'Error Fetching Reports',
          description: `Error: ${error.message}. Please check your connection and try again.`,
          variant: 'destructive',
        });
        return;
      }

      if (!reportData) {
        console.error('No report data received from Supabase');
        toast({
          title: 'No Data Available',
          description: 'No reports were found in the database.',
          variant: 'destructive',
        });
        return;
      }

      if (reportData.length === 0) {
        console.log('Empty reports array received');
        setReports([]);
        setReportStats({
          total: 0,
          resolved: 0,
          unresolved: 0,
          categoryCount: {},
          priorityCount: {},
          timeSeriesData: [],
        });
        return;
      }

      console.log('Successfully fetched reports:', reportData.length);
      
      setReports(reportData);
      
      // Calculate statistics
      const resolved = reportData.filter((r: Report) => r.resolved).length;
      const categoryCount = reportData.reduce((acc: Record<string, number>, curr: Report) => {
        const category = curr.Problem_Category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      // Time series data using resolved_at for timeline
      const timeSeriesData = processTimeSeriesData(
        reportData.filter(r => r.resolved_at), // Only include reports with resolved_at
        'resolved_at'
      );

      setReportStats({
        total: reportData.length,
        resolved,
        unresolved: reportData.length - resolved,
        categoryCount,
        priorityCount: calculatePriorityCount(reportData),
        timeSeriesData,
      });

      console.log('Report stats updated successfully');
    } catch (error) {
      console.error('Unexpected error in fetchReports:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while fetching reports. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const fetchLostFound = async () => {
    try {
      console.log('Fetching lost & found items...');
      const { data: lostFoundData, error } = await supabase
        .from('lost_found')
        .select('*')
        .order('date_reported', { ascending: false });

      if (error) {
        console.error('Error fetching lost & found items:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch lost & found items. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (!lostFoundData) {
        console.error('No lost & found data received');
        toast({
          title: 'Error',
          description: 'No lost & found data available.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Lost & found data:', lostFoundData);
      
      setLostFoundItems(lostFoundData || []);
      
      const lost = (lostFoundData || []).filter((item: LostFoundItem) => item.status === 'lost').length;
      const found = (lostFoundData || []).filter((item: LostFoundItem) => item.status === 'found').length;
      const resolved = (lostFoundData || []).filter((item: LostFoundItem) => 
        item.status === 'resolved' || item.status === 'claimed'
      ).length;
      
      const locationCount = (lostFoundData || []).reduce((acc: Record<string, number>, curr: LostFoundItem) => {
        const location = curr.location || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {});

      const timeSeriesData = processLostFoundTimeSeriesData(lostFoundData || []);

      setLostFoundStats({
        total: (lostFoundData || []).length,
        lost,
        found,
        resolved,
        categoryCount: locationCount,
        timeSeriesData,
      });
    } catch (error) {
      console.error('Error in fetchLostFound:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching lost & found items.',
        variant: 'destructive',
      });
    }
  };

  const fetchCommunityMessages = async () => {
    try {
      console.log('Fetching community messages...');
      const { data: messageData, error } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch community messages. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (!messageData) {
        console.error('No message data received');
        toast({
          title: 'Error',
          description: 'No community messages available.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Messages data:', messageData);
      
      const timeSeriesData = processTimeSeriesData(messageData || [], 'created_at');
      
      setMessageStats({
        total: (messageData || []).length,
        timeSeriesData,
      });
    } catch (error) {
      console.error('Error in fetchCommunityMessages:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching community messages.',
        variant: 'destructive',
      });
    }
  };

  const processTimeSeriesData = (data: any[], dateField: string) => {
    // Handle empty data case
    if (!data || data.length === 0) {
      return [];
    }

    const counts = data.reduce((acc: Record<string, number>, curr: any) => {
      if (curr[dateField]) { // Only process if date exists
        const date = format(new Date(curr[dateField]), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processLostFoundTimeSeriesData = (data: LostFoundItem[]) => {
    const dailyStats = data.reduce((acc: Record<string, { lost: number; found: number }>, curr) => {
      const date = format(new Date(curr.date_reported), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { lost: 0, found: 0 };
      }
      if (curr.status === 'lost') {
        acc[date].lost++;
      } else if (curr.status === 'found') {
        acc[date].found++;
      }
      return acc;
    }, {});

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const calculatePriorityCount = (data: Report[]) => {
    return data.reduce((acc: Record<string, number>, curr) => {
      const priority = curr.priority_text || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
  };

  // Chart configurations
  const reportChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Reports Overview' },
    },
  };

  const timeSeriesOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
      title: { display: true, text: 'Activity Over Time' },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count',
        },
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Campus Analytics Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="reports">Reports Analysis</TabsTrigger>
            <TabsTrigger value="lostfound">Lost & Found Analysis</TabsTrigger>
            <TabsTrigger value="community">Community Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{reportStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">{reportStats.resolved}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-red-600">{reportStats.unresolved}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Reports by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Bar
                    data={{
                      labels: Object.keys(reportStats.categoryCount),
                      datasets: [{
                        label: 'Reports',
                        data: Object.values(reportStats.categoryCount),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                      }],
                    }}
                    options={reportChartOptions}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <Pie
                    data={{
                      labels: Object.keys(reportStats.priorityCount),
                      datasets: [{
                        data: Object.values(reportStats.priorityCount),
                        backgroundColor: [
                          'rgba(239, 68, 68, 0.7)',
                          'rgba(249, 115, 22, 0.7)',
                          'rgba(234, 179, 8, 0.7)',
                          'rgba(34, 197, 94, 0.7)',
                        ],
                      }],
                    }}
                    options={reportChartOptions}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reports Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Line
                  data={{
                    labels: reportStats.timeSeriesData.map(d => d.date),
                    datasets: [{
                      label: 'New Reports',
                      data: reportStats.timeSeriesData.map(d => d.count),
                      borderColor: 'rgb(59, 130, 246)',
                      tension: 0.1,
                    }],
                  }}
                  options={timeSeriesOptions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lostfound">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{lostFoundStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Lost Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-yellow-600">{lostFoundStats.lost}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Found Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">{lostFoundStats.found}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">{lostFoundStats.resolved}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Items by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <Bar
                    data={{
                      labels: Object.keys(lostFoundStats.categoryCount),
                      datasets: [{
                        label: 'Items',
                        data: Object.values(lostFoundStats.categoryCount),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                      }],
                    }}
                    options={reportChartOptions}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Lost vs Found Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <Line
                    data={{
                      labels: lostFoundStats.timeSeriesData.map(d => d.date),
                      datasets: [
                        {
                          label: 'Lost Items',
                          data: lostFoundStats.timeSeriesData.map(d => d.lost),
                          borderColor: 'rgb(234, 179, 8)',
                          tension: 0.1,
                        },
                        {
                          label: 'Found Items',
                          data: lostFoundStats.timeSeriesData.map(d => d.found),
                          borderColor: 'rgb(34, 197, 94)',
                          tension: 0.1,
                        },
                      ],
                    }}
                    options={timeSeriesOptions}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="community">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{messageStats.total}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Community Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Line
                  data={{
                    labels: messageStats.timeSeriesData.map(d => d.date),
                    datasets: [{
                      label: 'Messages',
                      data: messageStats.timeSeriesData.map(d => d.count),
                      borderColor: 'rgb(59, 130, 246)',
                      tension: 0.1,
                    }],
                  }}
                  options={timeSeriesOptions}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default DataAnalysis; 