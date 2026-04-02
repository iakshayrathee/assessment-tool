import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StudentReportSummary } from '@/types/report';

/**
 * Fetches a report coverage summary for every student currently assigned to
 * the authenticated special educator.
 *
 * Each entry contains the student's identity plus counts for ASSESSMENT and
 * LESSON_PLAN reports broken down by status. Used to power the roster grid
 * on the Reports landing page when no individual student is selected.
 *
 * Endpoint: GET /api/reports/educator
 */
export function useEducatorReportRoster() {
  return useQuery<StudentReportSummary[]>({
    queryKey: ['reports', 'educator-roster'],
    queryFn: () => apiClient.getEducatorReportRoster(),
    staleTime: 2 * 60 * 1000,
  });
}
