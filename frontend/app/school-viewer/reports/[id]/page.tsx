'use client';

import { useParams } from 'next/navigation';
import { useSchoolViewerReport } from '@/hooks/useSchoolViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Download,
  AlertCircle,
  Loader2,
  BookOpen,
  Target,
  TrendingUp,
  ClipboardList,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import toast from 'react-hot-toast';
import { safeMarkdownToHtml } from '@/lib/markdown';

interface ReportDetails {
  id: string;
  type: string;
  status: string;
  title: string;
  content: string;
  summary?: string;
  recommendations?: string;
  educatorSignature?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    fullName: string;
    dateOfBirth: string;
    grade: string;
    gender: string;
  };
  specialEducator: {
    id: string;
    fullName: string;
    specialEdQualification?: string;
  };
  superSpecialEducator?: {
    id: string;
    fullName: string;
    specialEdQualification?: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const { report, isLoading, error, refetch } = useSchoolViewerReport(reportId);
  const reportRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading report details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Report</h3>
        <p className="text-gray-600 mb-4">Unable to load report details. Please try again.</p>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report Not Found</h3>
        <p className="text-gray-600">The requested report could not be found.</p>
      </div>
    );
  }

  const reportData = report as ReportDetails;

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = reportRef.current;
      const opt = {
        margin: 10,
        filename: `${reportData.student.fullName.replace(/\\s+/g, '-').toLowerCase()}-${reportData.type.toLowerCase()}-report-${new Date(reportData.createdAt).toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'intake':
        return ClipboardList;
      case 'assessment':
        return BookOpen;
      case 'iep':
        return Target;
      case 'progress':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'intake':
        return 'text-blue-600 bg-blue-50';
      case 'assessment':
        return 'text-purple-600 bg-purple-50';
      case 'iep':
        return 'text-green-600 bg-green-50';
      case 'progress':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const TypeIcon = getTypeIcon(reportData.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/school-viewer/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(reportData.type)}`}>
              <TypeIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{reportData.title}</h1>
              <p className="text-gray-600">{formatType(reportData.type)} Report</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(reportData.status)}>
            {formatStatus(reportData.status)}
          </Badge>
          {(reportData.status === 'COMPLETED' || reportData.status === 'REVIEWED') && (
            <Button variant="outline" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Report Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{reportData.student.fullName}</p>
              <p className="text-sm text-gray-600">Grade {reportData.student.grade}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(reportData.student.dateOfBirth), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Gender</p>
                <p className="text-sm text-gray-600">{reportData.student.gender}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Information */}
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(reportData.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            {reportData.submittedAt && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(reportData.submittedAt), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
            {reportData.reviewedAt && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Reviewed</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(reportData.reviewedAt), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(reportData.updatedAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Educator Information */}
        <Card>
          <CardHeader>
            <CardTitle>Educator Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <User className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="font-medium text-indigo-900">
                    {reportData.specialEducator.fullName}
                  </p>
                  <p className="text-sm text-indigo-700">Special Educator</p>
                </div>
              </div>
              {reportData.specialEducator.specialEdQualification && (
                <p className="text-sm text-indigo-600">
                  {reportData.specialEducator.specialEdQualification}
                </p>
              )}
            </div>

            {reportData.superSpecialEducator && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      {reportData.superSpecialEducator.fullName}
                    </p>
                    <p className="text-sm text-green-700">Reviewed by</p>
                  </div>
                </div>
                {reportData.superSpecialEducator.specialEdQualification && (
                  <p className="text-sm text-green-600">
                    {reportData.superSpecialEducator.specialEdQualification}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="grid grid-cols-1 gap-6">
        {/* Summary */}
        {reportData.summary && (
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>Key findings and overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{reportData.summary}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Report Content</CardTitle>
            <CardDescription>Detailed assessment and findings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div 
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: safeMarkdownToHtml(reportData.content) }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {reportData.recommendations && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Suggested interventions and next steps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{reportData.recommendations}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature */}
        {reportData.educatorSignature && (
          <Card>
            <CardHeader>
              <CardTitle>Educator Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Digitally signed by:</p>
                <p className="font-medium text-gray-900">{reportData.educatorSignature}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Signed on {format(new Date(reportData.submittedAt || reportData.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          Report ID: {reportData.id}
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/school-viewer/students/${reportData.student.id}`}>
            <Button variant="outline">
              View Student Profile
            </Button>
          </Link>
          {(reportData.status === 'COMPLETED' || reportData.status === 'REVIEWED') && (
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
