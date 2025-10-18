'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReports } from '@/hooks/useAssessments';
// Use route-level UnifiedLayout; remove page-level EducatorLayout
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  BarChart3,
  Plus,
  Download,
  Eye,
  Edit,
  FileText,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const REPORT_TYPES = [
  { value: 'INTAKE', label: 'Intake Report', description: 'Comprehensive intake assessment summary' },
  { value: 'ASSESSMENT', label: 'Assessment Report', description: 'Skill domain assessment results' },
  { value: 'IEP', label: 'IEP Report', description: 'Individual Education Plan progress' },
  { value: 'PROGRESS', label: 'Progress Report', description: 'Overall student progress summary' }
];

const REPORT_STATUS_CONFIG = {
  'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: Edit },
  'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'REVIEWED': { color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
};

export const dynamic = 'force-dynamic';

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [newReport, setNewReport] = useState({
    studentId: studentId || '',
    type: '',
    title: '',
    content: '',
    summary: '',
    recommendations: ''
  });

  const { reports, createReport, submitReport, isCreating, isSubmitting } = useReports(studentId || undefined);

  const handleCreateReport = () => {
    createReport(newReport);
    setShowNewReportDialog(false);
    setNewReport({
      studentId: studentId || '',
      type: '',
      title: '',
      content: '',
      summary: '',
      recommendations: ''
    });
  };

  const handleSubmitReport = (reportId: string) => {
    const signature = 'Digital Signature'; // In real app, this would be proper digital signature
    submitReport({ reportId, signature });
  };

  const getStatusIcon = (status: string) => {
    const config = (REPORT_STATUS_CONFIG as any)[status] || REPORT_STATUS_CONFIG['PENDING'];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    return (REPORT_STATUS_CONFIG as any)[status]?.color || REPORT_STATUS_CONFIG['PENDING'].color;
  };

  const filteredReports = reports.filter((report: any) => {
    if (selectedReportType && report.type !== selectedReportType) return false;
    if (filterStatus && report.status !== filterStatus) return false;
    return true;
  });

  const getReportsByStatus = (status: string) => {
    return reports.filter((report: any) => report.status === status);
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/educator/students">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Generate and manage student assessment reports</p>
            </div>
          </div>
          <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={newReport.type} onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Report Title</Label>
                    <Input
                      placeholder="Enter report title..."
                      value={newReport.title}
                      onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="summary">Executive Summary</Label>
                  <Textarea
                    placeholder="Brief overview of key findings and conclusions..."
                    value={newReport.summary}
                    onChange={(e) => setNewReport(prev => ({ ...prev, summary: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content">Report Content</Label>
                  <Textarea
                    placeholder="Detailed report content including assessments, observations, and analysis..."
                    value={newReport.content}
                    onChange={(e) => setNewReport(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Textarea
                    placeholder="Specific recommendations for interventions, strategies, or next steps..."
                    value={newReport.recommendations}
                    onChange={(e) => setNewReport(prev => ({ ...prev, recommendations: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowNewReportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReport} disabled={isCreating}>
                    Generate Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Edit className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getReportsByStatus('IN_PROGRESS').length}</div>
                <p className="text-xs text-muted-foreground">Being drafted</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getReportsByStatus('COMPLETED').length}</div>
                <p className="text-xs text-muted-foreground">Ready for review</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.filter((r: any) => {
                    const reportDate = new Date(r.createdAt);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Generated recently</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Reports List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports List
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {REPORT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-500 mb-4">
                  {reports.length === 0 
                    ? "Start by generating your first report"
                    : "Try adjusting your filter criteria"
                  }
                </p>
                <Button onClick={() => setShowNewReportDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate First Report
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report: any, index: number) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{report.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                        
                        {report.summary && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {report.summary}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                          {report.submittedAt && (
                            <span>Submitted: {new Date(report.submittedAt).toLocaleDateString()}</span>
                          )}
                          {report.reviewedAt && (
                            <span>Reviewed: {new Date(report.reviewedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        {report.status === 'COMPLETED' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitReport(report.id)}
                            disabled={isSubmitting}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {report.status === 'PENDING' || report.status === 'IN_PROGRESS' ? (
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Report Templates</CardTitle>
            <p className="text-sm text-gray-600">Quick start templates for common report types</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {REPORT_TYPES.map((template) => (
                <motion.div
                  key={template.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setNewReport(prev => ({ 
                        ...prev, 
                        type: template.value,
                        title: `${template.label} - ${new Date().toLocaleDateString()}`
                      }));
                      setShowNewReportDialog(true);
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <h3 className="font-medium text-sm mb-1">{template.label}</h3>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    </div>}>
      <ReportsPageContent />
    </Suspense>
  );
}
