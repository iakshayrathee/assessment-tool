'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEducatorDashboardAnalytics, useStudentsWithAnalytics, useProgressTrends } from '@/hooks/useEducatorAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  PerformanceDistributionChart,
  DomainPerformanceChart,
  ProgressTrendsChart
} from '@/components/educator/AnalyticsCharts';
import {
  Users,
  Target,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ClipboardList,
  Plus,
  Eye,
  FileText,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Award,
  Download,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';

export default function EducatorDashboard() {
  const { user } = useAuth();

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: analytics, isLoading: isAnalyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useEducatorDashboardAnalytics();
  const { data: students, isLoading: isStudentsLoading, error: studentsError, refetch: refetchStudents } = useStudentsWithAnalytics();
  const { data: trends } = useProgressTrends(timePeriod);

  const isLoading = isAnalyticsLoading || isStudentsLoading;
  const hasError = analyticsError || studentsError;

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    if (!students) return [];

    let filtered = students.filter((student: any) => {
      // Search filter
      const matchesSearch = student.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

      // Grade filter
      const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;

      // Performance filter
      const avgProgress = student.progressSummary?.averageProgress || 0;
      let matchesPerformance = true;
      if (performanceFilter === 'high') matchesPerformance = avgProgress >= 75;
      else if (performanceFilter === 'ontrack') matchesPerformance = avgProgress >= 50 && avgProgress < 75;
      else if (performanceFilter === 'needs-support') matchesPerformance = avgProgress < 50;

      return matchesSearch && matchesStatus && matchesGrade && matchesPerformance;
    });

    // Sort students
    filtered.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.fullName || '').localeCompare(b.fullName || '');
          break;
        case 'progress':
          comparison = (a.progressSummary?.averageProgress || 0) - (b.progressSummary?.averageProgress || 0);
          break;
        case 'lastSession':
          const dateA = a.lastSession ? new Date(a.lastSession).getTime() : 0;
          const dateB = b.lastSession ? new Date(b.lastSession).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'grade':
          comparison = (a.grade || '').localeCompare(b.grade || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchQuery, statusFilter, gradeFilter, performanceFilter, sortBy, sortOrder]);


  // Get unique grades for filter
  const uniqueGrades = useMemo(() => {
    if (!students) return [];
    const grades = students.map((s: any) => s.grade).filter(Boolean);
    return Array.from(new Set(grades)).sort();
  }, [students]);

  // Export to PDF
  const exportToPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 10,
      filename: `educator-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!students) return;

    const headers = ['Name', 'Age', 'Grade', 'Status', 'Overall Progress', 'Remediation Plans (Completed/Total)', 'Last Session'];
    const rows = students.map((student: any) => [
      student.fullName || '',
      student.age || '',
      student.grade || '',
      student.status || '',
      `${student.progressSummary?.averageProgress || 0}%`,
      `${student.progressSummary?.completedGoals || 0}/${student.progressSummary?.totalGoals || 0}`,
      student.lastSession ? format(new Date(student.lastSession), 'yyyy-MM-dd') : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
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
                  refetchAnalytics();
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
              <p className="text-gray-600 mt-1">Analytics Dashboard - Track your students' progress and performance</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
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

      <div id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">Active students under your care</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.averageStudentProgress || 0}%</div>
              <p className="text-xs text-muted-foreground">Across all remediation plans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Remediation Plans</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.activeIEPGoals || 0}</div>
              <p className="text-xs text-muted-foreground">Goals currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.pendingTasks || 0}</div>
              <p className="text-xs text-muted-foreground">Assessments & homework</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Distribution</CardTitle>
              <CardDescription>Distribution of students by performance level</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.performanceDistribution && (
                <PerformanceDistributionChart data={analytics.performanceDistribution} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Domain Performance Overview</CardTitle>
              <CardDescription>Average progress across learning domains</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.domainAverages && (
                <DomainPerformanceChart data={analytics.domainAverages} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Trends */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Progress Trends</CardTitle>
                <CardDescription>Track progress over time</CardDescription>
              </div>
              <Select value={timePeriod} onValueChange={(value: any) => setTimePeriod(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {trends?.trendData && trends.trendData.length > 0 ? (
              <ProgressTrendsChart data={trends.trendData} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No trend data available for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Analytics Cards with Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Student Analytics</CardTitle>
            <CardDescription>Detailed performance metrics for each student</CardDescription>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueGrades.map((grade: string) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Performance</SelectItem>
                  <SelectItem value="high">High Performers (≥75%)</SelectItem>
                  <SelectItem value="ontrack">On Track (50-74%)</SelectItem>
                  <SelectItem value="needs-support">Needs Support (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="lastSession">Last Session</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
              <span className="ml-4 text-sm text-gray-600">
                Showing {filteredAndSortedStudents.length} of {students?.length || 0} students
              </span>
            </div>
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
            ) : filteredAndSortedStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">
                  {students?.length === 0 ? 'No students assigned yet' : 'No students match your filters'}
                </p>
                {students?.length === 0 && (
                  <Link href="/educator/students/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Student
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedStudents.map((student: any) => {
                  const progressSummary = student.progressSummary || {};
                  const avgProgress = progressSummary.averageProgress || 0;

                  return (
                    <Card key={student.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">
                                {student.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'ST'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-base">{student.fullName || 'Unknown Student'}</h3>
                              <p className="text-xs text-gray-600">
                                {student.age ? `${student.age} years` : 'Age N/A'} • {student.grade || 'Grade N/A'}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(student.status || 'INACTIVE')}>
                            {student.status || 'INACTIVE'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Overall Progress</span>
                            <span className="font-semibold">{avgProgress}%</span>
                          </div>
                          <Progress value={avgProgress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="flex items-center gap-1 text-blue-700 mb-1">
                              <Target className="h-3 w-3" />
                              <span className="font-medium">Remediation Plans</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">
                              {progressSummary.completedGoals || 0}/{progressSummary.totalGoals || 0}
                            </p>
                          </div>

                          <div className="bg-green-50 p-2 rounded">
                            <div className="flex items-center gap-1 text-green-700 mb-1">
                              <CheckCircle className="h-3 w-3" />
                              <span className="font-medium">Completed</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">
                              {progressSummary.completedGoals || 0}
                            </p>
                          </div>
                        </div>

                        {student.lastSession && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Last session: {format(new Date(student.lastSession), 'MMM dd, yyyy')}</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Link href={`/educator/students/${student.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </Link>
                          <Link href={`/educator/assessments?studentId=${student.id}`}>
                            <Button size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              Assess
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredAndSortedStudents.length > 0 && (
              <div className="mt-6 text-center">
                <Link href="/educator/students">
                  <Button variant="outline">View All Students</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Reports</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.completedReports || 0}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.upcomingSessions || 0}</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
              <BookOpen className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.pendingAssessments || 0}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
