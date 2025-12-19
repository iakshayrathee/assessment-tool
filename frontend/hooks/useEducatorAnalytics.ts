import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

/**
 * Hook to fetch comprehensive analytics dashboard data
 */
export function useEducatorDashboardAnalytics() {
    return useQuery({
        queryKey: ['educator', 'analytics', 'dashboard'],
        queryFn: async () => {
            // Use the apiClient's internal axios instance
            const response = await (apiClient as any).client.get('/special-educators/analytics/dashboard');
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true
    });
}

/**
 * Hook to fetch student-specific analytics
 */
export function useStudentAnalytics(studentId: string | null) {
    return useQuery({
        queryKey: ['educator', 'analytics', 'student', studentId],
        queryFn: async () => {
            if (!studentId) return null;
            const response = await (apiClient as any).client.get(`/special-educators/analytics/student/${studentId}`);
            return response.data.data;
        },
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000
    });
}

/**
 * Hook to fetch progress trends
 */
export function useProgressTrends(period: 'week' | 'month' | 'quarter' = 'month') {
    return useQuery({
        queryKey: ['educator', 'analytics', 'trends', period],
        queryFn: async () => {
            const response = await (apiClient as any).client.get(`/special-educators/analytics/trends?period=${period}`);
            return response.data.data;
        },
        staleTime: 10 * 60 * 1000 // 10 minutes
    });
}

/**
 * Hook to fetch all students with analytics data
 * Uses the existing getSpecialEducatorStudents method if available,
 * otherwise falls back to direct API call
 */
export function useStudentsWithAnalytics() {
    return useQuery({
        queryKey: ['educator', 'students', 'analytics'],
        queryFn: async () => {
            // Check if the method exists on apiClient
            if (typeof (apiClient as any).getSpecialEducatorStudents === 'function') {
                const result = await (apiClient as any).getSpecialEducatorStudents({ limit: 100 });
                // Return the students array from the paginated response
                return result?.data || result?.students || [];
            } else {
                // Fallback to direct API call
                const response = await (apiClient as any).client.get('/special-educators/students?limit=100');
                // Extract students from paginated response
                return response.data.data?.students || [];
            }
        },
        staleTime: 5 * 60 * 1000
    });
}
