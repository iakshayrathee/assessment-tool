'use client';

/**
 * AI Agent React Hooks
 *
 * Custom hooks for consuming AI agent data in the frontend.
 * Uses React Query for caching, deduplication, and background refresh.
 *
 * Design principles:
 * - Lazy-load: AI data only fetched when explicitly enabled
 * - Cached: staleTime of 30 min to avoid redundant agent calls
 * - Graceful: never blocks the page — shows existing data first
 * - Resilient: silently handles AI backend unavailability
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

// ── Configuration ────────────────────────────────────────────────────────────

const AI_STALE_TIME = 30 * 60 * 1000;  // 30 minutes — agent results don't change frequently
const AI_CACHE_TIME = 60 * 60 * 1000;  // 60 minutes — keep in cache for 1 hour
const AI_RETRY_COUNT = 1;               // Only 1 retry — don't spam the AI backend

// ── AI Health Check ──────────────────────────────────────────────────────────

/**
 * Check if the AI backend is available.
 * Cached for 5 minutes. Use this to conditionally show/hide AI sections.
 */
export function useAIHealth() {
  return useQuery({
    queryKey: queryKeys.ai.health(),
    queryFn: () => apiClient.checkAIHealth(),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

// ── Assessment Analysis ──────────────────────────────────────────────────────

/**
 * Fetch AI assessment analysis for a student.
 * Returns symptom analysis, severity scores, domain profile, risk classification,
 * differential indicators, and recommended next steps.
 *
 * @param studentId - Student ID to analyze
 * @param enabled - Whether to trigger the fetch (lazy-load pattern)
 */
export function useAIAssessment(studentId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.ai.assessment(studentId),
    queryFn: () => apiClient.getAIAssessmentAnalysis(studentId),
    enabled: enabled && !!studentId,
    staleTime: AI_STALE_TIME,
    gcTime: AI_CACHE_TIME,
    retry: AI_RETRY_COUNT,
    refetchOnWindowFocus: false,
  });
}

// ── IEP Suggestions ──────────────────────────────────────────────────────────

/**
 * Generate AI-suggested IEP goals, LTP, STPs, and WLPs.
 * Uses useMutation instead of useQuery because it's a POST that
 * generates new content (not idempotent), and can accept
 * assessment analysis as input for better results.
 */
export function useAIIEPSuggestions(studentId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.ai.iep(studentId),
    queryFn: () => apiClient.getAIIEPSuggestions(studentId),
    enabled: enabled && !!studentId,
    staleTime: AI_STALE_TIME,
    gcTime: AI_CACHE_TIME,
    retry: AI_RETRY_COUNT,
    refetchOnWindowFocus: false,
  });
}

/**
 * Mutation variant — call this when you want to pass assessment analysis
 * for better IEP suggestions.
 */
export function useGenerateAIIEP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, assessmentAnalysis }: { studentId: string; assessmentAnalysis?: any }) =>
      apiClient.getAIIEPSuggestions(studentId, assessmentAnalysis),
    onSuccess: (data, variables) => {
      // Cache the result
      queryClient.setQueryData(queryKeys.ai.iep(variables.studentId), data);
    },
  });
}

// ── Lesson Plan Suggestions ──────────────────────────────────────────────────

/**
 * Fetch AI-suggested lesson plan for a specific week.
 *
 * @param studentId - Student ID
 * @param weekNumber - Week number for the lesson plan
 * @param enabled - Whether to trigger the fetch
 */
export function useAILessonPlan(studentId: string, weekNumber: number = 1, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.ai.lessonPlan(studentId, weekNumber),
    queryFn: () => apiClient.getAILessonPlan(studentId, weekNumber),
    enabled: enabled && !!studentId,
    staleTime: AI_STALE_TIME,
    gcTime: AI_CACHE_TIME,
    retry: AI_RETRY_COUNT,
    refetchOnWindowFocus: false,
  });
}

// ── Risk Analysis ────────────────────────────────────────────────────────────

/**
 * Fetch AI risk analysis for a student.
 * Returns risk classifications, progress trends, early warnings, and recommendations.
 *
 * @param studentId - Student ID to analyze
 * @param enabled - Whether to trigger the fetch
 */
export function useAIStudentRisk(studentId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.ai.risk(studentId),
    queryFn: () => apiClient.getAIStudentRisk(studentId),
    enabled: enabled && !!studentId,
    staleTime: AI_STALE_TIME,
    gcTime: AI_CACHE_TIME,
    retry: AI_RETRY_COUNT,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch AI risk distribution across a school.
 */
export function useAISchoolRisk(schoolId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.ai.schoolRisk(schoolId),
    queryFn: () => apiClient.getAISchoolRisk(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: AI_STALE_TIME,
    gcTime: AI_CACHE_TIME,
    retry: AI_RETRY_COUNT,
    refetchOnWindowFocus: false,
  });
}

// ── Educator Insights ────────────────────────────────────────────────────────

/**
 * Fetch AI-powered educator insights — performance summary, mentoring insights,
 * training recommendations, and student priority list.
 *
 * @param enabled - Whether to trigger the fetch
 */
export function useAIEducatorInsights(enabled: boolean = false) {
  return useQuery({
    queryKey: queryKeys.ai.educatorInsights(),
    queryFn: () => apiClient.getAIEducatorInsights(),
    enabled,
    staleTime: AI_STALE_TIME,
    gcTime: AI_CACHE_TIME,
    retry: AI_RETRY_COUNT,
    refetchOnWindowFocus: false,
  });
}
