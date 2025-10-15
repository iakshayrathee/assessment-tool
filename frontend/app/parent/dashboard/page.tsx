'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  FileText, 
  Target, 
  MessageCircle, 
  Upload, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Child {
  id: string;
  fullName: string;
  age: number;
  grade: string;
  status: string;
  center?: string;
  school?: string;
  assignedEducator?: string;
  educatorPhone?: string;
  progressSummary: {
    totalGoals: number;
    inProgress: number;
    achieved: number;
    averageProgress: number;
  };
  recentReports: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: string;
  }>;
  activeGoals: Array<{
    id: string;
    domain: string;
    goalStatement: string;
    progressPercent: number;
    targetDate: string;
  }>;
}

interface DashboardData {
  overview: {
    totalChildren: number;
    activeGoals: number;
    achievedGoals: number;
    totalReports: number;
    openConcerns: number;
  };
  children: Child[];
  recentConcerns: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  recentDocuments: Array<{
    id: string;
    fileName: string;
    category: string;
    createdAt: string;
  }>;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getParentDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load parent dashboard:', error);
      toast.error('Failed to load dashboard data. Please try again.');
      setError('Failed to load dashboard data. Please try again.');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'ASSESSMENT': return 'bg-blue-100 text-blue-800';
      case 'IEP': return 'bg-purple-100 text-purple-800';
      case 'PROGRESS': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Failed to load dashboard data'}</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.profile?.fullName || 'Parent'}
              </h1>
              <p className="text-gray-600">Track your children's progress and stay connected</p>
            </div>
            <div className="flex gap-3">
              <Link href="/parent/concerns/new">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Submit Concern
                </Button>
              </Link>
              <Link href="/parent/documents/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalChildren}</div>
              <p className="text-xs text-muted-foreground">Enrolled in program</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.activeGoals}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achieved Goals</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.achievedGoals}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalReports}</div>
              <p className="text-xs text-muted-foreground">Available to view</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Concerns</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.openConcerns}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="children" className="space-y-6">
          <TabsList>
            <TabsTrigger value="children">My Children</TabsTrigger>
            <TabsTrigger value="concerns">Concerns</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="children" className="space-y-6">
            {dashboardData.children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{child.fullName}</CardTitle>
                      <CardDescription>
                        {child.age} years • {child.grade} • {child.school}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(child.status)}>
                      {child.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Educator Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Assigned Educator</h4>
                    <p className="text-blue-800">{child.assignedEducator}</p>
                    <p className="text-sm text-blue-600">{child.educatorPhone}</p>
                    <p className="text-sm text-blue-600">{child.center}</p>
                  </div>

                  {/* Progress Summary */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Overall Progress</h4>
                      <span className="text-sm text-gray-600">
                        {child.progressSummary.averageProgress}%
                      </span>
                    </div>
                    <Progress value={child.progressSummary.averageProgress} className="mb-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{child.progressSummary.achieved} goals achieved</span>
                      <span>{child.progressSummary.inProgress} in progress</span>
                    </div>
                  </div>

                  {/* Active Goals */}
                  <div>
                    <h4 className="font-semibold mb-3">Active Goals</h4>
                    <div className="space-y-3">
                      {child.activeGoals.map((goal) => (
                        <div key={goal.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {goal.domain}
                              </Badge>
                              <p className="text-sm font-medium">{goal.goalStatement}</p>
                            </div>
                            <span className="text-sm text-gray-600">
                              {goal.progressPercent}%
                            </span>
                          </div>
                          <Progress value={goal.progressPercent} className="mb-2" />
                          <p className="text-xs text-gray-500">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div>
                    <h4 className="font-semibold mb-3">Recent Reports</h4>
                    <div className="space-y-2">
                      {child.recentReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <div>
                              <p className="font-medium">{report.title}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getReportTypeColor(report.type)}>
                              {report.type}
                            </Badge>
                            <Link href={`/parent/children/${child.id}/reports/${report.id}`}>
                              <Button size="sm" variant="outline">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Link href={`/parent/children/${child.id}`}>
                      <Button variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/parent/children/${child.id}/reports`}>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        All Reports
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="concerns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Concerns</CardTitle>
                <CardDescription>
                  Your submitted concerns and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentConcerns.map((concern) => (
                    <div key={concern.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{concern.title}</h4>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(concern.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={concern.status === 'Open' ? 'destructive' : 'default'}>
                        {concern.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/parent/concerns">
                    <Button variant="outline">View All Concerns</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
                <CardDescription>
                  Documents you've uploaded for your children
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium">{doc.fileName}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.category} • {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Download</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/parent/documents">
                    <Button variant="outline">View All Documents</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
