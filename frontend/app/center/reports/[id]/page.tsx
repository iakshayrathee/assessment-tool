'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  User,
  Users,
  Calendar,
  Clock,
  Download,
  ArrowLeft,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  School,
  GraduationCap,
  Target,
  BookOpen,
  FileBarChart,
  Activity,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface ReportDetail {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  content?: any;
  student: {
    id: string;
    fullName: string;
    grade: string;
    age: number;
    dateOfBirth: string;
    school?: {
      id: string;
      name: string;
    };
  };
  specialEducator?: {
    id: string;
    fullName: string;
    email: string;
  };
  superSpecialEducator?: {
    id: string;
    fullName: string;
    email: string;
  };
  assessmentData?: {
    domains: Array<{
      name: string;
      score: number;
      maxScore: number;
      percentage: number;
    }>;
    overallScore: number;
    recommendations: string[];
  };
  iepData?: {
    goals: Array<{
      id: string;
      goal: string;
      progressPercent: number;
      status: string;
      targetDate: string;
    }>;
    accommodations: string[];
    modifications: string[];
  };
  progressData?: {
    period: string;
    achievements: string[];
    challenges: string[];
    nextSteps: string[];
    parentFeedback?: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportId = params.id as string;

  useEffect(() => {
    loadReportDetail();
  }, [reportId]);

  const loadReportDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const reportData = await apiClient.getReport(reportId);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to load report detail:', error);
      setError('Failed to load report details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      // Implement PDF download functionality
      const response = await apiClient.downloadReport(reportId);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report?.type}_Report_${report?.student.fullName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Report downloaded successfully.",
      });
    } catch (error) {
      console.error('Failed to download report:', error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSESSMENT': return 'bg-blue-100 text-blue-800';
      case 'IEP': return 'bg-purple-100 text-purple-800';
      case 'PROGRESS': return 'bg-green-100 text-green-800';
      case 'INTAKE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAssessmentContent = () => {
    if (!report?.assessmentData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">
                  {report.assessmentData.overallScore}%
                </div>
                <p className="text-muted-foreground">Overall Assessment Score</p>
              </div>
              
              <div className="space-y-3">
                {report.assessmentData.domains.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">{domain.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${domain.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {domain.score}/{domain.maxScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {report.assessmentData.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.assessmentData.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderIEPContent = () => {
    if (!report?.iepData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              IEP Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.iepData.goals.map((goal) => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{goal.goal}</h3>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{goal.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Accommodations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.iepData.accommodations.map((acc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{acc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.iepData.modifications.map((mod, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{mod}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderProgressContent = () => {
    if (!report?.progressData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Report - {report.progressData.period}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-600 mb-3">Achievements</h3>
                <ul className="space-y-2">
                  {report.progressData.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-orange-600 mb-3">Challenges</h3>
                <ul className="space-y-2">
                  {report.progressData.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.progressData.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {report.progressData.parentFeedback && (
          <Card>
            <CardHeader>
              <CardTitle>Parent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm bg-muted/30 p-4 rounded-lg">
                {report.progressData.parentFeedback}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Report not found'}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={loadReportDetail}>
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title={`${report.type.replace('_', ' ')} Report`}
        description={`${report.student.fullName} • Grade ${report.student.grade} • Generated on ${new Date(report.createdAt).toLocaleDateString()}`}
        badge={{
          text: report.status,
          variant: report.status === 'COMPLETED' ? 'default' : 'secondary'
        }}
        actions={[
          {
            label: 'Back to Reports',
            href: '/center/reports',
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: 'Download PDF',
            onClick: handleDownloadReport,
            icon: Download,
            disabled: downloading || report.status !== 'COMPLETED'
          }
        ]}
      />

      {/* Report Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="font-medium">{report.student.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Grade</label>
              <p className="font-medium">{report.student.grade}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Age</label>
              <p className="font-medium">{report.student.age} years</p>
            </div>
            {report.student.school && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">School</label>
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{report.student.school.name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="mt-1">
                <Badge className={getTypeColor(report.type)}>
                  {report.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge className={getStatusColor(report.status)}>
                  {report.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{new Date(report.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Generated By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.specialEducator && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Special Educator</label>
                <div className="mt-1">
                  <p className="font-medium">{report.specialEducator.fullName}</p>
                  <p className="text-sm text-muted-foreground">{report.specialEducator.email}</p>
                </div>
              </div>
            )}
            
            {report.superSpecialEducator && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Super Special Educator</label>
                <div className="mt-1">
                  <p className="font-medium">{report.superSpecialEducator.fullName}</p>
                  <p className="text-sm text-muted-foreground">{report.superSpecialEducator.email}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link href={`/center/students/${report.student.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-3 w-3 mr-1" />
                  View Student Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5" />
              Report Content
            </CardTitle>
            <CardDescription>
              Detailed {report.type.toLowerCase().replace('_', ' ')} information and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.type === 'ASSESSMENT' && renderAssessmentContent()}
            {report.type === 'IEP' && renderIEPContent()}
            {report.type === 'PROGRESS' && renderProgressContent()}
            
            {!['ASSESSMENT', 'IEP', 'PROGRESS'].includes(report.type) && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Report content not available</p>
                <p className="text-sm text-muted-foreground">
                  This report type doesn't have detailed content view yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end gap-4"
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        
        {report.status === 'COMPLETED' && (
          <Button onClick={handleDownloadReport} disabled={downloading}>
            {downloading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
