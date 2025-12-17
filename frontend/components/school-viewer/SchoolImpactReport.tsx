'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Target, Calendar, Clock, FileCheck, MessageSquare, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalculationInfo, CALCULATION_METHODS } from './CalculationInfo';

interface Props {
    data: any;
    snapshot: any;
}

export default function SchoolImpactReport({ data, snapshot }: Props) {
    if (!data || !snapshot) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <p className="text-gray-600">No data available</p>
                </CardContent>
            </Card>
        );
    }

    const improvements = data.averageImprovementByDomain || {};

    // Data for improvement chart
    const improvementData = Object.entries(improvements).map(([domain, improvement]) => ({
        domain,
        improvement: improvement as number
    }));

    return (
        <div className="space-y-6">
            {/* AI-Generated Impact Narrative */}
            {data.narrative && (
                <Card>
                    <CardHeader>
                        <CardTitle>School Impact Analysis</CardTitle>
                        <CardDescription>AI-generated insights on program effectiveness</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {data.narrative}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Impact Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Children Supported</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.studentsSupported}</div>
                        <p className="text-xs text-muted-foreground">
                            Receiving interventions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{snapshot.totalSessions}</div>
                        <p className="text-xs text-muted-foreground">
                            Avg {Math.round(snapshot.totalSessions / (data.studentsSupported || 1))} per student
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Reduction</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.riskLevelReduction?.highSupportReduction !== null && data.riskLevelReduction?.highSupportReduction > 0
                                ? `${data.riskLevelReduction.highSupportReduction.toFixed(1)}%`
                                : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            High support reduction
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* NEW: Time Saved for Teachers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Time Saved for Teachers
                    </CardTitle>
                    <CardDescription>Estimated time savings from platform usage</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-blue-900 font-medium">Manual Observation</p>
                                <CalculationInfo {...CALCULATION_METHODS.timeSavedObservation} />
                            </div>
                            <p className="text-2xl font-bold text-blue-700">{data.timeSaved?.manualObservationTimeSaved || 0}h</p>
                            <p className="text-xs text-blue-600 mt-1">Time saved</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-purple-900 font-medium">Lesson Planning</p>
                                <CalculationInfo {...CALCULATION_METHODS.timeSavedPlanning} />
                            </div>
                            <p className="text-2xl font-bold text-purple-700">{data.timeSaved?.lessonPlanningTimeSaved || 0}h</p>
                            <p className="text-xs text-purple-600 mt-1">Time saved</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-green-900 font-medium">Tracking Workload</p>
                                <CalculationInfo {...CALCULATION_METHODS.timeSavedTracking} />
                            </div>
                            <p className="text-2xl font-bold text-green-700">{data.timeSaved?.trackingWorkloadTimeSaved || 0}h</p>
                            <p className="text-xs text-green-600 mt-1">Time saved</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-orange-900 font-medium">Differentiation Support</p>
                                <CalculationInfo {...CALCULATION_METHODS.timeSavedDifferentiation} />
                            </div>
                            <p className="text-2xl font-bold text-orange-700">{data.timeSaved?.differentiationSupportTimeSaved || 0}h</p>
                            <p className="text-xs text-orange-600 mt-1">Time saved</p>
                        </div>
                    </div>
                    <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-indigo-900 font-medium mb-1">Total Time Saved This Period</p>
                                <p className="text-xs text-indigo-700">Cumulative across all categories</p>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-bold text-indigo-700">{data.timeSaved?.totalTimeSaved || 0}</p>
                                <p className="text-sm text-indigo-600">hours</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Average Improvement Per Domain */}
            <Card>
                <CardHeader>
                    <CardTitle>Average Improvement Per Domain</CardTitle>
                    <CardDescription>Progress across learning areas</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={improvementData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="domain" />
                            <YAxis label={{ value: '% Improvement', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="improvement" stroke="#10b981" strokeWidth={2} name="Improvement %" />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {improvementData.map((item) => (
                            <div key={item.domain} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{item.domain}</p>
                                    <p className="text-xs text-gray-600">Domain</p>
                                </div>
                                <div className="flex items-center">
                                    <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                                    <span className="text-lg font-bold text-green-600">{item.improvement}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Risk-Level Reduction */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk-Level Reduction</CardTitle>
                    <CardDescription>Movement between risk categories</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.riskLevelReduction?.highSupportReduction !== null && (
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">High Support → Moderate Support</p>
                                    <p className="text-sm text-gray-600">Students moving to lower risk</p>
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {data.riskLevelReduction.highSupportReduction > 0 ? `${data.riskLevelReduction.highSupportReduction.toFixed(1)}%` : 'No change'}
                                </div>
                            </div>
                        )}

                        {data.riskLevelReduction?.moderateSupportReduction !== null && (
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">Moderate Support → On Track</p>
                                    <p className="text-sm text-gray-600">Students achieving independence</p>
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {data.riskLevelReduction.moderateSupportReduction > 0 ? `${data.riskLevelReduction.moderateSupportReduction.toFixed(1)}%` : 'No change'}
                                </div>
                            </div>
                        )}

                        {data.riskLevelReduction?.highSupportReduction === null && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No previous period data for comparison</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* NEW: Evidence of Interventions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5" />
                        Evidence of Interventions
                    </CardTitle>
                    <CardDescription>Documented program activities and outcomes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <FileCheck className="h-6 w-6 text-blue-600" />
                                <div className="flex items-center gap-1">
                                    <span className="text-3xl font-bold text-blue-700">{data.interventionEvidence?.individualSupportPlansCreated || 0}</span>
                                    <CalculationInfo {...CALCULATION_METHODS.supportPlans} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-blue-900">Individual Support Plans Created</p>
                            <p className="text-xs text-blue-700 mt-1">IEP goals established</p>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="h-6 w-6 text-purple-600" />
                                <div className="flex items-center gap-1">
                                    <span className="text-3xl font-bold text-purple-700">{data.interventionEvidence?.smallGroupInterventions || 0}</span>
                                    <CalculationInfo {...CALCULATION_METHODS.groupInterventions} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-purple-900">Small-Group Interventions</p>
                            <p className="text-xs text-purple-700 mt-1">Therapy sessions conducted</p>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <MessageSquare className="h-6 w-6 text-green-600" />
                                <div className="flex items-center gap-1">
                                    <span className="text-3xl font-bold text-green-700">{data.interventionEvidence?.classroomStrategyRecommendations || 0}</span>
                                    <CalculationInfo {...CALCULATION_METHODS.strategyRecommendations} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-green-900">Classroom Strategy Recommendations</p>
                            <p className="text-xs text-green-700 mt-1">AI comprehensive reports generated</p>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between mb-2">
                                <BarChart3 className="h-6 w-6 text-orange-600" />
                                <div className="flex items-center gap-1">
                                    <span className="text-3xl font-bold text-orange-700">{data.interventionEvidence?.reviewCyclesCompleted || 0}</span>
                                    <CalculationInfo {...CALCULATION_METHODS.reviewCycles} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-orange-900">Review Cycles Completed</p>
                            <p className="text-xs text-orange-700 mt-1">Goals with 2+ progress updates</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI-Generated Recommendations */}
            {snapshot.recommendations && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recommendations</CardTitle>
                        <CardDescription>AI-generated actionable recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {snapshot.recommendations}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
