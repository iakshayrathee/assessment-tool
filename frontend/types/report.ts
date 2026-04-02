export type ReportStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED';

/** Only ASSESSMENT and LESSON_PLAN are generated / viewed in the educator UI. */
export type EducatorReportType = 'ASSESSMENT' | 'LESSON_PLAN';

export interface Report {
  id: string;
  studentId: string;
  specialEducatorId: string;
  superSpecialEducatorId?: string;
  type: EducatorReportType;
  title: string;
  content: string;
  summary?: string;
  recommendations?: string;
  status: ReportStatus;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  student: { id: string; fullName: string; grade: string };
  specialEducator: { id: string; fullName: string };
}

/**
 * Per-student report coverage summary returned by GET /api/reports/educator.
 * One row per student in the educator's active roster.
 */
export interface StudentReportSummary {
  studentId: string;
  studentName: string;
  grade: string;
  reportCount: number;
  latestReportAt: string | null;
  latestReportType: EducatorReportType | null;
  hasAssessmentReport: boolean;
  hasLessonPlanReport: boolean;
  /** Reports in PENDING or IN_PROGRESS status. */
  pendingCount: number;
  /** Reports in COMPLETED (submitted) status. */
  completedCount: number;
  /** Reports in REVIEWED status. */
  reviewedCount: number;
}
