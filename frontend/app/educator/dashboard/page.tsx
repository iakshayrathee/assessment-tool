'use client';

import { useAuth } from '@/hooks/useAuth';
import { 
  useSpecialEducatorDashboard, 
  useSpecialEducatorActivities, 
  useSpecialEducatorSchedule,
  useCheckSpecialEducatorToken
} from '@/hooks/useSpecialEducator';
import { useEducatorStudents } from '@/hooks/useEducator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Target, 
  Calendar, 
  Plus, 
  BookOpen, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
// Removed page-level EducatorLayout to avoid double sidebar

export default function EducatorDashboard() {
  const { user } = useAuth();
  
  // Check token first
  const { isLoading: isTokenLoading, error: tokenError } = useCheckSpecialEducatorToken();
  
  // Use the new hooks for real data
  const { dashboard, isLoading: isDashboardLoading } = useSpecialEducatorDashboard();
  
  const { students, isLoading: isStudentsLoading } = useEducatorStudents({ limit: 5 });
  
  const { activities, isLoading: isActivitiesLoading } = useSpecialEducatorActivities(5);
  
  const { schedule, isLoading: isScheduleLoading } = useSpecialEducatorSchedule();

  const isLoading = isTokenLoading || isDashboardLoading || isStudentsLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <FileText className="h-4 w-4" />;
      case 'iep_goal': return <Target className="h-4 w-4" />;
      case 'session_note': return <BookOpen className="h-4 w-4" />;
      case 'report': return <TrendingUp className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold">Token Error</h2>
            <p>{tokenError.message}</p>
          </div>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-w-2xl text-left">
            {JSON.stringify(tokenError, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Header */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.profile?.fullName || 'Special Educator'}
            </h1>
            <p className="text-gray-600">Manage your students and track their progress</p>
          </div>
          <div className="flex gap-3">
              <Link href="/educator/students/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.assignedStudents || 0}</div>
              <p className="text-xs text-muted-foreground">Active students under your care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.pendingAssessments || 0}</div>
              <p className="text-xs text-muted-foreground">Assessments requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active IEP Goals</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.activeIEPGoals || 0}</div>
              <p className="text-xs text-muted-foreground">Goals currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Reports</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.completedReports || 0}</div>
              <p className="text-xs text-muted-foreground">Reports finalized this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">My Students</TabsTrigger>
            <TabsTrigger value="activities">Recent Activities</TabsTrigger>
            <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Students</CardTitle>
                <CardDescription>
                  Overview of all students assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {student.fullName.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{student.fullName}</h3>
                          <p className="text-sm text-gray-600">
                            {student.age} years • {student.grade}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge className={getStatusColor(student.status)}>
                            {student.status}
                          </Badge>
                          {student.lastSession && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last session: {new Date(student.lastSession).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        
                        {student.progressSummary && (
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{student.progressSummary.averageProgress}%</span>
                            </div>
                            <Progress value={student.progressSummary.averageProgress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              {student.progressSummary.completedGoals}/{student.progressSummary.totalGoals} goals
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Link href={`/educator/students/${student.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          <Link href={`/educator/students/${student.id}/assessment`}>
                            <Button size="sm">Assess</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Link href="/educator/students">
                    <Button variant="outline">View All Students</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Your latest actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-600">
                          Student: {activity.studentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  Your appointments and tasks for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isScheduleLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : schedule.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No scheduled activities for today</p>
                    </div>
                  ) : (
                    schedule.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <Clock className={`h-5 w-5 ${
                          item.type === 'assessment' ? 'text-blue-600' :
                          item.type === 'iep_review' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.time}</p>
                          <p className="text-xs text-gray-500">{item.duration}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
