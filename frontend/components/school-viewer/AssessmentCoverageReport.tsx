'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Eye, Users, AlertCircle } from 'lucide-react';
import { useStudentDeepAssessment, useTargetedStudents } from '@/hooks/useSchoolReports';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
    data: any;
    snapshot: any;
}

export default function AssessmentCoverageReport({ data, snapshot }: Props) {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const { data: deepAssessment, isLoading: loadingDeepAssessment } = useStudentDeepAssessment(selectedStudentId);
    const { data: targetedStudentsData } = useTargetedStudents();

    if (!data || !snapshot) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <p className="text-gray-600">No data available</p>
                </CardContent>
            </Card>
        );
    }

    const targetedStudents = targetedStudentsData?.data || [];

    // Skill area data for chart
    const skillAreaData = [
        { skill: 'Reading', percent: data.skillAreaMetrics?.readingReadiness || 0 },
        { skill: 'Writing', percent: data.skillAreaMetrics?.writingReadiness || 0 },
        { skill: 'Numeracy', percent: data.skillAreaMetrics?.numeracyReadiness || 0 },
        { skill: 'Attention', percent: data.skillAreaMetrics?.attentionEngagement || 0 },
        { skill: 'Processing', percent: data.skillAreaMetrics?.processingMemory || 0 }
    ];

    const getRiskBadgeColor = (risk: string) => {
        switch (risk) {
            case 'HIGH_SUPPORT': return 'bg-red-100 text-red-800';
            case 'MODERATE_SUPPORT': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* AI-Generated Coverage Narrative */}
            {data.narrative && (
                <Card>
                    <CardHeader>
                        <CardTitle>Coverage Analysis</CardTitle>
                        <CardDescription>AI-generated assessment coverage insights</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {data.narrative}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reach & Coverage Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Reach & Coverage</CardTitle>
                    <CardDescription>Student enrollment and support metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Metric</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-3 px-4">Total Students Enrolled</td>
                                    <td className="py-3 px-4 text-right font-semibold">{data.reachAndCoverage?.totalEnrolled}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-3 px-4">Students Screened</td>
                                    <td className="py-3 px-4 text-right font-semibold">{data.reachAndCoverage?.totalScreened}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-3 px-4">Students Supported</td>
                                    <td className="py-3 px-4 text-right font-semibold">{data.reachAndCoverage?.totalSupported}</td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">Grades Covered</td>
                                    <td className="py-3 px-4 text-right font-semibold">{data.reachAndCoverage?.gradesCovered?.join(', ')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Category Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk Category Trends</CardTitle>
                    <CardDescription>Period-over-period comparison</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Risk Category</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Current Period</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-3 px-4">High Support Needed</td>
                                    <td className="py-3 px-4 text-center font-semibold">{snapshot.highSupportCount}</td>
                                    <td className="py-3 px-4 text-center">
                                        {data.riskCategoryTrends?.highSupportReduction !== null ? (
                                            <div className="flex items-center justify-center">
                                                {data.riskCategoryTrends.highSupportReduction > 0 ? (
                                                    <>
                                                        <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                                                        <span className="text-green-600 font-semibold">
                                                            {data.riskCategoryTrends.highSupportReduction.toFixed(1)}%
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-red-600 mr-1" />
                                                        <span className="text-red-600 font-semibold">
                                                            {Math.abs(data.riskCategoryTrends.highSupportReduction).toFixed(1)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                    </td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-3 px-4">Moderate Support Needed</td>
                                    <td className="py-3 px-4 text-center font-semibold">{snapshot.moderateSupportCount}</td>
                                    <td className="py-3 px-4 text-center">
                                        {data.riskCategoryTrends?.moderateSupportReduction !== null ? (
                                            <div className="flex items-center justify-center">
                                                {data.riskCategoryTrends.moderateSupportReduction > 0 ? (
                                                    <>
                                                        <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                                                        <span className="text-green-600 font-semibold">
                                                            {data.riskCategoryTrends.moderateSupportReduction.toFixed(1)}%
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
                                                        <span className="text-orange-600 font-semibold">
                                                            {Math.abs(data.riskCategoryTrends.moderateSupportReduction).toFixed(1)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4">On Track</td>
                                    <td className="py-3 px-4 text-center font-semibold">{snapshot.onTrackCount}</td>
                                    <td className="py-3 px-4 text-center">
                                        {data.riskCategoryTrends?.onTrackIncrease !== null ? (
                                            <div className="flex items-center justify-center">
                                                {data.riskCategoryTrends.onTrackIncrease > 0 ? (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                                                        <span className="text-green-600 font-semibold">
                                                            {data.riskCategoryTrends.onTrackIncrease.toFixed(1)}%
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                                                        <span className="text-red-600 font-semibold">
                                                            {Math.abs(data.riskCategoryTrends.onTrackIncrease).toFixed(1)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Skill Area Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Skill Area Needs</CardTitle>
                    <CardDescription>Percentage of students needing support by skill area</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={skillAreaData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="skill" />
                            <YAxis label={{ value: '% Needing Support', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="percent" fill="#8b5cf6" name="% Students" />
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Skill Area</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">% Students Needing Support</th>
                                </tr>
                            </thead>
                            <tbody>
                                {skillAreaData.map((item) => (
                                    <tr key={item.skill} className="border-b">
                                        <td className="py-3 px-4">{item.skill} Readiness</td>
                                        <td className="py-3 px-4 text-right font-semibold">{item.percent}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* NEW: Targeted Students for Deep Assessment */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Targeted Students - Deep Assessment
                    </CardTitle>
                    <CardDescription>
                        Students requiring high or moderate support - click to view detailed assessment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {targetedStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p>No targeted students found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {targetedStudents.map((student: any) => (
                                <Card key={student.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                                <p className="text-sm text-gray-600">Grade {student.grade}</p>
                                            </div>
                                            <Badge className={getRiskBadgeColor(student.riskCategory)}>
                                                {student.riskCategory === 'HIGH_SUPPORT' ? 'High' : 'Moderate'}
                                            </Badge>
                                        </div>
                                        {student.latestReportDate && (
                                            <p className="text-xs text-gray-500 mb-3">
                                                Last assessed: {new Date(student.latestReportDate).toLocaleDateString()}
                                            </p>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setSelectedStudentId(student.id)}
                                            disabled={!student.latestReportId}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            {student.latestReportId ? 'View Assessment' : 'No Report Available'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deep Assessment Modal */}
            <Dialog open={!!selectedStudentId} onOpenChange={() => setSelectedStudentId(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Deep Assessment Report</DialogTitle>
                        <DialogDescription>Comprehensive AI-generated assessment and recommendations</DialogDescription>
                    </DialogHeader>
                    {loadingDeepAssessment ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="ml-3 text-gray-600">Loading assessment...</span>
                        </div>
                    ) : deepAssessment?.data ? (
                        <div className="space-y-4">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                <h3 className="font-semibold text-indigo-900 mb-2">Student Information</h3>
                                <p className="text-sm text-indigo-800">
                                    <strong>Name:</strong> {deepAssessment.data.student?.fullName}
                                </p>
                                <p className="text-sm text-indigo-800">
                                    <strong>Grade:</strong> {deepAssessment.data.student?.grade}
                                </p>
                                <p className="text-sm text-indigo-800">
                                    <strong>Assessed by:</strong> {deepAssessment.data.specialEducator?.fullName}
                                </p>
                            </div>
                            <div className="prose max-w-none">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{deepAssessment.data.title || 'Assessment Report'}</h3>
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {deepAssessment.data.content || deepAssessment.data.summary || 'No content available'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No assessment data available</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
