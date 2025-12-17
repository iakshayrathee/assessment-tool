'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Calendar, Target, UserPlus, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalculationInfo, CALCULATION_METHODS } from './CalculationInfo';

interface Props {
    data: any;
    snapshot: any;
}

const COLORS = {
    highSupport: '#ef4444',
    moderateSupport: '#f59e0b',
    onTrack: '#10b981',
    improving: '#10b981',
    stable: '#3b82f6',
    requiresAttention: '#ef4444'
};

export default function StudentOverviewDashboard({ data, snapshot }: Props) {
    if (!data || !snapshot) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <p className="text-gray-600">No data available</p>
                </CardContent>
            </Card>
        );
    }

    const totalStudents = data.studentsBySeverity.high + data.studentsBySeverity.moderate + data.studentsBySeverity.onTrack;

    // Data for severity pie chart
    const severityData = [
        { name: 'High Support', value: data.studentsBySeverity.high, color: COLORS.highSupport },
        { name: 'Moderate Support', value: data.studentsBySeverity.moderate, color: COLORS.moderateSupport },
        { name: 'On Track', value: data.studentsBySeverity.onTrack, color: COLORS.onTrack }
    ];

    // Data for progress level pie chart
    const progressData = [
        { name: 'Improving', value: data.studentsByProgressLevel?.improving || 0, color: COLORS.improving },
        { name: 'Stable', value: data.studentsByProgressLevel?.stable || 0, color: COLORS.stable },
        { name: 'Requires Attention', value: data.studentsByProgressLevel?.requiresAttention || 0, color: COLORS.requiresAttention }
    ];

    // Data for grade distribution
    const gradeData = data.studentsByGrade.map((grade: string) => ({
        grade,
        count: Math.floor(totalStudents / data.studentsByGrade.length) // Simplified
    }));

    return (
        <div className="space-y-6">
            {/* AI-Generated Executive Summary */}
            {snapshot.executiveSummary && (
                <Card>
                    <CardHeader>
                        <CardTitle>Executive Summary</CardTitle>
                        <CardDescription>AI-generated insights for this period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                            {snapshot.executiveSummary}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students Under Support</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalStudentsUnderSupport}</div>
                        <p className="text-xs text-muted-foreground">
                            Out of {snapshot.totalEnrolled} enrolled
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-1">
                            <CardTitle className="text-sm font-medium">New Students This Month</CardTitle>
                            <CalculationInfo {...CALCULATION_METHODS.newStudents} />
                        </div>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.newStudentsThisMonth || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Recently enrolled
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalSessionsThisMonth}</div>
                        <p className="text-xs text-muted-foreground">
                            Therapy sessions conducted
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Grades Covered</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.studentsByGrade.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.studentsByGrade.join(', ')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students by Severity - Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Students by Severity</CardTitle>
                        <CardDescription>Distribution across risk categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {severityData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{item.value} students</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* NEW: Students by Progress Level - Pie Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>Students by Progress Level</CardTitle>
                            <CalculationInfo {...CALCULATION_METHODS.progressLevels} />
                        </div>
                        <CardDescription>Based on IEP goal progress trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={progressData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {progressData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                            {progressData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{item.value} students</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Category Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk Category Trends</CardTitle>
                    <CardDescription>Period-over-period changes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {snapshot.highSupportReduction !== null && (
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-red-900">High Support</p>
                                    <p className="text-xs text-red-700">{snapshot.highSupportCount} students</p>
                                </div>
                                <div className="flex items-center">
                                    {snapshot.highSupportReduction > 0 ? (
                                        <>
                                            <TrendingDown className="h-5 w-5 text-green-600 mr-1" />
                                            <span className="text-lg font-bold text-green-600">
                                                {snapshot.highSupportReduction.toFixed(1)}%
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="h-5 w-5 text-red-600 mr-1" />
                                            <span className="text-lg font-bold text-red-600">
                                                {Math.abs(snapshot.highSupportReduction).toFixed(1)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {snapshot.moderateSupportReduction !== null && (
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-orange-900">Moderate Support</p>
                                    <p className="text-xs text-orange-700">{snapshot.moderateSupportCount} students</p>
                                </div>
                                <div className="flex items-center">
                                    {snapshot.moderateSupportReduction > 0 ? (
                                        <>
                                            <TrendingDown className="h-5 w-5 text-green-600 mr-1" />
                                            <span className="text-lg font-bold text-green-600">
                                                {snapshot.moderateSupportReduction.toFixed(1)}%
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="h-5 w-5 text-orange-600 mr-1" />
                                            <span className="text-lg font-bold text-orange-600">
                                                {Math.abs(snapshot.moderateSupportReduction).toFixed(1)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {snapshot.onTrackIncrease !== null && (
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-green-900">On Track</p>
                                    <p className="text-xs text-green-700">{snapshot.onTrackCount} students</p>
                                </div>
                                <div className="flex items-center">
                                    {snapshot.onTrackIncrease > 0 ? (
                                        <>
                                            <TrendingUp className="h-5 w-5 text-green-600 mr-1" />
                                            <span className="text-lg font-bold text-green-600">
                                                {snapshot.onTrackIncrease.toFixed(1)}%
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="h-5 w-5 text-red-600 mr-1" />
                                            <span className="text-lg font-bold text-red-600">
                                                {Math.abs(snapshot.onTrackIncrease).toFixed(1)}%
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {snapshot.highSupportReduction === null && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No previous period data for comparison</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Students by Grade */}
            <Card>
                <CardHeader>
                    <CardTitle>Students by Grade</CardTitle>
                    <CardDescription>Distribution across grade levels</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={gradeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="grade" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#6366f1" name="Students" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
