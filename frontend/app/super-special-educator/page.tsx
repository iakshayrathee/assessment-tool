'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  User,
  FileText,
  AlertTriangle,
  TrendingUp,
  Building2,
  Clock,
  Eye,
  BarChart3,
  BookOpen,
  Plus,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { PageWrapper } from '@/components/layout/PageWrapper';

export default function SuperSpecialEducatorDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getSuperSpecialEducatorDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-destructive mb-4 text-center">{error}</div>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  return (
    <PageWrapper
      title="Super Special Educator Dashboard"
      description="Monitor, review, and support Special Educators across multiple centers"
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
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
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">{dashboardData.stats?.centersCount ?? 0}</div>
                <div className="text-sm text-primary">Assigned Centers</div>
              </div>
              <div className="bg-success/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-success">{dashboardData.stats?.totalStudents ?? 0}</div>
                <div className="text-sm text-foreground">Total Students</div>
              </div>
              <div className="bg-info/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-info">{dashboardData.stats?.educatorsUnderSupervision ?? 0}</div>
                <div className="text-sm text-foreground">Special Educators</div>
              </div>
              <div className="bg-warning/10 p-4 rounded-lg">
                <div className="text-2xl font-bold text-warning">12</div>
                <div className="text-sm text-foreground">Schools</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Sunshine Learning Center</div>
                    <div className="text-sm text-muted-foreground">45 students • 8 educators • 3 schools</div>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Hope Special Education Center</div>
                    <div className="text-sm text-muted-foreground">32 students • 6 educators • 2 schools</div>
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
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Dr. Sarah Johnson</div>
                    <div className="text-sm text-muted-foreground">12 assigned children</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="mb-1">3 Pending</Badge>
                  <div className="text-xs text-muted-foreground">Reports</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">Ms. Emily Chen</div>
                    <div className="text-sm text-muted-foreground">8 assigned children</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-1">1 Pending</Badge>
                  <div className="text-xs text-muted-foreground">Reports</div>
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
              <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <div>
                    <div className="font-medium text-sm">IEP Assessment - John Doe</div>
                    <div className="text-xs text-muted-foreground">Submitted 2 days ago</div>
                  </div>
                </div>
                <Badge variant="destructive">Urgent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <div>
                    <div className="font-medium text-sm">Progress Report - Sarah Smith</div>
                    <div className="text-xs text-muted-foreground">Submitted 1 day ago</div>
                  </div>
                </div>
                <Badge variant="secondary">Review</Badge>
              </div>
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-warning">{dashboardData.stats?.pendingReviews ?? 0}</div>
                <div className="text-sm text-muted-foreground">Total Pending Reviews</div>
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
              <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="font-medium text-sm">Michael Johnson</div>
                    <div className="text-xs text-muted-foreground">Low progress - 15% goal completion</div>
                  </div>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium text-sm">Emma Wilson</div>
                    <div className="text-xs text-muted-foreground">Overdue assessment - 30 days</div>
                  </div>
                </div>
                <Badge variant="secondary">Overdue</Badge>
              </div>
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-destructive">{dashboardData.stats?.flaggedCases ?? 0}</div>
                <div className="text-sm text-muted-foreground">Cases Requiring Attention</div>
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
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="text-xs text-muted-foreground">Conducted training for 5 educators on new IEP guidelines</div>
                <div className="text-xs text-primary mt-1">Dr. Sarah Johnson, Ms. Emily Chen, +3 others</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">Mentorship Note - Assessment Techniques</div>
                  <div className="text-xs text-muted-foreground">Yesterday</div>
                </div>
                <div className="text-xs text-muted-foreground">Provided guidance on adaptive assessment methods</div>
                <div className="text-xs text-primary mt-1">Ms. Emily Chen</div>
              </div>
              <div className="text-center py-2">
                <Button variant="ghost" size="sm" className="text-primary">
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
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sunshine Learning Center</span>
                    <span className="text-success">92%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-success h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Hope Special Education</span>
                    <span className="text-warning">78%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Average Progress Rate</span>
                  <span className="font-medium text-primary">85%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}