'use client';

import { useAuth } from '@/hooks/useAuth';
import { 
  useSpecialEducatorDashboard, 
  useSpecialEducatorActivities, 
  useSpecialEducatorSchedule
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
  Clock,
  RefreshCw,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EducatorDashboard() {
  const { user } = useAuth();
  
  // Use the new hooks for real data
  const { dashboard, isLoading: isDashboardLoading, error: dashboardError, refetch: refetchDashboard } = useSpecialEducatorDashboard();
  
  const { students, isLoading: isStudentsLoading, error: studentsError, refetch: refetchStudents } = useEducatorStudents({ limit: 5 });
  
  const { activities, isLoading: isActivitiesLoading, error: activitiesError } = useSpecialEducatorActivities(5);
  
  const { schedule, isLoading: isScheduleLoading, error: scheduleError } = useSpecialEducatorSchedule();

  const isLoading = isDashboardLoading || isStudentsLoading;
  const hasError = dashboardError || studentsError;

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

  if (hasError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900">Failed to load dashboard data</h3>
                <p className="text-red-700 mt-1">Please try refreshing the page or contact support if the issue persists.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  refetchDashboard();
                  refetchStudents();
                }}
                className="flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
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
              Welcome back, {user?.profile?.fullName || user?.specialEducatorProfile?.fullName || 'Special Educator'}
            </h1>
            <p className="text-gray-600 mt-1">Manage your students and track their progress</p>
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
                {isStudentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : studentsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <p className="text-gray-600">Failed to load students</p>
                  </div>
                ) : !students || students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 mb-4">No students assigned yet</p>
                    <Link href="/educator/students/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Student
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {students.map((student: any) => (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">
                                {student.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'ST'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{student.fullName || 'Unknown Student'}</h3>
                              <p className="text-sm text-gray-600">
                                {student.age ? `${student.age} years` : 'Age N/A'} • {student.grade || 'Grade N/A'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <Badge className={getStatusColor(student.status || 'INACTIVE')}>
                                {student.status || 'INACTIVE'}
                              </Badge>
                              {student.lastSession && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Last: {format(new Date(student.lastSession), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                            
                            {student.progressSummary && (
                              <div className="w-32 hidden md:block">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Progress</span>
                                  <span className="font-medium">{student.progressSummary.averageProgress || 0}%</span>
                                </div>
                                <Progress value={student.progressSummary.averageProgress || 0} className="h-2" />
                                <p className="text-xs text-gray-500 mt-1">
                                  {student.progressSummary.completedGoals || 0}/{student.progressSummary.totalGoals || 0} goals
                                </p>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Link href={`/educator/students/${student.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              <Link href={`/educator/assessments?studentId=${student.id}`}>
                                <Button size="sm">
                                  <FileText className="h-4 w-4 mr-1" />
                                  Assess
                                </Button>
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
                  </>
                )}
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
                {isActivitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : activitiesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <p className="text-gray-600">Failed to load activities</p>
                  </div>
                ) : !activities || activities.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No recent activities</p>
                    <p className="text-sm text-gray-500 mt-2">Your activities will appear here as you work with students</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{activity.title || 'Activity'}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            Student: {activity.studentName || 'Unknown'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-gray-500">
                            {activity.date ? format(new Date(activity.date), 'MMM dd, yyyy') : 'N/A'}
                          </p>
                          <Badge 
                            variant={activity.status === 'completed' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {activity.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                  Your appointments and tasks for {format(new Date(), 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isScheduleLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : scheduleError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                      <p className="text-gray-600">Failed to load schedule</p>
                    </div>
                  ) : !schedule || schedule.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No scheduled activities for today</p>
                      <p className="text-sm text-gray-400 mt-2">Your schedule will appear here</p>
                    </div>
                  ) : (
                    schedule.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          item.type === 'assessment' ? 'bg-blue-100' :
                          item.type === 'iep_review' ? 'bg-green-100' :
                          'bg-purple-100'
                        }`}>
                          <Clock className={`h-6 w-6 ${
                            item.type === 'assessment' ? 'text-blue-600' :
                            item.type === 'iep_review' ? 'text-green-600' :
                            'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.title || 'Scheduled Activity'}</h4>
                          <p className="text-sm text-gray-600 truncate">{item.description || 'No description'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-gray-900">{item.time || 'TBD'}</p>
                          <p className="text-xs text-gray-500">{item.duration || 'Duration TBD'}</p>
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
