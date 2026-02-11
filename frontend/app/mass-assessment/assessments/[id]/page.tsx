'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, RefreshCw, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Student {
    id: string;
    fullName: string;
}

interface StudentScore {
    studentId: string;
    scores: {
        reading?: number;
        readingComprehension?: number;
        spelling?: number;
        numeracy?: number;
        writing?: number;
    };
    flags: {
        attentionFlag: boolean;
        behavioralFlag: boolean;
    };
}

export default function AssessmentDetail() {
    const params = useParams();
    const router = useRouter();
    const assessmentId = params.id as string;

    const [assessment, setAssessment] = useState<any>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<Record<string, StudentScore>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });

    useEffect(() => {
        fetchAssessment();
    }, [assessmentId]);

    const fetchAssessment = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5000/api/mass-assessment/${assessmentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setAssessment(data.assessment);

                // Initialize scores for students
                const initialScores: Record<string, StudentScore> = {};
                let completedCount = 0;
                
                data.assessment.results?.forEach((result: any) => {
                    initialScores[result.studentId] = {
                        studentId: result.studentId,
                        scores: {
                            reading: result.readingScore,
                            readingComprehension: result.readingComprehensionScore,
                            spelling: result.spellingScore,
                            numeracy: result.numeracyScore,
                            writing: result.writingScore,
                        },
                        flags: {
                            attentionFlag: result.attentionFlag,
                            behavioralFlag: result.behavioralFlag,
                        },
                    };
                    
                    // Check if student has complete scores
                    const hasCompleteScores = 
                        result.readingScore !== null && 
                        result.readingComprehensionScore !== null && 
                        result.spellingScore !== null && 
                        result.numeracyScore !== null && 
                        result.writingScore !== null;
                    
                    if (hasCompleteScores) {
                        completedCount++;
                    }
                });
                
                setScores(initialScores);
                setProgress({ completed: completedCount, total: data.assessment.results?.length || 0 });
            }
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateScore = (studentId: string, domain: string, value: number) => {
        setScores((prev) => {
            const updated = {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    studentId,
                    scores: {
                        ...prev[studentId]?.scores,
                        [domain]: value,
                    },
                    flags: prev[studentId]?.flags || { attentionFlag: false, behavioralFlag: false },
                },
            };
            
            // Recalculate progress
            let completedCount = 0;
            Object.values(updated).forEach((score) => {
                const hasCompleteScores = 
                    score.scores.reading !== null && 
                    score.scores.readingComprehension !== null && 
                    score.scores.spelling !== null && 
                    score.scores.numeracy !== null && 
                    score.scores.writing !== null;
                
                if (hasCompleteScores) {
                    completedCount++;
                }
            });
            
            setProgress({ completed: completedCount, total: Object.keys(updated).length });
            
            return updated;
        });
    };

    const updateFlag = (studentId: string, flag: 'attentionFlag' | 'behavioralFlag', value: boolean) => {
        setScores((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                studentId,
                scores: prev[studentId]?.scores || {},
                flags: {
                    ...prev[studentId]?.flags,
                    [flag]: value,
                },
            },
        }));
    };

    const handleSave = async () => {
        console.log('Save button clicked!');
        console.log('Assessment ID:', assessmentId);
        console.log('Scores:', scores);

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const results = Object.values(scores);

            console.log('Sending results:', results);
            console.log('API URL:', `http://localhost:5000/api/mass-assessment/${assessmentId}/batch-results`);

            const response = await fetch(
                `http://localhost:5000/api/mass-assessment/${assessmentId}/batch-results`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ results }),
                }
            );

            console.log('Response status:', response.status);
            console.log('Response:', response);

            if (response.ok) {
                const data = await response.json();
                console.log('Success response:', data);
                alert('Assessment saved successfully!');
                router.push(`/mass-assessment/assessments/${assessmentId}/results`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                alert('Failed to save assessment: ' + (errorData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save assessment: ' + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="p-8">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Assessment not found</p>
                </div>
            </div>
        );
    }

    const domains = [
        { key: 'reading', label: 'Reading' },
        { key: 'readingComprehension', label: 'Reading Comprehension' },
        { key: 'spelling', label: 'Spelling' },
        { key: 'numeracy', label: 'Numeracy' },
        { key: 'writing', label: 'Writing' },
    ];

    return (
        <div className="p-8">
            <Link
                href="/mass-assessment"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Grade {assessment.grade} {assessment.className && `- ${assessment.className}`}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {assessment.totalStudents} students • {new Date(assessment.assessmentDate).toLocaleDateString()}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-600">
                                Progress: {progress.completed} of {progress.total} students completed
                            </span>
                            <button
                                onClick={fetchAssessment}
                                className="ml-auto text-blue-600 hover:text-blue-700"
                                title="Refresh data"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}% complete
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {progress.completed === progress.total && progress.total > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle className="h-4 w-4" />
                            All Complete
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Assessment
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50">
                                    Student
                                </th>
                                {domains.map((domain) => (
                                    <th key={domain.key} className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                                        {domain.label}
                                        <div className="text-xs font-normal text-gray-500">(0-100%)</div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Flags</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {assessment.results?.map((result: any) => (
                                <tr key={result.studentId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                        {result.student.fullName}
                                    </td>
                                    {domains.map((domain) => (
                                        <td key={domain.key} className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={scores[result.studentId]?.scores?.[domain.key as keyof typeof scores[string]['scores']] || ''}
                                                onChange={(e) => updateScore(result.studentId, domain.key, parseFloat(e.target.value))}
                                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="0-100"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={scores[result.studentId]?.flags?.attentionFlag || false}
                                                    onChange={(e) => updateFlag(result.studentId, 'attentionFlag', e.target.checked)}
                                                    className="rounded text-blue-600"
                                                />
                                                Attention
                                            </label>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={scores[result.studentId]?.flags?.behavioralFlag || false}
                                                    onChange={(e) => updateFlag(result.studentId, 'behavioralFlag', e.target.checked)}
                                                    className="rounded text-blue-600"
                                                />
                                                Behavioral
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Enter scores as percentages (0-100). Check attention or behavioral flags if concerns are noted.
                    Tier allocation will be calculated automatically based on the scores.
                </p>
            </div>
        </div>
    );
}
