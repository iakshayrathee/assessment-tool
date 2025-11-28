'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReports } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useEducator';
import ReactDOMServer from 'react-dom/server';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download,
  Eye,
  BarChart3, 
  FileText,
  Send,
  Brain,
  CheckCircle,
  Loader2,
  Users,
  FileDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';

const REPORT_TYPES = [
  { value: 'AI_COMPREHENSIVE', label: 'AI Comprehensive Report', description: 'AI-generated comprehensive progress analysis' }
];



export const dynamic = 'force-dynamic';

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId');
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId || '');



  // Modals & AI Preview
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch students
  const { students, isLoading: isLoadingStudents } = useEducatorStudents();
  
  // PDF download ref
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch reports for selected student
  const { reports, submitReport, isSubmitting, refetch } = useReports(selectedStudent || undefined);

  // Get selected student details
  const selectedStudentObj = students?.find(s => s.id === selectedStudent);
  const selectedStudentName = selectedStudentObj?.fullName || selectedStudentObj?.name || 'Selected Student';
  const selectedStudentGrade = selectedStudentObj?.grade || '';

  // Sync URL with selected student
  useEffect(() => {
    if (selectedStudent && selectedStudent !== studentId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('studentId', selectedStudent);
      router.replace(`/educator/reports?${params.toString()}`);
    }
  }, [selectedStudent, studentId, searchParams, router]);

  // Handlers
  const handleSubmitReport = async (reportId: string) => {
    try {
      const signature = 'Digital Signature';
      await submitReport({ reportId, signature });
      toast.success('Report submitted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  const handleGenerateAIReport = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }

    console.log('Generating AI report for student:', selectedStudent);
    setIsGeneratingAI(true);
    try {
      const result = await apiClient.generateAIReport(selectedStudent);
      console.log('AI report generation successful:', result);

      // Show the generated report in modal for preview and save
      setAiPreview(result);
      setShowAIPreview(true);

      toast.success('AI report generated successfully');
    } catch (error: any) {
      console.error('Failed to generate AI report:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to generate AI report');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handlePreviewAIReport = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const preview = await apiClient.previewAIReport(selectedStudent);
      console.log('AI preview response:', preview);
      setAiPreview(preview);
      setShowAIPreview(true);
    } catch (error: any) {
      console.error('Failed to preview AI report:', error);
      toast.error(error.response?.data?.error || 'Failed to preview AI report');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const createReport = async (aiData: any) => {
    try {
      // The AI report is already saved during generation, so we just need to refetch
      await refetch();
      toast.success('AI report saved successfully');
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to save report');
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !aiPreview) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = reportRef.current;
      const opt = {
        margin: 10,
        filename: `${selectedStudentName.replace(/\s+/g, '-').toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
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

  const downloadReportPDF = async (report: any) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const ReportComponent = (
        <div style={{ 
          fontFamily: 'Arial, sans-serif', 
          fontSize: '14px', 
          lineHeight: '1.8', 
          color: '#2d3748',
          padding: '0',
          margin: '0'
        }}>
          {/* Report Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '2rem',
            borderRadius: '8px 8px 0 0',
            marginBottom: '2rem'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              {report.title}
            </h1>
            <p style={{ 
              fontSize: '16px',
              textAlign: 'center',
              opacity: '0.9'
            }}>
              {REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}
            </p>
          </div>

          {/* Student & Educator Information */}
          <div style={{ 
            padding: '0 2rem 2rem 2rem'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '2rem', 
              marginBottom: '2rem',
              background: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#4a5568',
                  marginBottom: '1rem',
                  borderBottom: '2px solid #667eea',
                  paddingBottom: '0.5rem'
                }}>
                  Student Information
                </h3>
                <p style={{ margin: '0.5rem 0' }}><strong>Name:</strong> {selectedStudentName}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Grade:</strong> Grade {selectedStudentGrade}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Report Date:</strong> {new Date(report.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#4a5568',
                  marginBottom: '1rem',
                  borderBottom: '2px solid #667eea',
                  paddingBottom: '0.5rem'
                }}>
                  Report Information
                </h3>
                <p style={{ margin: '0.5rem 0' }}><strong>Report ID:</strong> {report.id.slice(0, 8)}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Report Type:</strong> {REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}</p>
              </div>
            </div>

            {/* Executive Summary Section */}
            {report.summary && (
              <div style={{ 
                marginBottom: '2rem',
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#2d3748', 
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid #4299e1'
                }}>
                  📋 Executive Summary
                </h2>
                <div style={{ 
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#4a5568'
                }} dangerouslySetInnerHTML={{ 
                  __html: report.summary
                    .replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: #2d3748;">$1</strong>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2d3748;">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em style="color: #4a5568;">$1</em>')
                    .replace(/\n/g, '<br />')
                    .replace(/^#\s+(.*)$/gm, '<h3 style="font-size: 18px; font-weight: bold; color: #2d3748; margin: 1rem 0 0.5rem 0;">$1</h3>')
                    .replace(/^##\s+(.*)$/gm, '<h4 style="font-size: 16px; font-weight: bold; color: #4a5568; margin: 0.8rem 0 0.4rem 0;">$1</h4>')
                    .replace(/^-\s+(.*)$/gm, '<li style="margin: 0.3rem 0; padding-left: 1rem;">• $1</li>')
                }} />
              </div>
            )}

            {/* Recommendations Section */}
            {report.recommendations && (
              <div style={{ 
                marginBottom: '2rem',
                background: '#f0fff4',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #c6f6d5',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#2d3748', 
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid #48bb78'
                }}>
                  💡 Recommendations & Next Steps
                </h2>
                <div style={{ 
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#2f855a'
                }} dangerouslySetInnerHTML={{ 
                  __html: report.recommendations
                    .replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: #2d3748;">$1</strong>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2d3748;">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em style="color: #2f855a;">$1</em>')
                    .replace(/\n/g, '<br />')
                    .replace(/^#\s+(.*)$/gm, '<h3 style="font-size: 18px; font-weight: bold; color: #2d3748; margin: 1rem 0 0.5rem 0;">$1</h3>')
                    .replace(/^##\s+(.*)$/gm, '<h4 style="font-size: 16px; font-weight: bold; color: #2f855a; margin: 0.8rem 0 0.4rem 0;">$1</h4>')
                    .replace(/^-\s+(.*)$/gm, '<li style="margin: 0.3rem 0; padding-left: 1rem;">• $1</li>')
                }} />
              </div>
            )}

            {/* Detailed Analysis Section */}
            {report.content && (
              <div style={{ 
                background: '#fff5f5',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #fed7d7',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#2d3748', 
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid #f56565'
                }}>
                  🔍 Detailed Analysis
                </h2>
                <div style={{ 
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#c53030'
                }} dangerouslySetInnerHTML={{ 
                  __html: report.content
                    .replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: #2d3748;">$1</strong>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2d3748;">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em style="color: #c53030;">$1</em>')
                    .replace(/\n/g, '<br />')
                    .replace(/^#\s+(.*)$/gm, '<h3 style="font-size: 18px; font-weight: bold; color: #2d3748; margin: 1rem 0 0.5rem 0;">$1</h3>')
                    .replace(/^##\s+(.*)$/gm, '<h4 style="font-size: 16px; font-weight: bold; color: #c53030; margin: 0.8rem 0 0.4rem 0;">$1</h4>')
                    .replace(/^-\s+(.*)$/gm, '<li style="margin: 0.3rem 0; padding-left: 1rem;">• $1</li>')
                }} />
              </div>
            )}

            {/* Report Footer */}
            <div style={{ 
              marginTop: '2rem',
              padding: '1rem',
              background: '#edf2f7',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#718096',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: '0.25rem 0' }}>
                Report generated on {new Date(report.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>
                Confidential - For educational purposes only
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '11px' }}>
                © {new Date().getFullYear()} Knowled Assessment Platform
              </p>
            </div>
          </div>
        </div>
      );

      const html = ReactDOMServer.renderToStaticMarkup(ReportComponent);

      const opt = {
        margin: 15,
        filename: `${selectedStudentName.replace(/\s+/g, '-').toLowerCase()}-${new Date(report.createdAt).toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };

      html2pdf().from(html).set(opt).save();
      toast.success('Report PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download report PDF:', error);
      toast.error('Failed to download report PDF');
    }
  };

  const filteredReports = reports || [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // Empty state when no students
  if (!isLoadingStudents && students?.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Available</h3>
            <p className="text-gray-500 mb-4">You don't have any assigned students yet.</p>
            <Link href="/educator/students">
              <Button>View Students</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and manage student assessment reports</p>
        </div>

        {/* Student Selection & AI Buttons */}
        <div className="flex flex-wrap items-end gap-3">
          {selectedStudent ? (
            <div className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 min-w-[250px]">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-900 text-sm truncate">
                  {selectedStudentName || 'Selected Student'}
                </p>
                <p className="text-xs text-blue-700">
                  Grade {selectedStudentGrade || 'N/A'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStudentModal(true)}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Change student"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowStudentModal(true)}
              className="flex items-center gap-2 px-4 py-2 min-w-[140px]"
            >
              <Users className="h-4 w-4" />
              Select Student
            </Button>
          )}

          <Button
            onClick={handleGenerateAIReport}
            disabled={isGeneratingAI || !selectedStudent}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reports List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentReports.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">
                {reports?.length === 0
                  ? "Start by generating your first AI report"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentReports.map((report: any, index: number) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                      {report.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{report.summary}</p>
                      )}
                      <div className="text-sm text-gray-500">
                        Created: {new Date(report.createdAt).toLocaleDateString()}
                        {report.submittedAt && ` • Submitted: ${new Date(report.submittedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadReportPDF(report)}>
                        <Download className="h-4 w-4 mr-1" /> PDF
                      </Button>
                      {report.status === 'COMPLETED' && (
                        <Button size="sm" onClick={() => handleSubmitReport(report.id)} disabled={isSubmitting}>
                          <Send className="h-4 w-4 mr-1" /> Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {filteredReports.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <span className="px-2 text-sm text-gray-500">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Preview Dialog */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Generated Report Preview
            </DialogTitle>
          </DialogHeader>
          {aiPreview && (
            <div className="space-y-6 mt-4">
              {/* Report Header with Student & Educator Details */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-2xl text-blue-900 mb-2">
                      {aiPreview.title || 'Student Progress Report'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      AI-generated comprehensive analysis based on assessments, goals, and progress data.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Student:</span>
                      <span className="text-gray-900">{selectedStudentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Grade:</span>
                      <span className="text-gray-900">Grade {selectedStudentGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Date:</span>
                      <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Report Type:</span>
                      <span className="text-gray-900">AI Comprehensive Analysis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Content with Improved Formatting */}
              <div ref={reportRef} className="space-y-6">
                {aiPreview.summary && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-lg text-blue-800 mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Executive Summary
                    </h4>
                    <div className="prose prose-blue max-w-none">
                      <div 
                        className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base"
                        dangerouslySetInnerHTML={{
                          __html: aiPreview.summary
                            .replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                    </div>
                  </div>
                )}

                {aiPreview.recommendations && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-lg text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Recommendations & Next Steps
                    </h4>
                    <div className="prose prose-green max-w-none">
                      <div 
                        className="whitespace-pre-wrap text-green-900 leading-relaxed text-base"
                        dangerouslySetInnerHTML={{
                          __html: aiPreview.recommendations
                            .replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                    </div>
                  </div>
                )}

                {aiPreview.content && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Detailed Analysis
                    </h4>
                    <div className="prose prose-gray max-w-none">
                      <div 
                        className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base"
                        dangerouslySetInnerHTML={{
                          __html: aiPreview.content
                            .replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^#\s+(.*)$/gm, '<h4 class="text-xl font-semibold mt-6 mb-3 text-blue-800">$1</h4>')
                            .replace(/^##\s+(.*)$/gm, '<h5 class="text-lg font-medium mt-4 mb-2 text-gray-800">$1</h5>')
                            .replace(/^-\s+(.*)$/gm, '<li class="ml-4 mb-1">$1</li>')
                            .replace(/\n\n/g, '</div><div class="mt-4">')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Report Footer */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-xs text-gray-500">
                  <p>This report was generated using AI analysis on {new Date().toLocaleDateString()}</p>
                  <p>Confidential - For educational purposes only</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4" />
                  AI-Generated Report
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAIPreview(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={downloadPDF}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => {
                      createReport(aiPreview);
                      setShowAIPreview(false);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Save as Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Selection Modal */}
      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={(id) => {
          setSelectedStudent(id);
          setShowStudentModal(false);
        }}
        selectedStudentId={selectedStudent}
      />

      {/* Report View Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {selectedReport?.title || 'Report Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 mt-4">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-2xl text-blue-900 mb-2">
                      {selectedReport.title}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {REPORT_TYPES.find(t => t.value === selectedReport.type)?.label || selectedReport.type}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Student:</span>
                      <span className="text-gray-900">{selectedStudentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Grade:</span>
                      <span className="text-gray-900">Grade {selectedStudentGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Date:</span>
                      <span className="text-gray-900">
                        {new Date(selectedReport.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Report Content */}
              {selectedReport.summary && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-lg text-blue-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Executive Summary
                  </h4>
                  <div className="prose prose-blue max-w-none">
                    <div 
                      className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base"
                      dangerouslySetInnerHTML={{
                        __html: selectedReport.summary
                          .replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedReport.recommendations && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-lg text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recommendations & Next Steps
                  </h4>
                  <div className="prose prose-green max-w-none">
                    <div 
                      className="whitespace-pre-wrap text-green-900 leading-relaxed text-base"
                      dangerouslySetInnerHTML={{
                        __html: selectedReport.recommendations
                          .replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedReport.content && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detailed Analysis
                  </h4>
                  <div className="prose prose-gray max-w-none">
                    <div 
                      className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base"
                      dangerouslySetInnerHTML={{
                        __html: selectedReport.content
                          .replace(/<strong>(.*?)<\/strong>/g, '<strong>$1</strong>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/^#\s+(.*)$/gm, '<h4 class="text-xl font-semibold mt-6 mb-3 text-blue-800">$1</h4>')
                          .replace(/^##\s+(.*)$/gm, '<h5 class="text-lg font-medium mt-4 mb-2 text-gray-800">$1</h5>')
                          .replace(/^-\s+(.*)$/gm, '<li class="ml-4 mb-1">$1</li>')
                          .replace(/\n\n/g, '</div><div class="mt-4">')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Created: {new Date(selectedReport.createdAt).toLocaleDateString()}
                  {selectedReport.submittedAt && 
                    ` • Submitted: ${new Date(selectedReport.submittedAt).toLocaleDateString()}`
                  }
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowReportModal(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => downloadReportPDF(selectedReport)}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReportsPage() {
  return (

    <ReportsPageContent />

  );
}