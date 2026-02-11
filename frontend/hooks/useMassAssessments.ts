import { useState, useEffect, useCallback, useRef } from 'react';

interface Assessment {
    id: string;
    grade: string;
    className?: string;
    totalStudents: number;
    assessmentDate: string;
    status: string;
}

interface Stats {
    totalAssessments: number;
    studentsScreened: number;
    tier2Percentage: number;
    tier3Percentage: number;
}

export function useMassAssessments() {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    const fetchAssessments = useCallback(async () => {
        // Prevent multiple simultaneous calls
        if (hasFetched.current && loading) return;
        
        try {
            setLoading(true);
            setError(null);
            hasFetched.current = true;
            
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/mass-assessment/educator', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const assessments = data.assessments || [];
                
                // Calculate stats from real data
                const totalStudents = assessments.reduce((sum: number, a: Assessment) => sum + a.totalStudents, 0);
                
                // Calculate tier percentages from assessment results if available
                let tier2Count = 0;
                let tier3Count = 0;
                let totalResults = 0;
                
                assessments.forEach((assessment: any) => {
                    if (assessment.results) {
                        assessment.results.forEach((result: any) => {
                            totalResults++;
                            if (result.allocatedTier === 'TIER_2_AT_RISK') tier2Count++;
                            if (result.allocatedTier === 'TIER_3_HIGH_RISK') tier3Count++;
                        });
                    }
                });

                const newStats: Stats = {
                    totalAssessments: assessments.length,
                    studentsScreened: totalStudents,
                    tier2Percentage: totalResults > 0 ? Math.round((tier2Count / totalResults) * 100) : 0,
                    tier3Percentage: totalResults > 0 ? Math.round((tier3Count / totalResults) * 100) : 0,
                };

                setAssessments(assessments);
                setStats(newStats);
            } else {
                throw new Error('Failed to fetch assessments');
            }
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
            hasFetched.current = false;
        }
    }, [loading]);

    const refreshAssessments = useCallback(() => {
        hasFetched.current = false;
        fetchAssessments();
    }, [fetchAssessments]);

    useEffect(() => {
        fetchAssessments();
    }, []);

    return {
        assessments,
        stats,
        loading,
        error,
        refreshAssessments,
    };
}
