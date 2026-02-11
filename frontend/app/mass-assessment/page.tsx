'use client';

import Link from 'next/link';
import { Plus, TrendingUp, Users, AlertTriangle, ClipboardList, AlertCircle } from 'lucide-react';
import { useMassAssessments } from '@/hooks/useMassAssessments';

export default function MassAssessmentDashboard() {
    const { assessments, stats, loading, error } = useMassAssessments();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Error loading dashboard: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mass Assessment Dashboard</h1>
                    <p className="text-gray-600 mt-1">Quick whole-class screening and tier allocation</p>
                </div>
                <Link
                    href="/mass-assessment/upload"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Create Assessment
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Assessments</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalAssessments || 0}</p>
                        </div>
                        <ClipboardList className="h-10 w-10 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Students Screened</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.studentsScreened || 0}</p>
                        </div>
                        <Users className="h-10 w-10 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tier 2 (At Risk)</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.tier2Percentage || 0}%</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tier 3 (High Risk)</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{stats?.tier3Percentage || 0}%</p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Recent Assessments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Assessments</h2>
                </div>
                <div className="p-6">
                    {assessments.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No assessments yet</p>
                            <Link
                                href="/mass-assessment/upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                                Create Your First Assessment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assessments.slice(0, 5).map((assessment: any) => (
                                <Link
                                    key={assessment.id}
                                    href={`/mass-assessment/assessments/${assessment.id}`}
                                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                Grade {assessment.grade} {assessment.className && `- ${assessment.className}`}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {assessment.totalStudents} students • {new Date(assessment.assessmentDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${assessment.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {assessment.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

