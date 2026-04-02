'use client';

import { useState } from 'react';
import { useSchoolViewer, useSchoolViewerActivity } from '@/hooks/useSchoolViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  FileText,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  School,
  MapPin,
  Phone,
  Mail,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  BarChart3,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface DashboardStats {
  totalStudents: number;
  studentsByStatus: Record<string, number>;
  iepGoalsByStatus: Record<string, number>;
  sessionNotesThisMonth: number;
  totalReports: number;
  reportsByType: Record<string, number>;
  complianceRate: number;
  interventionProgress: number;
}

interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  center: {
    id: string;
    centerName: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

interface RecentAssessment {
  id: string;
  status: string;
  assessmentType: string;
  completedAt?: string;
  student: {
    id: string;
    fullName: string;
    grade: string;
  };
  specialEducator: {
    id: string;
    fullName: string;
  };
}

interface RecentReport {
  id: string;
  type: string;
  status: string;
  title: string;
  submittedAt?: string;
  student: {
    id: string;
    fullName: string;
    grade: string;
  };
  specialEducator: {
    id: string;
    fullName: string;
  };
}

interface AssignedEducator {
  id: string;
  fullName: string;
  phone?: string;
}

interface DashboardData {
  school: School;
  stats: DashboardStats;
  recentAssessments: RecentAssessment[];
  recentReports: RecentReport[];
  assignedEducators: AssignedEducator[];
}

export default function SchoolViewerDashboard() {
  const { dashboard, isLoadingDashboard, dashboardError, refetchDashboard } = useSchoolViewer();
  const { activities, isLoading: isLoadingActivity } = useSchoolViewerActivity({ limit: 10 });

  const [activeTab, setActiveTab] = useState('overview');

  if (isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Dashboard</h3>
        <p className="text-muted-foreground mb-4">Unable to load dashboard data. Please try again.</p>
        <Button onClick={() => refetchDashboard()}>
          Retry
        </Button>
      </div>
    );
  }

  const data = dashboard as DashboardData;

  if (!data) {
    return (
      <div className="text-center py-12">
        <School className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
        <p className="text-muted-foreground">Dashboard data is not available at the moment.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'achieved':
        return 'bg-success/10 text-foreground';
      case 'in_progress':
      case 'pending':
        return 'bg-warning/10 text-foreground';
      case 'reviewed':
        return 'bg-primary/10 text-primary';
      case 'inactive':
      case 'discontinued':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <PageWrapper
      title={`${data.school.name} Dashboard`}
      description={`Managed by ${data.school.center.centerName}${data.school.principalName ? ` • Principal: ${data.school.principalName}` : ''}`}
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      {/* School Info Card */}
      <div className="bg-background rounded-lg border p-4 flex items-center gap-6 flex-wrap">
        {data.school.address && (
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1.5" />
            <span className="text-sm">{data.school.address}</span>
          </div>
        )}
        {data.school.phone && (
          <div className="flex items-center text-muted-foreground">
            <Phone className="h-4 w-4 mr-1.5" />
            <span className="text-sm">{data.school.phone}</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active: {data.stats.studentsByStatus.ACTIVE || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IEP Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.interventionProgress}%
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full"
                  style={{ width: `${data.stats.interventionProgress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Goals in Progress: {data.stats.iepGoalsByStatus.IN_PROGRESS || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.complianceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Appropriate interventions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              All report types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.sessionNotesThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Therapy sessions conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Educators</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.assignedEducators.length}</div>
            <p className="text-xs text-muted-foreground">
              Special educators working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Types</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.reportsByType ? Object.keys(data.stats.reportsByType).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Different report categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Recent Assessments</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Student Status Breakdown</CardTitle>
                <CardDescription>Distribution of students by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.stats.studentsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(status)}>
                          {formatStatus(status)}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href="/school-viewer/students">
                    <Button variant="outline" className="w-full">
                      View All Students
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Educators */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Educators</CardTitle>
                <CardDescription>Special educators working with your students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.assignedEducators.slice(0, 5).map((educator) => (
                    <div key={educator.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{educator.fullName}</p>
                        {educator.phone && (
                          <p className="text-sm text-muted-foreground">{educator.phone}</p>
                        )}
                      </div>
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                  {data.assignedEducators.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No educators assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Latest assessment activities for your students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{assessment.student.fullName}</h4>
                        <Badge variant="outline" className="text-xs">
                          Grade {assessment.student.grade}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {assessment.assessmentType} Assessment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {assessment.specialEducator.fullName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(assessment.status)}>
                        {formatStatus(assessment.status)}
                      </Badge>
                      {assessment.completedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(assessment.completedAt), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {data.recentAssessments.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No recent assessments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest reports generated for your students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{report.student.fullName}</h4>
                        <Badge variant="outline" className="text-xs">
                          Grade {report.student.grade}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {formatStatus(report.type)} Report
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {report.specialEducator.fullName}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(report.status)}>
                        {formatStatus(report.status)}
                      </Badge>
                      {report.submittedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(report.submittedAt), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {data.recentReports.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No recent reports</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/school-viewer/school-reports">
                  <Button variant="outline" className="w-full">
                    View All Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent session activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading activities...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>{format(new Date(activity.date), 'MMM dd, yyyy')}</span>
                          <span>•</span>
                          <span>by {activity.educator.fullName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No recent activities</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
