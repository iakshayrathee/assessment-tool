'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface ComplianceData {
  totalStudents: number;
  studentsWithReports: number;
  complianceRate: number;
  overdueReports: number;
  completedReports: number;
  reportCompletionRate: number;
  pendingAssessments: number;
  expiredIEPs: number;
  alerts: string[];
}

interface OverdueReport {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    grade: string;
  };
  specialEducator?: {
    id: string;
    fullName: string;
  };
}

export default function CompliancePage() {
  const { user } = useAuth();
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [overdueReports, setOverdueReports] = useState<OverdueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      const [compliance, overdue] = await Promise.all([
        apiClient.getCenterCompliance(centerId),
        apiClient.getCenterOverdueReports(centerId, { page: 1, limit: 10 })
      ]);

      setComplianceData(compliance);
      setOverdueReports(overdue.data);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      setError('Failed to load compliance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComplianceData();
    setRefreshing(false);
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-success bg-success/10';
    if (rate >= 70) return 'text-warning bg-warning/10';
    return 'text-destructive bg-destructive/10';
  };

  const getComplianceLabel = (rate: number) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Good';
    return 'Needs Attention';
  };

  const getDaysOverdue = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays - 30; // 30 days is the threshold
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadComplianceData}>
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!complianceData) {
    return null;
  }

  return (
    <PageWrapper
      title="Compliance Monitoring"
      description="Monitor regulatory compliance and track overdue items"
      breadcrumbs={[{ label: 'Center', href: '/center' }, { label: 'Compliance' }]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={() => console.log('Export compliance report')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      }
    >

      {/* Compliance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <EnhancedCard
          title="Compliance Rate"
          value={`${complianceData.complianceRate}%`}
          description="Students with reports"
          icon={CheckCircle}
          iconColor="text-success"
          iconBgColor="bg-success/10"
          change={`${complianceData.studentsWithReports}/${complianceData.totalStudents} students`}
          changeType="positive"
        />
        <EnhancedCard
          title="Overdue Reports"
          value={complianceData.overdueReports}
          description="Require immediate attention"
          icon={AlertTriangle}
          iconColor="text-destructive"
          iconBgColor="bg-destructive/10"
          change="Past 30 days threshold"
          changeType="negative"
        />
        <EnhancedCard
          title="Report Completion"
          value={`${complianceData.reportCompletionRate}%`}
          description="On-time completion rate"
          icon={TrendingUp}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
          change={`${complianceData.completedReports} completed`}
          changeType="positive"
        />
        <EnhancedCard
          title="Pending Items"
          value={complianceData.pendingAssessments + complianceData.expiredIEPs}
          description="Assessments & expired IEPs"
          icon={Clock}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
          change="Require action"
          changeType="neutral"
        />
      </motion.div>

      {/* Alerts */}
      {complianceData.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-destructive/20 bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5" />
                Compliance Alerts
              </CardTitle>
              <CardDescription className="text-destructive">
                Items requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {complianceData.alerts.map((alert, index) => (
                  <li key={index} className="flex items-start gap-2 text-foreground">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{alert}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overdue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overdue">Overdue Reports ({overdueReports.length})</TabsTrigger>
            <TabsTrigger value="summary">Compliance Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overdue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Overdue Reports
                </CardTitle>
                <CardDescription>
                  Reports that are past the 30-day completion threshold
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overdueReports.length > 0 ? (
                  <div className="space-y-4">
                    {overdueReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/10"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-red-900">
                              {report.type.replace('_', ' ')} Report
                            </h3>
                            <p className="text-sm text-destructive">
                              {report.student.fullName} (Grade {report.student.grade})
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="text-xs">
                                {getDaysOverdue(report.createdAt)} days overdue
                              </Badge>
                              {report.specialEducator && (
                                <span className="text-xs text-destructive">
                                  Assigned to: {report.specialEducator.fullName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Link href={`/center/students/${report.student.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View Student
                            </Button>
                          </Link>
                          <Link href={`/center/reports/${report.id}`}>
                            <Button size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              View Report
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No overdue reports</p>
                    <p className="text-sm text-muted-foreground">
                      All reports are being completed on time
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Students</span>
                      <span className="font-semibold">{complianceData.totalStudents}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Students with Reports</span>
                      <span className="font-semibold text-success">{complianceData.studentsWithReports}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Coverage Rate</span>
                      <Badge className={getComplianceColor(complianceData.complianceRate)}>
                        {complianceData.complianceRate}%
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${complianceData.complianceRate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Report Completion Rate</span>
                      <Badge className={getComplianceColor(complianceData.reportCompletionRate)}>
                        {complianceData.reportCompletionRate}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Assessments</span>
                      <span className="font-semibold text-warning">{complianceData.pendingAssessments}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Expired IEP Goals</span>
                      <span className="font-semibold text-destructive">{complianceData.expiredIEPs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Overdue Reports</span>
                      <span className="font-semibold text-destructive">{complianceData.overdueReports}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </PageWrapper>
  );
}
