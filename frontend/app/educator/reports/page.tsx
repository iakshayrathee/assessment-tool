'use client';

/**
 * Reports Page — Redesigned v2
 *
 * Key changes from v1:
 * - Student is context rather than a hard prerequisite. When none is selected,
 *   a picker grid of the educator's students is shown instead of a blank prompt.
 * - "Generate AI Report" lives in the page header (PageWrapper `actions`) so it
 *   is always accessible regardless of student or list state.
 * - GenerateDialog is a proper extracted component — it no longer competes
 *   visually with the report list.
 * - Status filters now use real DB enum values (PENDING / IN_PROGRESS /
 *   COMPLETED / REVIEWED). The previous DRAFT / SUBMITTED values never matched
 *   any real DB records, so filters were silently broken.
 * - Type filter added — covers all six ReportType enum values.
 * - SummaryStrip shows live counts above the list (derived from the already-
 *   loaded reports array — no extra API call).
 * - All existing modals, PDF generation logic, and AI preview are unchanged.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReports } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useEducator';
import { useEducatorReportRoster } from '@/hooks/useEducatorReportRoster';
import { StudentReportSummary } from '@/types/report';
import { apiClient } from '@/lib/api';
import {
  markdownToHtml,
  markdownToHtmlForPdf,
  parseReportSections,
  ASSESSMENT_SECTIONS,
  LESSON_PLAN_SECTIONS,
  stripMarkdown,
  getReportStats,
  getStatusBadgeClasses,
  getStatusLabel,
  getReportTypeBorderColor,
  STATUS_FILTER_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from '@/lib/reportUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download,
  Eye,
  BarChart3,
  FileText,
  Brain,
  CheckCircle,
  Loader2,
  Sparkles,
  Users,
  FileDown,
  Plus,
  Send,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Hash,
  AlertCircle,
  Pencil,
  Search,
  Filter,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import toast from '@/lib/toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';
import { ReportEditorModal } from '@/components/educator/ReportEditorModal';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Report types the educator UI can request from the AI backend.
 * Subset of the DB ReportType enum — expand here as new types are supported.
 */
const GENERATE_REPORT_TYPES = [
  {
    value: 'ASSESSMENT' as const,
    label: 'Assessment Report',
    description: 'AI-generated from assessment data and intake form',
  },
  {
    value: 'LESSON_PLAN' as const,
    label: 'Lesson Plan Report',
    description: 'AI-generated from lesson plans with teacher observations',
  },
];

/** Display labels for all ReportType enum values. */
const REPORT_TYPE_LABELS: Record<string, string> = {
  ASSESSMENT:       'Assessment',
  LESSON_PLAN:      'Lesson Plan',
  PROGRESS:         'Progress',
  IEP:              'IEP',
  INTAKE:           'Intake',
  AI_COMPREHENSIVE: 'AI Comprehensive',
};

const ITEMS_PER_PAGE = 10;

export const dynamic = 'force-dynamic';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Primitive sub-components ────────────────────────────────────────────────

function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm max-w-none leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}

function ReportSection({
  title,
  content,
  bgClass,
  borderClass,
  titleClass,
  index,
}: {
  title: string;
  content: string;
  bgClass: string;
  borderClass: string;
  titleClass: string;
  index: number;
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
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:brightness-95"
      >
        <h4 className={`font-semibold text-base ${titleClass}`}>{title}</h4>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-dashed border-opacity-50">
              <MarkdownContent content={content} className="text-foreground" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReportStatsBar({ content }: { content: string }) {
  const stats = useMemo(() => getReportStats(content || ''), [content]);
  const items = [
    { icon: Hash,     label: 'Sections', value: stats.sectionCount,               color: 'text-primary bg-primary/10' },
    { icon: BookOpen, label: 'Words',    value: stats.wordCount.toLocaleString(),  color: 'text-info bg-info/10' },
    { icon: Clock,    label: 'Reading',  value: stats.readingTime,                color: 'text-warning bg-warning/10' },
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

// ─── Student picker ───────────────────────────────────────────────────────────

/**
 * Shown when no student is selected. Displays the educator's roster as
 * clickable cards so they can pick a student immediately rather than being
 * blocked by a blank prompting state.
 */
function StudentPickerGrid({
  students,
  isLoading,
  onSelect,
  onOpenModal,
}: {
  students: any[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onOpenModal: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border rounded-xl p-4 space-y-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const visible = students.slice(0, 11);
  const overflow = students.length - 11;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a student to view their reports or generate a new one.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((student) => (
          <button
            key={student.id}
            onClick={() => onSelect(student.id)}
            className="group text-left border rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <p className="font-medium text-sm line-clamp-1">{student.fullName || student.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Grade {student.grade || 'N/A'}</p>
          </button>
        ))}

        {overflow > 0 && (
          <button
            onClick={onOpenModal}
            className="text-left border border-dashed rounded-xl p-4 hover:border-primary/40 hover:bg-muted/50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">+{overflow} more</p>
            <p className="text-xs text-muted-foreground mt-0.5">View all students</p>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Roster grid ─────────────────────────────────────────────────────────────

/**
 * Landing view when no student is selected.
 * Shows per-student ASSESSMENT / LESSON_PLAN coverage badges and
 * a summary strip of total report counts across the roster.
 * Falls back to a simple student picker when the roster is unavailable.
 */
function ReportRosterView({
  roster,
  isLoading,
  onSelect,
  onOpenModal,
}: {
  roster: StudentReportSummary[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onOpenModal: () => void;
}) {
  const totalReports        = roster.reduce((s, r) => s + r.reportCount, 0);
  const withReports         = roster.filter((r) => r.reportCount > 0).length;
  const needingReports      = roster.filter((r) => r.reportCount === 0).length;
  const pendingAcrossRoster = roster.reduce((s, r) => s + r.pendingCount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 flex-1 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-xl p-4 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
              <div className="flex gap-1.5 mt-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visible  = roster.slice(0, 11);
  const overflow = roster.length - 11;

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Total Reports',  value: totalReports,        color: 'bg-muted/60 text-foreground' },
          { label: 'With Reports',   value: withReports,         color: 'bg-emerald-50 text-emerald-800 border border-emerald-100' },
          { label: 'No Reports Yet', value: needingReports,       color: 'bg-amber-50 text-amber-800 border border-amber-100' },
          { label: 'Pending Review', value: pendingAcrossRoster, color: 'bg-blue-50 text-blue-800 border border-blue-100' },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${chip.color}`}>
            <span className="font-bold text-base leading-none">{chip.value}</span>
            <span className="text-xs opacity-80">{chip.label}</span>
          </div>
        ))}
      </div>

      {/* Helper text */}
      <p className="text-sm text-muted-foreground">
        Select a student to view their reports or generate a new one.
      </p>

      {/* Student cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((student) => (
          <button
            key={student.studentId}
            onClick={() => onSelect(student.studentId)}
            className="group text-left border rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/15 transition-colors flex-shrink-0">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              {student.pendingCount > 0 && (
                <span className="text-xs font-medium bg-amber-100 text-amber-800 rounded-full px-1.5 py-0.5">
                  {student.pendingCount} pending
                </span>
              )}
            </div>

            <p className="font-medium text-sm line-clamp-1">{student.studentName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">Grade {student.grade || 'N/A'}</p>

            {/* Coverage badges */}
            <div className="flex flex-wrap gap-1">
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                student.hasAssessmentReport
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {student.hasAssessmentReport
                  ? <CheckCircle className="h-3 w-3" />
                  : <Clock className="h-3 w-3" />}
                Assessment
              </span>
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                student.hasLessonPlanReport
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {student.hasLessonPlanReport
                  ? <CheckCircle className="h-3 w-3" />
                  : <Clock className="h-3 w-3" />}
                Lesson Plan
              </span>
            </div>

            {student.latestReportAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Last: {getRelativeTime(new Date(student.latestReportAt))}
              </p>
            )}
            {student.reportCount === 0 && (
              <p className="text-xs text-muted-foreground/60 mt-2 italic">No reports yet</p>
            )}
          </button>
        ))}

        {overflow > 0 && (
          <button
            onClick={onOpenModal}
            className="text-left border border-dashed rounded-xl p-4 hover:border-primary/40 hover:bg-muted/50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">+{overflow} more</p>
            <p className="text-xs text-muted-foreground mt-0.5">View all students</p>
          </button>
        )}
      </div>

      {roster.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No students assigned yet. Contact your administrator.
        </p>
      )}
    </div>
  );
}

// ─── Student context bar ──────────────────────────────────────────────────────

/** Compact header showing the selected student with Change / Deselect controls. */
function StudentContextBar({
  name,
  grade,
  onClear,
  onChange,
}: {
  name: string;
  grade: string;
  onClear: () => void;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">Grade {grade || 'N/A'}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onChange} className="h-8 text-xs gap-1">
          Change
          <ChevronRight className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Deselect student"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

/**
 * Live status counts derived from the already-fetched report list.
 * No extra API call — just client-side aggregation.
 */
function SummaryStrip({ reports }: { reports: any[] }) {
  const counts = {
    total:      reports.length,
    pending:    reports.filter((r) => r.status === 'PENDING').length,
    inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    completed:  reports.filter((r) => r.status === 'COMPLETED').length,
    reviewed:   reports.filter((r) => r.status === 'REVIEWED').length,
  };

  const chips = [
    { label: 'Total',       value: counts.total,      color: 'bg-muted/60 text-foreground' },
    { label: 'Pending',     value: counts.pending,     color: 'bg-amber-50 text-amber-800 border border-amber-100' },
    { label: 'In Progress', value: counts.inProgress,  color: 'bg-blue-50 text-blue-800 border border-blue-100' },
    { label: 'Completed',   value: counts.completed,   color: 'bg-emerald-50 text-emerald-800 border border-emerald-100' },
    { label: 'Reviewed',    value: counts.reviewed,    color: 'bg-purple-50 text-purple-800 border border-purple-100' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${chip.color}`}
        >
          <span className="font-bold text-base leading-none">{chip.value}</span>
          <span className="text-xs opacity-80">{chip.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Report card ──────────────────────────────────────────────────────────────

function ReportCard({
  report,
  index,
  onView,
  onDownload,
}: {
  report: any;
  index: number;
  onView: () => void;
  onDownload: () => void;
}) {
  const stats = useMemo(() => getReportStats(report.content || ''), [report.content]);
  const typeLabel = REPORT_TYPE_LABELS[report.type] || report.type;
  const borderColor = getReportTypeBorderColor(report.type);
  const statusClasses = getStatusBadgeClasses(report.status);
  const timeAgo = getRelativeTime(new Date(report.createdAt));
  const summaryPreview = report.summary
    ? (() => {
        const s = stripMarkdown(report.summary);
        return s.substring(0, 180) + (s.length > 180 ? '…' : '');
      })()
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={`group bg-background border rounded-xl border-l-4 ${borderColor} hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-medium flex-shrink-0">
                {typeLabel}
              </Badge>
              <Badge className={`text-xs border flex-shrink-0 ${statusClasses}`}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>

            <h3 className="font-semibold text-foreground text-sm mb-1.5 line-clamp-1">
              {report.title}
            </h3>

            {summaryPreview && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{summaryPreview}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {stats.sectionCount} sections
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {stats.wordCount.toLocaleString()} words
              </span>
              {report.submittedAt && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  Submitted {new Date(report.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 sm:flex-col sm:items-end">
            <Button variant="outline" size="sm" onClick={onView} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReportListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-xl p-5 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Generate dialog ──────────────────────────────────────────────────────────

/**
 * Self-contained dialog for the AI report generation flow.
 * Extracted from the page so the main component stays focused on list management.
 */
function GenerateDialog({
  isOpen,
  onClose,
  selectedStudent,
  selectedStudentName,
  selectedStudentGrade,
  onChangeStudent,
  reportType,
  onReportTypeChange,
  isGenerating,
  onGenerate,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedStudent: string;
  selectedStudentName: string;
  selectedStudentGrade: string;
  onChangeStudent: () => void;
  reportType: 'ASSESSMENT' | 'LESSON_PLAN';
  onReportTypeChange: (type: 'ASSESSMENT' | 'LESSON_PLAN') => void;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Generate AI Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Student */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Student</Label>
            {selectedStudent ? (
              <div className="flex items-center justify-between bg-muted/50 border rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{selectedStudentName}</p>
                  <p className="text-xs text-muted-foreground">Grade {selectedStudentGrade || 'N/A'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onChangeStudent} className="h-8 text-xs">
                  Change
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onChangeStudent}
                className="w-full justify-start gap-2 border-dashed"
              >
                <Users className="h-4 w-4" />
                Select a student
              </Button>
            )}
          </div>

          {/* Report type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(v: 'ASSESSMENT' | 'LESSON_PLAN') => onReportTypeChange(v)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-background">
                <SelectValue>
                  {GENERATE_REPORT_TYPES.find((t) => t.value === reportType)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GENERATE_REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col py-0.5">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isGenerating || !selectedStudent}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-xl px-5 shadow-md shadow-purple-200/50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentIdParam = searchParams.get('studentId');

  // ── Core state ──
  const [selectedStudent, setSelectedStudent] = useState<string>(studentIdParam || '');
  const [selectedReportType, setSelectedReportType] = useState<'ASSESSMENT' | 'LESSON_PLAN'>('ASSESSMENT');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // ── Filter state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Dialog / modal state ──
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);

  // ── Data ──
  const { students, isLoading: isLoadingStudents } = useEducatorStudents();
  const {
    reports,
    submitReport,
    isSubmitting,
    refetch,
    isLoading: isLoadingReports,
    isError: isReportsError,
  } = useReports(selectedStudent || undefined);
  const {
    data: rosterData,
    isLoading: isLoadingRoster,
    isError: isRosterError,
  } = useEducatorReportRoster();

  const selectedStudentObj = students?.find((s: any) => s.id === selectedStudent);
  const selectedStudentName = selectedStudentObj?.fullName || selectedStudentObj?.name || 'Selected Student';
  const selectedStudentGrade = selectedStudentObj?.grade || '';

  // Sync URL with selected student
  useEffect(() => {
    if (selectedStudent && selectedStudent !== studentIdParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('studentId', selectedStudent);
      router.replace(`/educator/reports?${params.toString()}`);
    }
  }, [selectedStudent, studentIdParam, searchParams, router]);

  // Reset filters when student changes so stale filters don't hide reports
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  }, [selectedStudent]);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  // ── Derived data ──
  const filteredReports = useMemo(() => {
    let list: any[] = reports || [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) => r.title?.toLowerCase().includes(q) || r.summary?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (typeFilter !== 'all')   list = list.filter((r) => r.type === typeFilter);

    return list;
  }, [reports, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const isFiltered = Boolean(searchQuery || statusFilter !== 'all' || typeFilter !== 'all');

  // ── Handlers ──
  const handleSubmitReport = async (reportId: string) => {
    try {
      await submitReport({ reportId, signature: 'Digital Signature' });
      toast.success('Report submitted successfully');
      refetch();
    } catch {
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
      setShowGenerateDialog(false);
      setShowAIPreview(true);
      toast.success('AI report generated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate AI report');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  /**
   * Builds the PDF HTML. Accepts explicit name/grade args to avoid stale-closure
   * bugs when called after the dynamic html2pdf.js import resolves.
   */
  const buildPdfHtml = (report: any, studentName: string, studentGrade: string) => {
    const sections = parseReportSections(report.content || '');
    const reportDate = new Date(report.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const typeLabel = REPORT_TYPE_LABELS[report.type] || report.type;

    let sectionsHtml = sections
      .map(
        (s) => `
          <div style="margin-bottom:14px;">
            <h2 style="font-size:13px;font-weight:700;color:#111;margin:0 0 6px 0;
              padding-bottom:4px;border-bottom:1.5px solid #333;
              text-transform:uppercase;letter-spacing:0.5px;">
              ${s.heading}
            </h2>
            <div style="font-size:11.5px;line-height:1.65;color:#222;">
              ${markdownToHtmlForPdf(s.body)}
            </div>
          </div>`
      )
      .join('');

    if (!sectionsHtml && report.content) {
      sectionsHtml = `<div style="font-size:11.5px;line-height:1.65;color:#222;">${markdownToHtmlForPdf(report.content)}</div>`;
    }

    return `
      <div style="font-family:'Times New Roman',Georgia,serif;font-size:12px;line-height:1.5;color:#111;padding:0;margin:0;">
        <div style="text-align:center;border-bottom:2.5px solid #111;padding-bottom:12px;margin-bottom:16px;">
          <h1 style="font-size:18px;font-weight:700;margin:0 0 2px 0;text-transform:uppercase;letter-spacing:1.5px;color:#111;">
            ${report.title || 'Student Assessment Report'}
          </h1>
          <p style="font-size:10px;margin:4px 0 0 0;color:#555;font-style:italic;">${typeLabel} &mdash; Confidential</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:10.5px;font-family:'Segoe UI',Arial,sans-serif;">
          <tr>
            <td style="padding:5px 8px;border:1px solid #aaa;width:22%;font-weight:700;background:#f0f0f0;color:#222;">Student Name</td>
            <td style="padding:5px 8px;border:1px solid #aaa;width:28%;">${studentName}</td>
            <td style="padding:5px 8px;border:1px solid #aaa;width:22%;font-weight:700;background:#f0f0f0;color:#222;">Report Type</td>
            <td style="padding:5px 8px;border:1px solid #aaa;width:28%;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Grade / Class</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">Grade ${studentGrade}</td>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Date</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">${reportDate}</td>
          </tr>
          <tr>
            <td style="padding:5px 8px;border:1px solid #aaa;font-weight:700;background:#f0f0f0;color:#222;">Status</td>
            <td style="padding:5px 8px;border:1px solid #aaa;">${getStatusLabel(report.status)}</td>
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

  const downloadReportPDF = async (
    report: any,
    studentName: string = selectedStudentName,
    studentGrade: string = selectedStudentGrade
  ) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const html = buildPdfHtml(report, studentName, studentGrade);
      html2pdf()
        .from(html)
        .set({
          margin: [12, 14, 12, 14],
          filename: `${studentName.replace(/\s+/g, '-').toLowerCase()}-${
            report.type?.toLowerCase()
          }-${new Date(report.createdAt).toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        } as any)
        .save();
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const renderSections = (content: string, reportType: string) => {
    const sections = parseReportSections(content || '');
    const config = reportType === 'LESSON_PLAN' ? LESSON_PLAN_SECTIONS : ASSESSMENT_SECTIONS;
    const fallbackCfg = config[config.length - 1];

    if (sections.length > 0) {
      return (
        <div className="space-y-3">
          {sections.map((section, i) => {
            // Match by heading text instead of index — handles conditional sections
            const headingLower = section.heading.toLowerCase();
            const cfg = config.find(
              (c) =>
                headingLower === c.title.toLowerCase() ||
                headingLower.includes(c.title.toLowerCase()) ||
                c.title.toLowerCase().includes(headingLower)
            ) || fallbackCfg;
            return (
              <ReportSection
                key={i}
                index={i}
                title={section.heading}
                content={section.body}
                bgClass={cfg.bgClass}
                borderClass={cfg.borderClass}
                titleClass={cfg.titleClass}
              />
            );
          })}
        </div>
      );
    }

    if (content) {
      return (
        <div className="bg-background border border-border rounded-xl p-6">
          <MarkdownContent content={content} />
        </div>
      );
    }
    return null;
  };

  // ── Guard: educator has no students assigned ──
  if (!isLoadingStudents && students?.length === 0) {
    return (
      <PageWrapper
        title="Reports"
        description="Generate and manage AI-powered student reports"
        breadcrumbs={[{ label: 'Educator' }, { label: 'Reports' }]}
      >
        <div className="flex items-center justify-center py-20">
          <Card className="w-full max-w-md shadow-sm">
            <CardContent className="p-10 text-center">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Students Available</h3>
              <p className="text-muted-foreground text-sm mb-6">
                You need at least one assigned student to generate reports.
              </p>
              <Link href="/educator/students">
                <Button>View Students</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  // ── Main render ──
  return (
    <PageWrapper
      title="Reports"
      description="Generate and manage AI-powered student reports"
      breadcrumbs={[{ label: 'Educator' }, { label: 'Reports' }]}
      actions={
        <Button
          onClick={() => setShowGenerateDialog(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-xl shadow-md shadow-purple-200/50 gap-2"
        >
          <Brain className="h-4 w-4" />
          Generate AI Report
        </Button>
      }
    >
      {/* ── No student selected: roster coverage view ───────────────────── */}
      {!selectedStudent && (
        <Card className="shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              {isRosterError ? 'Select a Student' : 'Students & Report Coverage'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isRosterError ? (
              <StudentPickerGrid
                students={students || []}
                isLoading={isLoadingStudents}
                onSelect={(id) => setSelectedStudent(id)}
                onOpenModal={() => setShowStudentModal(true)}
              />
            ) : (
              <ReportRosterView
                roster={rosterData || []}
                isLoading={isLoadingRoster}
                onSelect={(id) => setSelectedStudent(id)}
                onOpenModal={() => setShowStudentModal(true)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Student selected: context + reports ─────────────────────────── */}
      {selectedStudent && (
        <div className="space-y-4">
          <StudentContextBar
            name={selectedStudentName}
            grade={selectedStudentGrade}
            onClear={() => {
              setSelectedStudent('');
              router.replace('/educator/reports');
            }}
            onChange={() => setShowStudentModal(true)}
          />

          <Card className="shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b px-6 py-4 space-y-3">
              {/* Title + count */}
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Reports
                  {filteredReports.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {filteredReports.length}
                    </Badge>
                  )}
                </CardTitle>
              </div>

              {/* Summary strip — only when there are reports */}
              {(reports?.length || 0) > 0 && <SummaryStrip reports={reports || []} />}

              {/* Filter bar — only when there are reports */}
              {(reports?.length || 0) > 0 && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44 h-9">
                      <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-44 h-9">
                      <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5 text-muted-foreground"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {/* Loading */}
              {isLoadingReports && <ReportListSkeleton />}

              {/* Error */}
              {isReportsError && !isLoadingReports && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <AlertCircle className="h-10 w-10 text-destructive/60" />
                  <h3 className="font-semibold">Failed to load reports</h3>
                  <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty — no reports for this student */}
              {!isLoadingReports && !isReportsError && reports?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                    <BarChart3 className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">No reports yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Generate the first AI report for {selectedStudentName} using the button above.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowGenerateDialog(true)}
                    className="gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Report
                  </Button>
                </div>
              )}

              {/* Empty — filters hiding results */}
              {(reports?.length ?? 0) > 0 && filteredReports.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  <h3 className="font-semibold">No reports match your filters</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}

              {/* Report list */}
              {paginatedReports.length > 0 && (
                <div className="space-y-3">
                  {paginatedReports.map((report: any, index: number) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      index={index}
                      onView={() => handleViewReport(report)}
                      onDownload={() => void downloadReportPDF(report)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredReports.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)} of{' '}
                    {filteredReports.length} reports
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={currentPage === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className="h-8 w-8 p-0 rounded-lg"
                      >
                        {p}
                      </Button>
                    ))}
                    {totalPages > 5 && (
                      <span className="px-2 text-sm text-muted-foreground">…</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Generate Dialog ═══ */}
      <GenerateDialog
        isOpen={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        selectedStudent={selectedStudent}
        selectedStudentName={selectedStudentName}
        selectedStudentGrade={selectedStudentGrade}
        onChangeStudent={() => {
          setShowGenerateDialog(false);
          setShowStudentModal(true);
        }}
        reportType={selectedReportType}
        onReportTypeChange={setSelectedReportType}
        isGenerating={isGeneratingAI}
        onGenerate={handleGenerateAIReport}
      />

      {/* ═══ AI Preview Dialog ═══ */}
      <Dialog open={showAIPreview} onOpenChange={setShowAIPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Preview
            </DialogTitle>
          </DialogHeader>
          {aiPreview && (
            <div className="space-y-5 mt-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-primary/20 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-2xl text-blue-900 mb-2">
                      {aiPreview.title || 'Student Report'}
                    </h3>
                    <p className="text-sm text-primary">
                      {REPORT_TYPE_LABELS[aiPreview.type] || aiPreview.type} Report
                    </p>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ['Student', selectedStudentName],
                      ['Grade',   `Grade ${selectedStudentGrade}`],
                      ['Date',    new Date().toLocaleDateString()],
                      ['Type',    REPORT_TYPE_LABELS[aiPreview.type] || aiPreview.type],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="font-medium text-muted-foreground">{label}:</span>
                        <span className="text-foreground font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {aiPreview.summary && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <h4 className="font-semibold text-sm text-amber-900 mb-1.5">Report Summary</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">{stripMarkdown(aiPreview.summary).substring(0, 500)}</p>
                </div>
              )}
              <ReportStatsBar content={aiPreview.content} />
              {renderSections(aiPreview.content, aiPreview.type || selectedReportType)}
              <div className="bg-muted/40 border rounded-xl p-4 text-center text-xs text-muted-foreground">
                Generated on {new Date().toLocaleDateString()} · Confidential
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAIPreview(false)} className="rounded-xl">
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void downloadReportPDF(aiPreview)}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => {
                    refetch();
                    setShowAIPreview(false);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Student Selection Modal ═══ */}
      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={(id, _student) => {
          setSelectedStudent(id);
          setShowStudentModal(false);
        }}
        selectedStudentId={selectedStudent}
      />

      {/* ═══ Report View Modal ═══ */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedReport?.title || 'Report Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-5 mt-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-primary/20 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-xl text-blue-900 mb-2">{selectedReport.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {REPORT_TYPE_LABELS[selectedReport.type] || selectedReport.type}
                      </Badge>
                      <Badge className={`text-xs border ${getStatusBadgeClasses(selectedReport.status)}`}>
                        {getStatusLabel(selectedReport.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {[
                      ['Student', selectedStudentName],
                      ['Grade',   `Grade ${selectedStudentGrade}`],
                      ['Date',    new Date(selectedReport.createdAt).toLocaleDateString()],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="font-medium text-muted-foreground">{label}:</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedReport.summary && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <h4 className="font-semibold text-sm text-amber-900 mb-1.5">Report Summary</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">{stripMarkdown(selectedReport.summary).substring(0, 500)}</p>
                </div>
              )}
              <ReportStatsBar content={selectedReport.content} />
              {renderSections(selectedReport.content, selectedReport.type || 'ASSESSMENT')}

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(selectedReport.createdAt).toLocaleDateString()}
                  {selectedReport.submittedAt &&
                    ` · Submitted: ${new Date(selectedReport.submittedAt).toLocaleDateString()}`}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowReportModal(false)} className="rounded-xl">
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void downloadReportPDF(selectedReport)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  {/* Submit — hidden once report reaches REVIEWED status */}
                  {selectedReport.status !== 'REVIEWED' && (
                    <Button
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        void handleSubmitReport(selectedReport.id);
                        setShowReportModal(false);
                      }}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setEditingReport(selectedReport);
                      setShowEditorModal(true);
                      setShowReportModal(false);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Report
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
          onClose={() => {
            setShowEditorModal(false);
            setEditingReport(null);
          }}
          onSaveSuccess={() => refetch()}
          reportTypeLabel={REPORT_TYPE_LABELS[editingReport.type] || editingReport.type}
          statusClasses={getStatusBadgeClasses(editingReport.status)}
        />
      )}
    </PageWrapper>
  );
}
