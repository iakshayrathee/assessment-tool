'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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

  const recentActivities = [
    {
      id: 1,
      type: 'review',
      description: 'Reviewed IEP for John Doe at Center A',
      timestamp: '2 hours ago',
      status: 'completed'
    },
    {
      id: 2,
      type: 'visit',
      description: 'Scheduled visit to Center B',
      timestamp: '4 hours ago',
      status: 'scheduled'
    },
    {
      id: 3,
      type: 'flag',
      description: 'New flagged case: Sarah Smith',
      timestamp: '6 hours ago',
      status: 'pending'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {dashboardData.profile?.fullName || 'Super Special Educator'}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and oversee special education programs across multiple centers
          </p>
        </div>
        <Button onClick={() => router.push('/super-special-educator/profile')}>
          View Profile
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Centers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.centersCount}</div>
            <p className="text-xs text-muted-foreground">
              Active centers under supervision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students across all centers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Educators Under Supervision</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.educatorsUnderSupervision}</div>
            <p className="text-xs text-muted-foreground">
              Special educators managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              Reports awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.flaggedCases}</div>
            <p className="text-xs text-muted-foreground">
              Cases requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending-reviews">Pending Reviews</TabsTrigger>
          <TabsTrigger value="flagged-cases">Flagged Cases</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Access key functions and manage your responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/super-special-educator/centers')}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Centers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/super-special-educator/educators')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Supervise Educators
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/super-special-educator/students')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Monitor Students
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/super-special-educator/reviews')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Review Reports
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and actions across your centers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'review' && <FileText className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'visit' && <Building2 className="h-4 w-4 text-green-600" />}
                        {activity.type === 'flag' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                      <Badge variant={
                        activity.status === 'completed' ? 'default' :
                        activity.status === 'scheduled' ? 'secondary' : 'destructive'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending-reviews">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                Reports and assessments awaiting your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending reviews</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All reports have been reviewed. Check back later for new submissions.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/super-special-educator/reviews')}>
                    View All Reviews
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged-cases">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Cases</CardTitle>
              <CardDescription>
                Students requiring immediate attention or intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No flagged cases</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All cases are currently under normal supervision.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/super-special-educator/flagged-cases')}>
                    View All Cases
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                Performance metrics and insights across your centers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Dashboard</h3>
                <p className="mt-1 text-sm text-gray-500">
                  View detailed analytics and performance metrics.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/super-special-educator/analytics')}>
                    View Full Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
