'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReports } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useEducator';
import { apiClient } from '@/lib/api';
import { markdownToHtml, markdownToHtmlForPdf, parseReportSections, ASSESSMENT_SECTIONS, LESSON_PLAN_SECTIONS, PDF_SECTION_COLORS } from '@/lib/reportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download, Eye, BarChart3, FileText, Send, Brain, CheckCircle,
  Loader2, Users, FileDown, Plus, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';

const REPORT_TYPES = [
  { value: 'ASSESSMENT', label: 'Assessment Report', description: 'AI-generated report based on assessment data and intake form' },
  { value: 'LESSON_PLAN', label: 'Lesson Plan Report', description: 'AI-generated report based on lesson plans with teacher observations' }
];

export const dynamic = 'force-dynamic';

/** Renders markdown content as formatted HTML */
function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm max-w-none leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}

/** Renders a single report section with color-coded card */
function ReportSection({ title, content, bgClass, borderClass, titleClass }: {
  title: string; content: string; bgClass: string; borderClass: string; titleClass: string;
}) {
  if (!content || content === 'N/A') return null;
  return (
    <div className={`${bgClass} border ${borderClass} rounded-lg p-5`}>
      <h4 className={`font-semibold text-lg ${titleClass} mb-3 pb-2 border-b ${borderClass}`}>
        {title}
      </h4>
      <MarkdownContent content={content} className="text-gray-800" />
    </div>
  );
}

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId');
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId || '');
  const [selectedReportType, setSelectedReportType] = useState<'ASSESSMENT' | 'LESSON_PLAN'>('ASSESSMENT');

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

  // Fetch reports for selected student
  const { reports, submitReport, isSubmitting, refetch } = useReports(selectedStudent || undefined);

  // Auto-generate AI report when student selected and no reports exist
  const autoGenerateTriggeredRef = useRef<string | null>(null);

  // Get selected student details
  const selectedStudentObj = students?.find(s => s.id === selectedStudent);
  const selectedStudentName = selectedStudentObj?.fullName || selectedStudentObj?.name || 'Selected Student';
  const selectedStudentGrade = selectedStudentObj?.grade || '';

  // Auto-trigger AI report generation when student is selected and has no reports
  useEffect(() => {
    if (
      selectedStudent &&
      !isLoadingStudents &&
      reports !== undefined &&
      reports?.length === 0 &&
      !isGeneratingAI &&
      autoGenerateTriggeredRef.current !== selectedStudent
    ) {
      autoGenerateTriggeredRef.current = selectedStudent;
      // Auto-trigger report generation
      (async () => {
        setIsGeneratingAI(true);
        try {
          const result = await apiClient.generateAIReport(selectedStudent, selectedReportType);
          setAiPreview(result);
          setShowAIPreview(true);
          toast.success('AI report auto-generated for review');
          refetch();
        } catch (error: any) {
          // Silent fail for auto-generation — user can still manually trigger
          console.error('Auto-generation failed:', error);
        } finally {
          setIsGeneratingAI(false);
        }
      })();
    }
  }, [selectedStudent, reports, isLoadingStudents, isGeneratingAI, selectedReportType, refetch]);

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
    setIsGeneratingAI(true);
    try {
      const result = await apiClient.generateAIReport(selectedStudent, selectedReportType);
      setAiPreview(result);
      setShowAIPreview(true);
      toast.success('AI report generated successfully');
      refetch();
    } catch (error: any) {
      console.error('Failed to generate AI report:', error);
      toast.error(error.response?.data?.error || 'Failed to generate AI report');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  /** Generates PDF HTML for a report */
  const buildPdfHtml = (report: any) => {
    const sections = parseReportSections(report.content || '');
    const reportDate = new Date(report.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    let sectionsHtml = '';
    sections.forEach((section, i) => {
      const colors = PDF_SECTION_COLORS[String(i)] || PDF_SECTION_COLORS['7'];
      sectionsHtml += `
        <div style="background:${colors.bg};border:1px solid ${colors.border};border-radius:8px;padding:20px;margin-bottom:16px;page-break-inside:avoid;">
          <h3 style="font-size:16px;font-weight:bold;color:${colors.title};margin:0 0 12px 0;padding-bottom:8px;border-bottom:1px solid ${colors.border};">
            ${section.heading}
          </h3>
          <div style="font-size:14px;line-height:1.8;color:#374151;">
            ${markdownToHtmlForPdf(section.body)}
          </div>
        </div>`;
    });

    // Fallback if no sections parsed
    if (!sectionsHtml && report.content) {
      sectionsHtml = `<div style="font-size:14px;line-height:1.8;color:#374151;">${markdownToHtmlForPdf(report.content)}</div>`;
    }

    return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.6;color:#2d3748;padding:0;margin:0;">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:8px 8px 0 0;margin-bottom:24px;text-align:center;">
          <h1 style="font-size:26px;font-weight:bold;margin:0 0 8px 0;">${report.title || 'Student Report'}</h1>
          <p style="font-size:14px;opacity:0.9;margin:0;">
            ${REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}
          </p>
        </div>
        <div style="padding:0 20px 20px 20px;">
          <div style="display:flex;gap:24px;margin-bottom:24px;background:#f8fafc;padding:20px;border-radius:8px;border:1px solid #e2e8f0;">
            <div style="flex:1;">
              <h4 style="font-size:14px;font-weight:bold;color:#4a5568;margin:0 0 10px 0;border-bottom:2px solid #667eea;padding-bottom:6px;">Student Information</h4>
              <p style="margin:4px 0;font-size:13px;"><strong>Name:</strong> ${selectedStudentName}</p>
              <p style="margin:4px 0;font-size:13px;"><strong>Grade:</strong> Grade ${selectedStudentGrade}</p>
              <p style="margin:4px 0;font-size:13px;"><strong>Report Date:</strong> ${reportDate}</p>
            </div>
            <div style="flex:1;">
              <h4 style="font-size:14px;font-weight:bold;color:#4a5568;margin:0 0 10px 0;border-bottom:2px solid #667eea;padding-bottom:6px;">Report Details</h4>
              <p style="margin:4px 0;font-size:13px;"><strong>Type:</strong> ${REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}</p>
              <p style="margin:4px 0;font-size:13px;"><strong>Status:</strong> ${report.status}</p>
              <p style="margin:4px 0;font-size:13px;"><strong>ID:</strong> ${report.id?.slice(0, 8) || 'N/A'}</p>
            </div>
          </div>
          ${sectionsHtml}
          <div style="margin-top:24px;padding:16px;background:#edf2f7;border-radius:8px;text-align:center;font-size:11px;color:#718096;border:1px solid #e2e8f0;">
            <p style="margin:2px 0;">Report generated on ${reportDate}</p>
            <p style="margin:2px 0;font-weight:bold;">Confidential - For educational purposes only</p>
            <p style="margin:2px 0;">© ${new Date().getFullYear()} Knowled Assessment Platform</p>
          </div>
        </div>
      </div>`;
  };

  const downloadReportPDF = async (report: any) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const html = buildPdfHtml(report);
      const opt = {
        margin: 12,
        filename: `${selectedStudentName.replace(/\s+/g, '-').toLowerCase()}-${report.type?.toLowerCase()}-${new Date(report.createdAt).toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      };
      html2pdf().from(html).set(opt).save();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const filteredReports = reports || [];
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // Get section config based on report type
  const getSectionConfig = (reportType: string) =>
    reportType === 'LESSON_PLAN' ? LESSON_PLAN_SECTIONS : ASSESSMENT_SECTIONS;

  // Empty state
  if (!isLoadingStudents && students?.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Available</h3>
            <p className="text-gray-500 mb-4">You don't have any assigned students yet.</p>
            <Link href="/educator/students"><Button>View Students</Button></Link>
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
        <div className="flex flex-wrap items-end gap-3">
          {selectedStudent ? (
            <div className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 min-w-[250px]">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-blue-900 text-sm truncate">{selectedStudentName}</p>
                <p className="text-xs text-blue-700">Grade {selectedStudentGrade || 'N/A'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowStudentModal(true)} className="h-8 w-8 p-0 flex-shrink-0" title="Change student">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowStudentModal(true)} className="flex items-center gap-2 px-4 py-2 min-w-[140px]">
              <Users className="h-4 w-4" /> Select Student
            </Button>
          )}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-gray-600">Report Type</Label>
            <Select value={selectedReportType} onValueChange={(v: 'ASSESSMENT' | 'LESSON_PLAN') => setSelectedReportType(v)}>
              <SelectTrigger className="w-[280px] min-w-0 h-[60px] overflow-hidden">
                <SelectValue placeholder="Select report type" className="truncate" />
              </SelectTrigger>
              <SelectContent className="min-w-[280px] max-w-sm">
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-gray-500 break-words whitespace-normal">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateAIReport} disabled={isGeneratingAI || !selectedStudent}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700">
            {isGeneratingAI ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>) : (<><Brain className="h-4 w-4 mr-2" />Generate AI Report</>)}
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Reports List</CardTitle>
        </CardHeader>
        <CardContent>
          {currentReports.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">{reports?.length === 0 ? "Start by generating your first AI report" : "Try adjusting your filters"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentReports.map((report: any, index: number) => (
                <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {REPORT_TYPES.find(t => t.value === report.type)?.label || report.type}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                      {report.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{report.summary.substring(0, 200)}...</p>
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

          {/* Pagination */}
          {filteredReports.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                    <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} size="sm"
                      onClick={() => setCurrentPage(i + 1)} className="h-8 w-8 p-0">{i + 1}</Button>
                  ))}
                  {totalPages > 5 && <span className="px-2 text-sm text-gray-500">...</span>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
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
            <div className="space-y-4 mt-4">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-2xl text-blue-900 mb-2">{aiPreview.title || 'Student Report'}</h3>
                    <p className="text-sm text-blue-700">AI-generated comprehensive analysis</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Student:</span><span className="text-gray-900">{selectedStudentName}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Grade:</span><span className="text-gray-900">Grade {selectedStudentGrade}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Date:</span><span className="text-gray-900">{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Type:</span><span className="text-gray-900">{REPORT_TYPES.find(t => t.value === aiPreview.type)?.label || aiPreview.type}</span></div>
                  </div>
                </div>
              </div>

              {/* Parsed Sections */}
              {(() => {
                const sections = parseReportSections(aiPreview.content || '');
                const sectionConfig = getSectionConfig(aiPreview.type || selectedReportType);
                if (sections.length > 0) {
                  return sections.map((section, i) => {
                    const config = sectionConfig[i] || sectionConfig[sectionConfig.length - 1];
                    return (
                      <ReportSection
                        key={i}
                        title={config.title}
                        content={section.body}
                        bgClass={config.bgClass}
                        borderClass={config.borderClass}
                        titleClass={config.titleClass}
                      />
                    );
                  });
                }
                // Fallback: render content as a single block
                return aiPreview.content && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <MarkdownContent content={aiPreview.content} />
                  </div>
                );
              })()}

              {/* Footer & Actions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-xs text-gray-500">
                <p>This report was generated using AI analysis on {new Date().toLocaleDateString()}</p>
                <p>Confidential - For educational purposes only</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4" /> AI-Generated Report
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAIPreview(false)}>Close</Button>
                  <Button onClick={() => downloadReportPDF(aiPreview)} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                    <FileDown className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button onClick={() => { refetch(); setShowAIPreview(false); toast.success('Report saved'); }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Save as Report
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
        onSelect={(id) => { setSelectedStudent(id); setShowStudentModal(false); }}
        selectedStudentId={selectedStudent}
      />

      {/* Report View Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {selectedReport?.title || 'Report Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 mt-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-xl text-blue-900 mb-2">{selectedReport.title}</h3>
                    <p className="text-sm text-blue-700">{REPORT_TYPES.find(t => t.value === selectedReport.type)?.label || selectedReport.type}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Student:</span><span>{selectedStudentName}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Grade:</span><span>Grade {selectedStudentGrade}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Date:</span><span>{new Date(selectedReport.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Parsed Content Sections */}
              {(() => {
                const sections = parseReportSections(selectedReport.content || '');
                const sectionConfig = getSectionConfig(selectedReport.type || 'ASSESSMENT');
                if (sections.length > 0) {
                  return sections.map((section, i) => {
                    const config = sectionConfig[i] || sectionConfig[sectionConfig.length - 1];
                    return (
                      <ReportSection
                        key={i}
                        title={config.title}
                        content={section.body}
                        bgClass={config.bgClass}
                        borderClass={config.borderClass}
                        titleClass={config.titleClass}
                      />
                    );
                  });
                }
                // Fallback: show summary/recommendations/content as before
                return (
                  <>
                    {selectedReport.summary && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                        <h4 className="font-semibold text-lg text-blue-800 mb-3">📋 Executive Summary</h4>
                        <MarkdownContent content={selectedReport.summary} />
                      </div>
                    )}
                    {selectedReport.recommendations && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <h4 className="font-semibold text-lg text-green-800 mb-3">💡 Recommendations</h4>
                        <MarkdownContent content={selectedReport.recommendations} />
                      </div>
                    )}
                    {selectedReport.content && (
                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <h4 className="font-semibold text-lg text-gray-800 mb-3">🔍 Full Report</h4>
                        <MarkdownContent content={selectedReport.content} />
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Created: {new Date(selectedReport.createdAt).toLocaleDateString()}
                  {selectedReport.submittedAt && ` • Submitted: ${new Date(selectedReport.submittedAt).toLocaleDateString()}`}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowReportModal(false)}>Close</Button>
                  <Button onClick={() => downloadReportPDF(selectedReport)} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                    <FileDown className="h-4 w-4 mr-2" /> Download PDF
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
  return <ReportsPageContent />;
}