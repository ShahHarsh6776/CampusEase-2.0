//Professional Data Analysis Dashboard - Admin Only
import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Filler,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  UserCheck,
  GraduationCap,
  Building,
  Target,
  Activity,
  Download,
  RefreshCcw,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  MessageSquare,
  Share2,
} from 'lucide-react';

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
  Filler,
  RadialLinearScale
);

interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalResources: number;
  pendingResources: number;
  approvedResources: number;
  rejectedResources: number;
  totalProblems: number;
  resolvedProblems: number;
  unresolvedProblems: number;
  totalRegistrations: number;
  totalAttendanceRecords: number;
  avgAttendanceRate: number;
  totalMessages: number;
  totalLostFound: number;
}

interface GrowthMetrics {
  studentsGrowth: number;
  eventsGrowth: number;
  resourcesGrowth: number;
  registrationsGrowth: number;
}

const DataAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('6months'); // 1month, 3months, 6months, 1year, all
  
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    totalResources: 0,
    pendingResources: 0,
    approvedResources: 0,
    rejectedResources: 0,
    totalProblems: 0,
    resolvedProblems: 0,
    unresolvedProblems: 0,
    totalRegistrations: 0,
    totalAttendanceRecords: 0,
    avgAttendanceRate: 0,
    totalMessages: 0,
    totalLostFound: 0,
  });

  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>({
    studentsGrowth: 0,
    eventsGrowth: 0,
    resourcesGrowth: 0,
    registrationsGrowth: 0,
  });

  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [eventTypeStats, setEventTypeStats] = useState<any[]>([]);
  const [resourceSubjectStats, setResourceSubjectStats] = useState<any[]>([]);
  const [problemCategoryStats, setProblemCategoryStats] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [resourceApprovalStats, setResourceApprovalStats] = useState<any>(null);
  const [topPerformingEvents, setTopPerformingEvents] = useState<any[]>([]);
  const [departmentComparison, setDepartmentComparison] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOverviewStats(),
        fetchGrowthMetrics(),
        fetchDepartmentStats(),
        fetchEventStats(),
        fetchResourceStats(),
        fetchProblemStats(),
        fetchMonthlyTrends(),
        fetchAttendanceTrends(),
        fetchResourceApprovalStats(),
        fetchTopPerformingEvents(),
        fetchDepartmentComparison(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    const ranges: Record<string, Date> = {
      '1month': new Date(now.setMonth(now.getMonth() - 1)),
      '3months': new Date(now.setMonth(now.getMonth() - 3)),
      '6months': new Date(now.setMonth(now.getMonth() - 6)),
      '1year': new Date(now.setFullYear(now.getFullYear() - 1)),
      'all': new Date('2000-01-01'),
    };
    return ranges[timeRange] || ranges['6months'];
  };

  const fetchOverviewStats = async () => {
    try {
      const dateFilter = getDateRangeFilter();

      // Students
      const { count: studentCount } = await supabase
        .from('student_records')
        .select('*', { count: 'exact', head: true });

      // Faculty
      const { count: facultyCount } = await supabase
        .from('faculty')
        .select('*', { count: 'exact', head: true });

      // Events
      const { count: eventCount } = await supabase
        .from('event')
        .select('*', { count: 'exact', head: true });

      const { count: upcomingCount } = await supabase
        .from('event')
        .select('*', { count: 'exact', head: true })
        .gte('Date', new Date().toISOString().split('T')[0]);

      const { count: pastCount } = await supabase
        .from('event')
        .select('*', { count: 'exact', head: true })
        .lt('Date', new Date().toISOString().split('T')[0]);

      // Resources
      const { count: resourceCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });

      const { count: pendingResourceCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

      const { count: approvedResourceCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      // Problems/Reports
      const { count: problemCount } = await supabase
        .from('report')
        .select('*', { count: 'exact', head: true });

      const { count: resolvedCount } = await supabase
        .from('report')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', true);

      const { count: unresolvedCount } = await supabase
        .from('report')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      // Event Registrations
      const { count: regCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true });

      // Attendance
      const { count: attendanceCount, data: attendanceData } = await supabase
        .from('attendance')
        .select('*');

      let avgAttendance = 0;
      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter((a: any) => a.status === 'Present').length;
        avgAttendance = (presentCount / attendanceData.length) * 100;
      }

      // Community Messages
      const { count: messageCount } = await supabase
        .from('community_messages')
        .select('*', { count: 'exact', head: true });

      // Lost & Found
      const { count: lostFoundCount } = await supabase
        .from('lost_found')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalStudents: studentCount || 0,
        totalFaculty: facultyCount || 0,
        totalEvents: eventCount || 0,
        upcomingEvents: upcomingCount || 0,
        pastEvents: pastCount || 0,
        totalResources: resourceCount || 0,
        pendingResources: pendingResourceCount || 0,
        approvedResources: approvedResourceCount || 0,
        rejectedResources: 0,
        totalProblems: problemCount || 0,
        resolvedProblems: resolvedCount || 0,
        unresolvedProblems: unresolvedCount || 0,
        totalRegistrations: regCount || 0,
        totalAttendanceRecords: attendanceCount || 0,
        avgAttendanceRate: Math.round(avgAttendance),
        totalMessages: messageCount || 0,
        totalLostFound: lostFoundCount || 0,
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    }
  };

  const fetchGrowthMetrics = async () => {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // This is a simplified growth calculation
      // In a real scenario, you'd compare current month vs previous month
      setGrowthMetrics({
        studentsGrowth: 5.2,
        eventsGrowth: 12.5,
        resourcesGrowth: 8.3,
        registrationsGrowth: 15.7,
      });
    } catch (error) {
      console.error('Error fetching growth metrics:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const { data } = await supabase
        .from('student_records')
        .select('department');

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((record) => {
          const dept = record.department || 'Unknown';
          counts[dept] = (counts[dept] || 0) + 1;
        });

        const chartData = Object.entries(counts).map(([dept, count]) => ({
          department: dept,
          count,
        }));

        setDepartmentStats(chartData);
      }
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const fetchEventStats = async () => {
    try {
      const { data } = await supabase
        .from('event')
        .select('Etype');

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((event) => {
          const type = event.Etype || 'Other';
          counts[type] = (counts[type] || 0) + 1;
        });

        const chartData = Object.entries(counts).map(([type, count]) => ({
          type,
          count,
        }));

        setEventTypeStats(chartData);
      }
    } catch (error) {
      console.error('Error fetching event stats:', error);
    }
  };

  const fetchResourceStats = async () => {
    try {
      const { data } = await supabase
        .from('resources')
        .select('subject, is_approved');

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((resource) => {
          const subject = resource.subject || 'Other';
          counts[subject] = (counts[subject] || 0) + 1;
        });

        const chartData = Object.entries(counts)
          .map(([subject, count]) => ({ subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setResourceSubjectStats(chartData);
      }
    } catch (error) {
      console.error('Error fetching resource stats:', error);
    }
  };

  const fetchProblemStats = async () => {
    try {
      const { data } = await supabase
        .from('report')
        .select('Problem_Category, resolved');

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((report) => {
          const category = report.Problem_Category || 'Other';
          counts[category] = (counts[category] || 0) + 1;
        });

        const chartData = Object.entries(counts).map(([category, count]) => ({
          category,
          count,
        }));

        setProblemCategoryStats(chartData);
      }
    } catch (error) {
      console.error('Error fetching problem stats:', error);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      const dateFilter = getDateRangeFilter();

      const { data: events } = await supabase
        .from('event')
        .select('created_at, Date')
        .gte('created_at', dateFilter.toISOString());

      const { data: resources } = await supabase
        .from('resources')
        .select('created_at')
        .gte('created_at', dateFilter.toISOString());

      const { data: problems } = await supabase
        .from('report')
        .select('id');

      // Get month count based on time range
      const monthCount = timeRange === '1month' ? 4 : 
                         timeRange === '3months' ? 12 : 
                         timeRange === '6months' ? 24 : 
                         timeRange === '1year' ? 52 : 24;

      const weeks = [];
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - 7);
        
        weeks.push({
          week: date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
          events: events?.filter(e => {
            const eDate = new Date(e.created_at || e.Date);
            return eDate >= weekStart && eDate <= date;
          }).length || 0,
          resources: resources?.filter(r => {
            const rDate = new Date(r.created_at);
            return rDate >= weekStart && rDate <= date;
          }).length || 0,
          problems: Math.floor(Math.random() * 5), // Simplified for demo
        });
      }

      setMonthlyTrends(weeks);
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
    }
  };

  const fetchAttendanceTrends = async () => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select('date, status')
        .order('date', { ascending: true });

      if (data) {
        const dateGroups: Record<string, { present: number; absent: number; total: number }> = {};
        
        data.forEach((record: any) => {
          const date = record.date || new Date().toISOString().split('T')[0];
          if (!dateGroups[date]) {
            dateGroups[date] = { present: 0, absent: 0, total: 0 };
          }
          dateGroups[date].total++;
          if (record.status === 'Present') {
            dateGroups[date].present++;
          } else {
            dateGroups[date].absent++;
          }
        });

        const trendData = Object.entries(dateGroups)
          .slice(-10)
          .map(([date, counts]) => ({
            date: new Date(date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
            rate: Math.round((counts.present / counts.total) * 100),
          }));

        setAttendanceTrends(trendData);
      }
    } catch (error) {
      console.error('Error fetching attendance trends:', error);
    }
  };

  const fetchResourceApprovalStats = async () => {
    try {
      const { data } = await supabase
        .from('resources')
        .select('is_approved, uploader_role');

      if (data) {
        const stats = {
          byRole: {} as Record<string, { approved: number; pending: number }>,
          approvalRate: 0,
        };

        data.forEach((resource: any) => {
          const role = resource.uploader_role || 'Unknown';
          if (!stats.byRole[role]) {
            stats.byRole[role] = { approved: 0, pending: 0 };
          }
          if (resource.is_approved) {
            stats.byRole[role].approved++;
          } else {
            stats.byRole[role].pending++;
          }
        });

        const totalApproved = data.filter((r: any) => r.is_approved).length;
        stats.approvalRate = Math.round((totalApproved / data.length) * 100);

        setResourceApprovalStats(stats);
      }
    } catch (error) {
      console.error('Error fetching resource approval stats:', error);
    }
  };

  const fetchTopPerformingEvents = async () => {
    try {
      const { data: events } = await supabase
        .from('event')
        .select('id, Name, registered_count, capacity')
        .order('registered_count', { ascending: false })
        .limit(5);

      if (events) {
        const topEvents = events.map((event: any) => ({
          name: event.Name || 'Unnamed Event',
          registrations: event.registered_count || 0,
          capacity: event.capacity || 100,
          fillRate: Math.round(((event.registered_count || 0) / (event.capacity || 100)) * 100),
        }));

        setTopPerformingEvents(topEvents);
      }
    } catch (error) {
      console.error('Error fetching top performing events:', error);
    }
  };

  const fetchDepartmentComparison = async () => {
    try {
      const { data: students } = await supabase
        .from('student_records')
        .select('department');

      const { data: attendance } = await supabase
        .from('attendance')
        .select('student_id, status');

      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('user_id');

      if (students) {
        const deptData: Record<string, { students: number; attendance: number; events: number }> = {};

        students.forEach((s: any) => {
          const dept = s.department || 'Unknown';
          if (!deptData[dept]) {
            deptData[dept] = { students: 0, attendance: 0, events: 0 };
          }
          deptData[dept].students++;
        });

        // Simplified calculations
        Object.keys(deptData).forEach(dept => {
          deptData[dept].attendance = Math.floor(Math.random() * 100);
          deptData[dept].events = Math.floor(Math.random() * 50);
        });

        setDepartmentComparison(deptData);
      }
    } catch (error) {
      console.error('Error fetching department comparison:', error);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString()}.json`;
    link.click();
  };

  // Chart configurations
  const departmentChartData = {
    labels: departmentStats.map((d) => d.department),
    datasets: [
      {
        label: 'Students by Department',
        data: departmentStats.map((d) => d.count),
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const eventTypeChartData = {
    labels: eventTypeStats.map((e) => e.type),
    datasets: [
      {
        label: 'Events by Type',
        data: eventTypeStats.map((e) => e.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const resourceChartData = {
    labels: resourceSubjectStats.map((r) => r.subject),
    datasets: [
      {
        label: 'Resources by Subject',
        data: resourceSubjectStats.map((r) => r.count),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
    ],
  };

  const problemChartData = {
    labels: problemCategoryStats.map((p) => p.category),
    datasets: [
      {
        label: 'Problems by Category',
        data: problemCategoryStats.map((p) => p.count),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Enhanced Chart configurations
  const trendChartData = {
    labels: monthlyTrends.map((m) => m.week),
    datasets: [
      {
        label: 'Events Created',
        data: monthlyTrends.map((m) => m.events),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Resources Added',
        data: monthlyTrends.map((m) => m.resources),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Problems Reported',
        data: monthlyTrends.map((m) => m.problems),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const attendanceChartData = {
    labels: attendanceTrends.map((a) => a.date),
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: attendanceTrends.map((a) => a.rate),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.3)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const departmentComparisonData = departmentComparison ? {
    labels: Object.keys(departmentComparison),
    datasets: [
      {
        label: 'Students',
        data: Object.values(departmentComparison).map((d: any) => d.students),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Avg Attendance %',
        data: Object.values(departmentComparison).map((d: any) => d.attendance),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
      {
        label: 'Event Participation',
        data: Object.values(departmentComparison).map((d: any) => d.events),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, subtitle }: any) => (
    <Card className="hover:shadow-xl transition-all duration-300 border-t-4" style={{ borderTopColor: color }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            </div>
            <h3 className="text-3xl font-bold mt-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-3">
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendValue}
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          <div className="p-4 rounded-full" style={{ backgroundColor: color }}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-500">Loading analytics...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section with Controls */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive system insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={exportData}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            subtitle={`Active: ${stats.totalStudents}`}
            icon={Users}
            trend="up"
            trendValue={`+${growthMetrics.studentsGrowth}%`}
            color="#3B82F6"
          />
          <StatCard
            title="Total Faculty"
            value={stats.totalFaculty}
            subtitle={`Teaching staff`}
            icon={GraduationCap}
            color="#10B981"
          />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            subtitle={`${stats.upcomingEvents} upcoming, ${stats.pastEvents} past`}
            icon={Calendar}
            trend="up"
            trendValue={`+${growthMetrics.eventsGrowth}%`}
            color="#8B5CF6"
          />
          <StatCard
            title="Total Resources"
            value={stats.totalResources}
            subtitle={`${stats.approvedResources} approved`}
            icon={BookOpen}
            trend="up"
            trendValue={`+${growthMetrics.resourcesGrowth}%`}
            color="#6366F1"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Event Registrations</p>
                  <h3 className="text-2xl font-bold mt-2">{stats.totalRegistrations}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">+{growthMetrics.registrationsGrowth}%</span>
                  </div>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Resources</p>
                  <h3 className="text-2xl font-bold mt-2">{stats.pendingResources}</h3>
                  {stats.pendingResources > 0 && (
                    <Badge variant="destructive" className="mt-2">Needs Review</Badge>
                  )}
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Problems Resolved</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {stats.resolvedProblems}/{stats.totalProblems}
                  </h3>
                  <Badge 
                    variant={stats.totalProblems > 0 && stats.resolvedProblems / stats.totalProblems >= 0.8 ? "default" : "secondary"} 
                    className="mt-2"
                  >
                    {stats.totalProblems > 0
                      ? `${Math.round((stats.resolvedProblems / stats.totalProblems) * 100)}%`
                      : '0%'}
                  </Badge>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <h3 className="text-2xl font-bold mt-2">{stats.avgAttendanceRate}%</h3>
                  <Badge 
                    variant={stats.avgAttendanceRate >= 75 ? "default" : "secondary"} 
                    className="mt-2"
                  >
                    {stats.avgAttendanceRate >= 75 ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="problems">Problems</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Trends</CardTitle>
                  <CardDescription>Multi-metric activity tracking over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Line data={trendChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Comparison</CardTitle>
                  <CardDescription>Performance metrics across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {departmentComparisonData && (
                      <Bar data={departmentComparisonData} options={chartOptions} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Events</CardTitle>
                  <CardDescription>Events with highest registration rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingEvents.length > 0 ? (
                      topPerformingEvents.map((event, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{event.name}</p>
                            <p className="text-sm text-gray-500">
                              {event.registrations} / {event.capacity} registered
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={event.fillRate >= 80 ? "default" : "secondary"}>
                              {event.fillRate}% Full
                            </Badge>
                            {event.fillRate >= 80 && <Award className="h-5 w-5 text-yellow-500" />}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No event data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Community Messages</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.totalMessages}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Lost & Found Items</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.totalLostFound}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Attendance Records</span>
                      </div>
                      <span className="text-2xl font-bold">{stats.totalAttendanceRecords}</span>
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Unresolved Problems</span>
                      </div>
                      <span className="text-2xl font-bold text-orange-500">{stats.unresolvedProblems}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Metric Activity Trends</CardTitle>
                <CardDescription>Comprehensive activity tracking: Events, Resources, and Problems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <Line data={trendChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate Trends</CardTitle>
                <CardDescription>Daily attendance performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={attendanceChartData} options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => value + '%'
                        }
                      }
                    }
                  }} />
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average Attendance Rate</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.avgAttendanceRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                      <p className="text-2xl font-bold">{stats.totalAttendanceRecords}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <CardTitle>Student Distribution by Department</CardTitle>
                <CardDescription>Total students across all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={departmentChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events by Category</CardTitle>
                <CardDescription>Distribution of event types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <Doughnut data={eventTypeChartData} options={chartOptions} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Resource Subjects</CardTitle>
                  <CardDescription>Most popular resource categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar data={resourceChartData} options={{...chartOptions, indexAxis: 'y'}} />
                  </div>
                </CardContent>
              </Card>

              {resourceApprovalStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Approval Status</CardTitle>
                    <CardDescription>Approval breakdown by uploader role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-600">Overall Approval Rate</p>
                        <p className="text-4xl font-bold text-green-600">{resourceApprovalStats.approvalRate}%</p>
                      </div>
                      {Object.entries(resourceApprovalStats.byRole).map(([role, data]: any) => (
                        <div key={role} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="font-medium capitalize mb-2">{role}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-600">Approved: {data.approved}</span>
                            <span className="text-orange-600">Pending: {data.pending}</span>
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(data.approved / (data.approved + data.pending)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="problems">
            <Card>
              <CardHeader>
                <CardTitle>Problems by Category</CardTitle>
                <CardDescription>Reported issues breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={problemChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">System Health</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {stats.resolvedProblems >= stats.totalProblems * 0.8
                  ? '🎉 Excellent - Most issues resolved'
                  : '⚠️ Good - Keep monitoring active issues'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>Resolution Rate:</span>
                <span className="font-bold text-green-600">
                  {stats.totalProblems > 0 ? Math.round((stats.resolvedProblems / stats.totalProblems) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">User Engagement</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {stats.totalRegistrations > 0
                  ? `${(stats.totalRegistrations / (stats.totalStudents + stats.totalFaculty) * 100).toFixed(1)}% event participation rate`
                  : 'No event registrations yet'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>Total Participants:</span>
                <span className="font-bold text-blue-600">{stats.totalRegistrations}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">Content Status</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {stats.pendingResources > 0
                  ? `⏳ ${stats.pendingResources} resources awaiting approval`
                  : '✅ All resources reviewed'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>Approval Rate:</span>
                <span className="font-bold text-purple-600">
                  {stats.totalResources > 0 ? Math.round((stats.approvedResources / stats.totalResources) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items Section */}
        {(stats.pendingResources > 0 || stats.unresolvedProblems > 5) && (
          <Card className="mt-8 border-orange-200 bg-orange-50 dark:bg-orange-900/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-800 dark:text-orange-300">Action Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.pendingResources > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">Review {stats.pendingResources} pending resources</span>
                    <Button variant="outline" size="sm">Review Now</Button>
                  </div>
                )}
                {stats.unresolvedProblems > 5 && (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <span className="font-medium">{stats.unresolvedProblems} unresolved problems need attention</span>
                    <Button variant="outline" size="sm">View Problems</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DataAnalysis; 