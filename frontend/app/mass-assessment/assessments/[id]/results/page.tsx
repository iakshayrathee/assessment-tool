'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Brain, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface HeatmapData {
    studentId: string;
    studentName: string;
    scores: {
        reading?: number;
        readingComprehension?: number;
        spelling?: number;
        numeracy?: number;
        writing?: number;
    };
    tier: string;
    flags: {
        attention: boolean;
        behavioral: boolean;
    };
}

interface TierDistribution {
    TIER_1_UNIVERSAL: number;
    TIER_2_AT_RISK: number;
    TIER_3_HIGH_RISK: number;
}

export default function AssessmentResults() {
    const params = useParams();
    const assessmentId = params.id as string;

    const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
    const [tierDistribution, setTierDistribution] = useState<TierDistribution | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        fetchResults();
    }, [assessmentId]);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('token');

            const [heatmapRes, tierRes] = await Promise.all([
                fetch(`http://localhost:5000/api/mass-assessment/${assessmentId}/heatmap`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`http://localhost:5000/api/mass-assessment/${assessmentId}/tiers`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (heatmapRes.ok) {
                const data = await heatmapRes.json();
                setHeatmap(data.heatmap || []);
            }

            if (tierRes.ok) {
                const data = await tierRes.json();
                setTierDistribution(data.distribution);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAIAnalysis = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5000/api/mass-assessment/${assessmentId}/analyze`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setAnalysis(data.analysis);
            }
        } catch (error) {
            console.error('Failed to generate analysis:', error);
        }
    };

    const getScoreColor = (score?: number) => {
        if (!score) return 'bg-gray-100';
        if (score >= 70) return 'bg-green-100 text-green-800';
        if (score >= 40) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getTierColor = (tier: string) => {
        if (tier === 'TIER_1_UNIVERSAL') return 'bg-green-100 text-green-800';
        if (tier === 'TIER_2_AT_RISK') return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getTierLabel = (tier: string) => {
        if (tier === 'TIER_1_UNIVERSAL') return 'Tier 1';
        if (tier === 'TIER_2_AT_RISK') return 'Tier 2';
        return 'Tier 3';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const domains = [
        { key: 'reading', label: 'Reading' },
        { key: 'readingComprehension', label: 'Comprehension' },
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
                    <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
                    <p className="text-gray-600 mt-1">Class performance heatmap and tier allocation</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={generateAIAnalysis}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Brain className="h-4 w-4" />
                        AI Analysis
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Tier Distribution */}
            {tierDistribution && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-600">Tier 1 - Universal</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {tierDistribution.TIER_1_UNIVERSAL}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">On track students</p>
                            </div>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-600">Tier 2 - At Risk</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">
                                    {tierDistribution.TIER_2_AT_RISK}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Need support</p>
                            </div>
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">⚠</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-600">Tier 3 - High Risk</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">
                                    {tierDistribution.TIER_3_HIGH_RISK}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Intensive intervention</p>
                            </div>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">!</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Class Heatmap */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Class Performance Heatmap</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Color-coded by performance: <span className="text-green-600">Green (70-100%)</span>,{' '}
                        <span className="text-yellow-600">Yellow (40-69%)</span>,{' '}
                        <span className="text-red-600">Red (&lt;40%)</span>
                    </p>
                </div>
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
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Tier</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {heatmap.map((student) => (
                                <tr key={student.studentId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                        {student.studentName}
                                        {(student.flags.attention || student.flags.behavioral) && (
                                            <div className="flex gap-1 mt-1">
                                                {student.flags.attention && (
                                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                                        Attention
                                                    </span>
                                                )}
                                                {student.flags.behavioral && (
                                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                                        Behavioral
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    {domains.map((domain) => {
                                        const score = student.scores[domain.key as keyof typeof student.scores];
                                        return (
                                            <td key={domain.key} className="px-4 py-3 text-center">
                                                <div
                                                    className={`inline-block px-3 py-1 rounded font-medium ${getScoreColor(score)}`}
                                                >
                                                    {score !== undefined ? `${score}%` : '-'}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(student.tier)}`}>
                                            {getTierLabel(student.tier)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowOverrideModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Analysis */}
            {analysis && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Generated Insights</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Common Skill Gaps</h3>
                            <ul className="list-disc list-inside text-gray-700">
                                {analysis.commonSkillGaps?.map((gap: string, i: number) => (
                                    <li key={i}>{gap}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Recommended Teaching Strategies</h3>
                            <ul className="list-disc list-inside text-gray-700">
                                {analysis.teachingStrategies?.map((strategy: string, i: number) => (
                                    <li key={i}>{strategy}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
