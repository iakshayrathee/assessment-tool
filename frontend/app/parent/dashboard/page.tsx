'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  BookOpen,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { PageWrapper } from '@/components/layout/PageWrapper';

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
  const { t } = useTranslation('parent');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeworkStats, setHomeworkStats] = useState({ pending: 0, total: 0 });

  useEffect(() => {
    loadDashboardData();
    loadHomeworkStats();
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

  const loadHomeworkStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/lesson-plans/homework/parent/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const homework = data.data.homework || [];
        setHomeworkStats({
          total: homework.length,
          pending: homework.filter((hw: any) => hw.status === 'ASSIGNED').length
        });
      }
    } catch (error) {
      console.error('Failed to load homework stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success/10 text-foreground';
      case 'INACTIVE': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'ASSESSMENT': return 'bg-primary/10 text-primary';
      case 'IEP': return 'bg-info/10 text-foreground';
      case 'PROGRESS': return 'bg-success/10 text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error || t('dashboard.failedToLoad')}</p>
          <Button onClick={loadDashboardData} className="mt-4">
            {t('dashboard.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper
      title={t('dashboard.title', { name: user?.profile?.fullName || 'Parent' })}
      description={t('dashboard.subtitle')}
      breadcrumbs={[{ label: t('dashboard.breadcrumb') }]}
      actions={
        <>
          <Link href="/parent/concerns/new">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('dashboard.submitConcern')}
            </Button>
          </Link>
          <Link href="/parent/documents/upload">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              {t('dashboard.uploadDocument')}
            </Button>
          </Link>
        </>
      }
    >
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.children')}</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalChildren}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.enrolledInProgram')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.activeGoals')}</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.activeGoals}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.currentlyInProgress')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.achievedGoals')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.achievedGoals}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.successfullyCompleted')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.totalReports')}</CardTitle>
              <FileText className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalReports}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.availableToView')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.openConcerns')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.openConcerns}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.awaitingResponse')}</p>
            </CardContent>
          </Card>

          <Link href="/parent/homework">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.homework')}</CardTitle>
                <ClipboardList className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{homeworkStats.pending}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.pendingTotal', { total: homeworkStats.total })}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="children" className="space-y-6">
          <TabsList>
            <TabsTrigger value="children">{t('dashboard.tabMyChildren')}</TabsTrigger>
            <TabsTrigger value="concerns">{t('dashboard.tabConcerns')}</TabsTrigger>
            <TabsTrigger value="documents">{t('dashboard.tabDocuments')}</TabsTrigger>
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
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">{t('dashboard.assignedEducator')}</h4>
                    <p className="text-primary">{child.assignedEducator}</p>
                    <p className="text-sm text-primary">{child.educatorPhone}</p>
                    <p className="text-sm text-primary">{child.center}</p>
                  </div>

                  {/* Progress Summary */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{t('dashboard.overallProgress')}</h4>
                      <span className="text-sm text-muted-foreground">
                        {child.progressSummary.averageProgress}%
                      </span>
                    </div>
                    <Progress value={child.progressSummary.averageProgress} className="mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{child.progressSummary.achieved} {t('dashboard.goalsAchieved')}</span>
                      <span>{child.progressSummary.inProgress} {t('dashboard.inProgress')}</span>
                    </div>
                  </div>

                  {/* Active Goals */}
                  <div>
                    <h4 className="font-semibold mb-3">{t('dashboard.activeGoalsSection')}</h4>
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
                            <span className="text-sm text-muted-foreground">
                              {goal.progressPercent}%
                            </span>
                          </div>
                          <Progress value={goal.progressPercent} className="mb-2" />
                          <p className="text-xs text-muted-foreground">
                            {t('dashboard.target')} {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div>
                    <h4 className="font-semibold mb-3">{t('dashboard.recentReports')}</h4>
                    <div className="space-y-2">
                      {child.recentReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{report.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getReportTypeColor(report.type)}>
                              {report.type}
                            </Badge>
                            <Link href={`/parent/children/${child.id}/reports/${report.id}`}>
                              <Button size="sm" variant="outline">{t('dashboard.view')}</Button>
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
                        {t('dashboard.viewDetails')}
                      </Button>
                    </Link>
                    <Link href={`/parent/children/${child.id}/reports`}>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        {t('dashboard.allReports')}
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
                <CardTitle>{t('dashboard.recentConcerns')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recentConcernsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentConcerns.map((concern) => (
                    <div key={concern.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{concern.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('dashboard.submitted')} {new Date(concern.createdAt).toLocaleDateString()}
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
                    <Button variant="outline">{t('dashboard.viewAllConcerns')}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recentDocuments')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recentDocumentsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{doc.fileName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {doc.category} • {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">{t('dashboard.download')}</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/parent/documents">
                    <Button variant="outline">{t('dashboard.viewAllDocuments')}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </PageWrapper>
  );
}
