'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReports } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useEducator';
import { apiClient } from '@/lib/api';
import {
  markdownToHtml, markdownToHtmlForPdf, parseReportSections,
  ASSESSMENT_SECTIONS, LESSON_PLAN_SECTIONS, stripMarkdown,
  getReportStats, getStatusBadgeClasses, getStatusLabel, getReportTypeBorderColor
} from '@/lib/reportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download, Eye, BarChart3, FileText, Send, Brain, CheckCircle,
  Loader2, Users, FileDown, Plus, Sparkles, Clock, BookOpen,
  ChevronDown, ChevronUp, Hash, Info, AlertCircle, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';
import { ReportEditorModal } from '@/components/educator/ReportEditorModal';

const REPORT_TYPES = [
  { value: 'ASSESSMENT', label: 'Assessment Report', description: 'AI-generated report based on assessment data and intake form' },
  { value: 'LESSON_PLAN', label: 'Lesson Plan Report', description: 'AI-generated report based on lesson plans with teacher observations' }
];

export const dynamic = 'force-dynamic';

/* ──────────────────────────────────────────────
   Markdown Content renderer
   ────────────────────────────────────────────── */
function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm max-w-none leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}

/* ──────────────────────────────────────────────
   Collapsible Report Section with accent border
   ────────────────────────────────────────────── */
function ReportSection({ title, content, bgClass, borderClass, titleClass, index }: {
  title: string; content: string; bgClass: string; borderClass: string; titleClass: string; index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!content || content === 'N/A') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`${bgClass} border ${borderClass} rounded-xl overflow-hidden shadow-sm`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:brightness-95`}
      >
        <div className="flex items-center gap-3">
          <h4 className={`font-semibold text-base ${titleClass}`}>{title}</h4>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-dashed border-opacity-50" style={{ borderColor: 'inherit' }}>
              <MarkdownContent content={content} className="text-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Stats bar for report modals
   ────────────────────────────────────────────── */
function ReportStatsBar({ content, status, type }: { content: string; status?: string; type?: string }) {
  const stats = useMemo(() => getReportStats(content || ''), [content]);
  const items = [
    { icon: Hash, label: 'Sections', value: stats.sectionCount, color: 'text-blue-600 bg-blue-50' },
    { icon: BookOpen, label: 'Words', value: stats.wordCount.toLocaleString(), color: 'text-purple-600 bg-purple-50' },
    { icon: Clock, label: 'Reading', value: stats.readingTime, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${item.color}`}>
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold leading-tight">{item.value}</p>
            <p className="text-xs opacity-75">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Single report card in the list
   ────────────────────────────────────────────── */
function ReportListCard({ report, index, onView, onDownload, onSubmit, isSubmitting }: {
  report: any; index: number; onView: () => void; onDownload: () => void; onSubmit: () => void; isSubmitting: boolean;
}) {
  const stats = useMemo(() => getReportStats(report.content || ''), [report.content]);
  const reportTypeLabel = REPORT_TYPES.find(t => t.value === report.type)?.label || report.type;
  const borderColor = getReportTypeBorderColor(report.type);
  const statusClasses = getStatusBadgeClasses(report.status);
  const createdDate = new Date(report.createdAt);
  const timeAgo = getRelativeTime(createdDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group bg-white border rounded-xl border-l-4 ${borderColor} hover:shadow-lg transition-all duration-300 overflow-hidden`}
    >
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2 overflow-hidden">
              <Badge variant="outline" className="text-xs font-medium truncate max-w-[160px] shrink-0">{reportTypeLabel}</Badge>
              <Badge className={`text-xs border shrink-0 ${statusClasses}`}>{getStatusLabel(report.status)}</Badge>
            </div>

            <h3 className="font-semibold text-gray-900 text-base mb-1.5 line-clamp-1">{report.title}</h3>

            {report.summary && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3 break-words">{(() => { const s = stripMarkdown(report.summary); return s.substring(0, 180) + (s.length > 180 ? '...' : ''); })()}</p>
            )}

            {/* Mini stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{stats.sectionCount} sections</span>
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{stats.wordCount.toLocaleString()} words</span>
              {report.submittedAt && (
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-3 w-3" />Submitted {new Date(report.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:flex-col sm:items-end flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onView} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> View
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Relative time helper
   ────────────────────────────────────────────── */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
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

  // Editor modal
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch students
  const { students, isLoading: isLoadingStudents } = useEducatorStudents();

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

  // ── Handlers ──
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

  /** Generates PDF HTML for a report — clean, professional black-and-white layout */
  const buildPdfHtml = (report: any) => {
    const sections = parseReportSections(report.content || '');
    const reportDate = new Date(report.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const reportTypeLabel = REPORT_TYPES.find(t => t.value === report.type)?.label || report.type;

    let sectionsHtml = '';
    sections.forEach((section, i) => {
      sectionsHtml += `
        <div style="margin-bottom:14px;">
          <h2 style="font-size:13px;font-weight:700;color:#111;margin:0 0 6px 0;padding-bottom:4px;border-bottom:1.5px solid #333;text-transform:uppercase;letter-spacing:0.5px;">
            ${section.heading}
          </h2>
          <div style="font-size:11.5px;line-height:1.65;color:#222;">
            ${markdownToHtmlForPdf(section.body)}
          </div>
        </div>`;
    });

    if (!sectionsHtml && report.content) {
      sectionsHtml = `<div style="font-size:11.5px;line-height:1.65;color:#222;">${markdownToHtmlForPdf(report.content)}</div>`;
    }

    return `
      <div style="font-family:'Times New Roman',Georgia,serif;font-size:12px;line-height:1.5;color:#111;padding:0;margin:0;">
        <div style="text-align:center;border-bottom:2.5px solid #111;padding-bottom:12px;margin-bottom:16px;">
          <h1 style="font-size:18px;font-weight:700;margin:0 0 2px 0;text-transform:uppercase;letter-spacing:1.5px;color:#111;">
            ${report.title || 'Student Assessment Report'}
          </h1>
          <p style="font-size:10px;margin:4px 0 0 0;color:#555;font-style:italic;">
            ${reportTypeLabel} &mdash; Confidential
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:10.5px;font-family:'Segoe UI',Arial,sans-serif;">
          <tr>
            <td style="padding:5px 8px;border:1px solid #aaa;width:22%;font-weight:700;background:#f0f0f0;color:#222;">Student Name</td>
            <td style="padding:5px 8px;border:1px solid #aaa;width:28%;">${selectedStudentName}</td>
            <td style="padding:5px 8px;border:1px solid #aaa;width:22%;font-weight:700;background:#f0f0f0;color:#222;">Report Type</td>
            <td style="padding:5px 8px;border:1px solid #aaa;width:28%;">${reportTypeLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Grade / Class</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">Grade ${selectedStudentGrade}</td>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Date of Report</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">${reportDate}</td>
          </tr>
          <tr>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Status</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">${report.status}</td>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Report ID</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">${report.id?.slice(0, 8) || 'N/A'}</td>
          </tr>
        </table>

        ${sectionsHtml}

        <div style="margin-top:20px;padding-top:8px;border-top:1.5px solid #999;text-align:center;font-size:9px;color:#666;font-family:'Segoe UI',Arial,sans-serif;">
          <p style="margin:1px 0;">Report generated on ${reportDate}</p>
          <p style="margin:1px 0;font-weight:700;">Confidential &mdash; For Educational Purposes Only</p>
          <p style="margin:1px 0;">&copy; ${new Date().getFullYear()} Knowled Assessment Platform</p>
        </div>
      </div>`;
  };

  const downloadReportPDF = async (report: any) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const html = buildPdfHtml(report);
      const opt = {
        margin: [12, 14, 12, 14],
        filename: `${selectedStudentName.replace(/\s+/g, '-').toLowerCase()}-${report.type?.toLowerCase()}-${new Date(report.createdAt).toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const, compress: true },
        pagebreak: { mode: ['avoid-all' as const, 'css' as const, 'legacy' as const] },
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

  /* ── Render Report Sections (shared by both modals) ── */
  const renderSections = (content: string, reportType: string) => {
    const sections = parseReportSections(content || '');
    const sectionConfig = getSectionConfig(reportType);

    if (sections.length > 0) {
      return (
        <div className="space-y-3">
          {sections.map((section, i) => {
            const config = sectionConfig[i] || sectionConfig[sectionConfig.length - 1];
            return (
              <ReportSection
                key={i}
                index={i}
                title={config.title}
                content={section.body}
                bgClass={config.bgClass}
                borderClass={config.borderClass}
                titleClass={config.titleClass}
              />
            );
          })}
        </div>
      );
    }

    // Fallback: render content as a single block
    if (content) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <MarkdownContent content={content} />
        </div>
      );
    }
    return null;
  };

  // ── Empty state ──
  if (!isLoadingStudents && students?.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Available</h3>
            <p className="text-gray-500 mb-6">You don't have any assigned students yet. Add students to start generating reports.</p>
            <Link href="/educator/students"><Button className="px-6">View Students</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ═══ Header ═══ */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-purple-50/30 border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />Reports
            </h1>
            <p className="text-gray-500 text-sm mt-1">Generate and manage AI-powered student reports</p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Student Selector */}
            {selectedStudent ? (
              <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-blue-200 shadow-sm min-w-[220px]">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{selectedStudentName}</p>
                  <p className="text-xs text-gray-500">Grade {selectedStudentGrade || 'N/A'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowStudentModal(true)}
                  className="h-8 w-8 p-0 flex-shrink-0 rounded-lg hover:bg-blue-50" title="Change student">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowStudentModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 min-w-[160px] rounded-xl border-dashed border-2">
                <Users className="h-4 w-4" /> Select Student
              </Button>
            )}

            {/* Report Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500 font-medium">Report Type</Label>
              <Select value={selectedReportType} onValueChange={(v: 'ASSESSMENT' | 'LESSON_PLAN') => setSelectedReportType(v)}>
                <SelectTrigger className="w-[220px] h-10 rounded-xl bg-white">
                  <SelectValue placeholder="Select report type">
                    {REPORT_TYPES.find(t => t.value === selectedReportType)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-[280px] max-w-sm">
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-gray-500">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerateAIReport} disabled={isGeneratingAI || !selectedStudent}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-xl px-5 h-10 shadow-md shadow-purple-200/50">
              {isGeneratingAI ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Brain className="h-4 w-4 mr-2" />Generate AI Report</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ Reports List ═══ */}
      <Card className="shadow-sm border-slate-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Reports
              {filteredReports.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{filteredReports.length}</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {currentReports.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BarChart3 className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {reports?.length === 0
                  ? "Select a student and generate your first AI report to get started."
                  : "Try adjusting your filters to find what you're looking for."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentReports.map((report: any, index: number) => (
                <ReportListCard
                  key={report.id}
                  report={report}
                  index={index}
                  onView={() => handleViewReport(report)}
                  onDownload={() => downloadReportPDF(report)}
                  onSubmit={() => handleSubmitReport(report.id)}
                  isSubmitting={isSubmitting}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredReports.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length}
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1} className="rounded-lg">Previous</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                  <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} size="sm"
                    onClick={() => setCurrentPage(i + 1)} className="h-8 w-8 p-0 rounded-lg">{i + 1}</Button>
                ))}
                {totalPages > 5 && <span className="px-2 text-sm text-gray-400">…</span>}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages} className="rounded-lg">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ AI Preview Dialog ═══ */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Report Preview
            </DialogTitle>
          </DialogHeader>
          {aiPreview && (
            <div className="space-y-5 mt-4">
              {/* Report Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-2xl text-blue-900 mb-2">{aiPreview.title || 'Student Report'}</h3>
                    <p className="text-sm text-blue-700">Comprehensive Assessment Report</p>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Student:</span><span className="text-gray-900 font-medium">{selectedStudentName}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Grade:</span><span className="text-gray-900">Grade {selectedStudentGrade}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Date:</span><span className="text-gray-900">{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Type:</span><span className="text-gray-900">{REPORT_TYPES.find(t => t.value === aiPreview.type)?.label || aiPreview.type}</span></div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <ReportStatsBar content={aiPreview.content} status={aiPreview.status} type={aiPreview.type} />

              {/* Sections */}
              {renderSections(aiPreview.content, aiPreview.type || selectedReportType)}

              {/* Footer & Actions */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500">
                <p>Report generated on {new Date().toLocaleDateString()}</p>
                <p className="mt-0.5">Confidential - For educational purposes only</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" /> Assessment Report
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowAIPreview(false)} className="rounded-xl">Close</Button>
                  <Button onClick={() => downloadReportPDF(aiPreview)} variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl">
                    <FileDown className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button onClick={() => { refetch(); setShowAIPreview(false); toast.success('Report saved'); }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" /> Save as Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Student Selection Modal ═══ */}
      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={(id) => { setSelectedStudent(id); setShowStudentModal(false); }}
        selectedStudentId={selectedStudent}
      />

      {/* ═══ Report View Modal ═══ */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {selectedReport?.title || 'Report Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-5 mt-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-xl text-blue-900 mb-2">{selectedReport.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{REPORT_TYPES.find(t => t.value === selectedReport.type)?.label || selectedReport.type}</Badge>
                      <Badge className={`text-xs border ${getStatusBadgeClasses(selectedReport.status)}`}>{getStatusLabel(selectedReport.status)}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Student:</span><span className="font-medium text-gray-900">{selectedStudentName}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Grade:</span><span className="text-gray-900">Grade {selectedStudentGrade}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-500">Date:</span><span className="text-gray-900">{new Date(selectedReport.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <ReportStatsBar content={selectedReport.content} status={selectedReport.status} type={selectedReport.type} />

              {/* Content Sections */}
              {(() => {
                const sections = parseReportSections(selectedReport.content || '');
                const sectionConfig = getSectionConfig(selectedReport.type || 'ASSESSMENT');
                if (sections.length > 0) {
                  return (
                    <div className="space-y-3">
                      {sections.map((section, i) => {
                        const config = sectionConfig[i] || sectionConfig[sectionConfig.length - 1];
                        return (
                          <ReportSection
                            key={i}
                            index={i}
                            title={config.title}
                            content={section.body}
                            bgClass={config.bgClass}
                            borderClass={config.borderClass}
                            titleClass={config.titleClass}
                          />
                        );
                      })}
                    </div>
                  );
                }
                // Fallback
                return (
                  <>
                    {selectedReport.summary && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <h4 className="font-semibold text-lg text-blue-800 mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4" /> Executive Summary
                        </h4>
                        <MarkdownContent content={selectedReport.summary} />
                      </div>
                    )}
                    {selectedReport.recommendations && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <h4 className="font-semibold text-lg text-green-800 mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" /> Recommendations
                        </h4>
                        <MarkdownContent content={selectedReport.recommendations} />
                      </div>
                    )}
                    {selectedReport.content && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Full Report
                        </h4>
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
                  <Button variant="outline" onClick={() => setShowReportModal(false)} className="rounded-xl">Close</Button>
                  <Button onClick={() => downloadReportPDF(selectedReport)} variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl">
                    <FileDown className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingReport(selectedReport);
                      setShowEditorModal(true);
                      setShowReportModal(false);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl gap-1.5"
                  >
                    <Pencil className="h-4 w-4" /> Edit Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Report Editor Modal ═══ */}
      {editingReport && (
        <ReportEditorModal
          report={editingReport}
          isOpen={showEditorModal}
          onClose={() => { setShowEditorModal(false); setEditingReport(null); }}
          onSaveSuccess={() => { refetch(); }}
          reportTypeLabel={REPORT_TYPES.find(t => t.value === editingReport.type)?.label || editingReport.type}
          statusClasses={getStatusBadgeClasses(editingReport.status)}
        />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return <ReportsPageContent />;
}