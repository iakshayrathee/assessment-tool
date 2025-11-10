'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  User,
  GraduationCap, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  BarChart3,
  BookOpen,
  Target,
  Award,
  Activity,
  PieChart,
  LineChart,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  centersCount: number;
  totalStudents: number;
  educatorsUnderSupervision: number;
  pendingReviews: number;
  flaggedCases: number;
}

interface DashboardData {
  profile: any;
  stats: DashboardStats;
}

export default function SuperSpecialEducatorDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSuperSpecialEducatorDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Super Special Educator Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor, review, and support Special Educators across multiple centers
          </p>
        </div>

        {/* Dashboard Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. Center Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Center Overview
                </CardTitle>
                <CardDescription>
                  All assigned centers - click to drill down to school and child level
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.centersCount}</div>
                  <div className="text-sm text-blue-800">Assigned Centers</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.stats.totalStudents}</div>
                  <div className="text-sm text-green-800">Total Students</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dashboardData.stats.educatorsUnderSupervision}</div>
                  <div className="text-sm text-purple-800">Special Educators</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <div className="text-sm text-orange-800">Schools</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Sunshine Learning Center</div>
                      <div className="text-sm text-gray-500">45 students • 8 educators • 3 schools</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Hope Special Education Center</div>
                      <div className="text-sm text-gray-500">32 students • 6 educators • 2 schools</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Special Educator Tracker */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Special Educator Tracker
                </CardTitle>
                <CardDescription>
                  View assigned Special Educators, their children, and pending reports
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/super-special-educator/educators')}>
                  View All
                </Button>
                <Button size="sm" onClick={() => router.push('/super-special-educator/educators?action=create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Educator
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Dr. Sarah Johnson</div>
                      <div className="text-sm text-gray-500">12 assigned children</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">3 Pending</Badge>
                    <div className="text-xs text-gray-500">Reports</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Ms. Emily Chen</div>
                      <div className="text-sm text-gray-500">8 assigned children</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">1 Pending</Badge>
                    <div className="text-xs text-gray-500">Reports</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Assessment & IEP Review */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Assessment & IEP Review
                </CardTitle>
                <CardDescription>
                  New IEPs, assessments, and reports requiring review or feedback
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/super-special-educator/reviews')}>
                Review All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">IEP Assessment - John Doe</div>
                      <div className="text-xs text-gray-500">Submitted 2 days ago</div>
                    </div>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-medium text-sm">Progress Report - Sarah Smith</div>
                      <div className="text-xs text-gray-500">Submitted 1 day ago</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Review</Badge>
                </div>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-orange-600">{dashboardData.stats.pendingReviews}</div>
                  <div className="text-sm text-gray-500">Total Pending Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Flagged Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Flagged Cases
                </CardTitle>
                <CardDescription>
                  Escalated/low-progress children requiring intervention plan updates
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/super-special-educator/flagged-cases')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium text-sm">Michael Johnson</div>
                      <div className="text-xs text-gray-500">Low progress - 15% goal completion</div>
                    </div>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="font-medium text-sm">Emma Wilson</div>
                      <div className="text-xs text-gray-500">Overdue assessment - 30 days</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Overdue</Badge>
                </div>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-red-600">{dashboardData.stats.flaggedCases}</div>
                  <div className="text-sm text-gray-500">Cases Requiring Attention</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Training Log / Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Training Log / Notes
                </CardTitle>
                <CardDescription>
                  Record support interactions and suggestions for Special Educators
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">Training Session - IEP Best Practices</div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                  <div className="text-xs text-gray-600">Conducted training for 5 educators on new IEP guidelines</div>
                  <div className="text-xs text-blue-600 mt-1">Dr. Sarah Johnson, Ms. Emily Chen, +3 others</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">Mentorship Note - Assessment Techniques</div>
                    <div className="text-xs text-gray-500">Yesterday</div>
                  </div>
                  <div className="text-xs text-gray-600">Provided guidance on adaptive assessment methods</div>
                  <div className="text-xs text-blue-600 mt-1">Ms. Emily Chen</div>
                </div>
                <div className="text-center py-2">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View All Training Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. Cross-Center Comparison */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Cross-Center Comparison
                </CardTitle>
                <CardDescription>
                  Performance, report completion rates, and analytics across centers
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/super-special-educator/analytics')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Full Analytics
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Report Completion Rate</div>
                  <div className="text-sm text-gray-500">This Month</div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sunshine Learning Center</span>
                      <span className="text-green-600">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hope Special Education</span>
                      <span className="text-yellow-600">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Progress Rate</span>
                    <span className="font-medium text-blue-600">85%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}