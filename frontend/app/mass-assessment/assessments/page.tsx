'use client';

import Link from 'next/link';
import { ClipboardList, Plus, AlertCircle } from 'lucide-react';
import { useMassAssessments } from '@/hooks/useMassAssessments';

export default function AssessmentsList() {
    const { assessments, loading, error, refreshAssessments } = useMassAssessments();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Error loading assessments: {error}</p>
                    <button 
                        onClick={refreshAssessments}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Assessments</h1>
                    <p className="text-gray-600 mt-1">View and manage all mass assessments</p>
                </div>
                <Link
                    href="/mass-assessment/upload"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Create Assessment
                </Link>
            </div>

            {assessments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No assessments found</p>
                    <Link
                        href="/mass-assessment/upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Create Your First Assessment
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment: any) => (
                        <Link
                            key={assessment.id}
                            href={`/mass-assessment/assessments/${assessment.id}`}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        Grade {assessment.grade}
                                    </h3>
                                    {assessment.className && (
                                        <p className="text-sm text-gray-600">{assessment.className}</p>
                                    )}
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${assessment.status === 'COMPLETED'
                                        ? 'bg-green-100 text-green-700'
                                        : assessment.status === 'IN_PROGRESS'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {assessment.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-medium">Students:</span> {assessment.totalStudents}
                                </p>
                                <p>
                                    <span className="font-medium">Date:</span>{' '}
                                    {new Date(assessment.assessmentDate).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                                    View Details →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

