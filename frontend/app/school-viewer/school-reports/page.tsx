'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Loader2, Calendar, FileText, TrendingUp } from 'lucide-react';
import { useGenerateSnapshot, useSchoolSnapshots, useCompleteReportData } from '@/hooks/useSchoolReports';
import { useToast } from '@/hooks/use-toast';
import ReactDOMServer from 'react-dom/server';
import { Badge } from '@/components/ui/badge';

import StudentOverviewDashboard from '@/components/school-viewer/StudentOverviewDashboard';
import AssessmentCoverageReport from '@/components/school-viewer/AssessmentCoverageReport';
import SchoolImpactReport from '@/components/school-viewer/SchoolImpactReport';

export default function SchoolReportsPage() {
    const [periodType, setPeriodType] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const { toast } = useToast();

    const { data: snapshotsData, isLoading: loadingSnapshots, refetch } = useSchoolSnapshots({ periodType });
    const generateSnapshot = useGenerateSnapshot();

    // OPTIMIZED: Single API call for all dashboard data
    const { data: reportData, isLoading: loadingReport } = useCompleteReportData({
        snapshotId: selectedSnapshotId,
        periodType: selectedSnapshotId ? undefined : periodType
    });

    const snapshots = snapshotsData?.data || [];
    const snapshot = reportData?.data?.snapshot;
    const school = reportData?.data?.school;

    const handleGenerateReport = async () => {
        try {
            const result = await generateSnapshot.mutateAsync({ periodType });
            toast({
                title: 'Success',
                description: 'New report generated successfully'
            });
            // Refetch snapshots list
            await refetch();
            // Auto-select the newly generated snapshot
            if (result?.data?.id) {
                setSelectedSnapshotId(result.data.id);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate report',
                variant: 'destructive'
            });
        }
    };

    const handleExport = async () => {
        if (!snapshot || !reportData?.data) {
            toast({
                title: 'Warning',
                description: 'Please select a report first',
                variant: 'destructive'
            });
            return;
        }

        try {
            const html2pdf = (await import('html2pdf.js')).default;

            const data = reportData.data;
            const schoolName = school?.name || 'School';

            // Generate filename: SchoolName_MONTHLY_Dec2024.pdf
            const periodMonth = new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const filename = `${schoolName.replace(/\s+/g, '_')}_${snapshot.periodType}_Report_${periodMonth}.pdf`;

            const ReportComponent = (
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '11px', lineHeight: '1.6', color: '#000', padding: '30px 40px', maxWidth: '210mm', background: '#fff' }}>
                    {/* Header */}
                    <div style={{ borderBottom: '3px solid #2c5282', paddingBottom: '15px', marginBottom: '25px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
                            School Performance Report
                        </h1>
                        <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '10px' }}>
                            <strong>{schoolName}</strong>
                        </div>
                        <div style={{ fontSize: '10px', color: '#718096', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div><strong>Reporting Period:</strong> {snapshot.periodType}</div>
                                <div><strong>Period Duration:</strong> {new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(snapshot.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div><strong>Report Generated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                <div><strong>Principal:</strong> {school?.principalName || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Executive Summary */}
                    {snapshot.executiveSummary && (
                        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                                Executive Summary
                            </h2>
                            <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify', color: '#2d3748' }}>
                                {snapshot.executiveSummary}
                            </div>
                        </div>
                    )}

                    {/* 1. Enrollment and Coverage Overview */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            1. Enrollment and Coverage Overview
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            During the reporting period, the school maintained an enrollment of <strong>{snapshot.totalEnrolled} students</strong> across <strong>{snapshot.gradesCovered.length} grade levels</strong> ({snapshot.gradesCovered.join(', ')}).
                            The assessment and intervention program successfully screened <strong>{snapshot.totalScreened} students</strong> and provided targeted support to <strong>{snapshot.totalSupported} students</strong> who demonstrated need for specialized educational interventions.
                            {data.overview?.newStudentsThisMonth > 0 && ` Additionally, ${data.overview.newStudentsThisMonth} new students were enrolled during this period.`}
                        </p>
                        <div style={{ fontSize: '10px', marginLeft: '20px' }}>
                            <div style={{ marginBottom: '4px' }}>• <strong>Total Enrolled Students:</strong> {snapshot.totalEnrolled}</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>Students Screened:</strong> {snapshot.totalScreened} ({((snapshot.totalScreened / snapshot.totalEnrolled) * 100).toFixed(1)}% of enrollment)</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>Students Receiving Support:</strong> {snapshot.totalSupported} ({((snapshot.totalSupported / snapshot.totalEnrolled) * 100).toFixed(1)}% of enrollment)</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>New Students This Period:</strong> {data.overview?.newStudentsThisMonth || 0}</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>Grade Levels Covered:</strong> {snapshot.gradesCovered.join(', ')}</div>
                        </div>
                    </div>

                    {/* 2. Student Risk Distribution */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            2. Student Risk Category Distribution
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            Students are categorized into three risk levels based on comprehensive assessments. The current distribution reflects the varying levels of support required across the student population.
                            {snapshot.highSupportReduction !== null && snapshot.highSupportReduction > 0 &&
                                ` Notably, there has been a ${snapshot.highSupportReduction.toFixed(1)}% reduction in high-support students compared to the previous period, indicating positive intervention outcomes.`}
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Risk Category</th>
                                    <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Count</th>
                                    <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Percentage</th>
                                    <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Change from Previous Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>High Support Needed</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.highSupportCount}</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{((snapshot.highSupportCount / snapshot.totalEnrolled) * 100).toFixed(1)}%</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                        {snapshot.highSupportReduction !== null
                                            ? (snapshot.highSupportReduction > 0 ? `↓ ${snapshot.highSupportReduction.toFixed(1)}%` : `↑ ${Math.abs(snapshot.highSupportReduction).toFixed(1)}%`)
                                            : 'N/A'}
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Moderate Support Needed</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.moderateSupportCount}</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{((snapshot.moderateSupportCount / snapshot.totalEnrolled) * 100).toFixed(1)}%</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                        {snapshot.moderateSupportReduction !== null
                                            ? (snapshot.moderateSupportReduction > 0 ? `↓ ${snapshot.moderateSupportReduction.toFixed(1)}%` : `↑ ${Math.abs(snapshot.moderateSupportReduction).toFixed(1)}%`)
                                            : 'N/A'}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px' }}>On Track</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.onTrackCount}</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{((snapshot.onTrackCount / snapshot.totalEnrolled) * 100).toFixed(1)}%</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>
                                        {snapshot.onTrackIncrease !== null
                                            ? (snapshot.onTrackIncrease > 0 ? `↑ ${snapshot.onTrackIncrease.toFixed(1)}%` : `↓ ${Math.abs(snapshot.onTrackIncrease).toFixed(1)}%`)
                                            : 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Student Progress Analysis */}
                    {data.overview?.studentsByProgressLevel && (
                        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                                3. Student Progress Trends
                            </h2>
                            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                                Based on IEP (Individualized Education Program) goal progress tracking, students are categorized into three progress levels.
                                Students showing improvement (progress greater than +5%) demonstrate positive response to interventions, while those requiring attention (progress less than -5%) may need intervention strategy adjustments.
                            </p>
                            <div style={{ fontSize: '10px', marginLeft: '20px' }}>
                                <div style={{ marginBottom: '6px' }}>
                                    • <strong>Improving ({data.overview.studentsByProgressLevel.improving} students):</strong> These students have shown progress improvement greater than 5% on their IEP goals, indicating effective intervention strategies.
                                </div>
                                <div style={{ marginBottom: '6px' }}>
                                    • <strong>Stable ({data.overview.studentsByProgressLevel.stable} students):</strong> These students maintain consistent performance with progress changes between -5% and +5%, demonstrating steady development.
                                </div>
                                <div style={{ marginBottom: '6px' }}>
                                    • <strong>Requires Attention ({data.overview.studentsByProgressLevel.requiresAttention} students):</strong> These students have shown progress decline greater than 5%, warranting review and potential modification of intervention strategies.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Intervention Activities */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            4. Intervention Activities and Outcomes
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            During this reporting period, the school conducted <strong>{snapshot.totalSessions} therapy sessions</strong>, averaging approximately <strong>{Math.round(snapshot.totalSessions / (snapshot.totalSupported || 1))} sessions per supported student</strong>.
                            These interventions were delivered through a combination of individual support plans, small-group sessions, and classroom-based strategies.
                        </p>
                        {data.impact?.interventionEvidence && (
                            <div style={{ fontSize: '10px', marginLeft: '20px', marginBottom: '10px' }}>
                                <div style={{ marginBottom: '4px' }}>• <strong>Individual Support Plans Created:</strong> {data.impact.interventionEvidence.individualSupportPlansCreated} IEP goals established</div>
                                <div style={{ marginBottom: '4px' }}>• <strong>Small-Group Interventions:</strong> {data.impact.interventionEvidence.smallGroupInterventions} therapy sessions conducted</div>
                                <div style={{ marginBottom: '4px' }}>• <strong>AI-Generated Strategy Recommendations:</strong> {data.impact.interventionEvidence.classroomStrategyRecommendations} comprehensive reports provided to educators</div>
                                <div style={{ marginBottom: '4px' }}>• <strong>Review Cycles Completed:</strong> {data.impact.interventionEvidence.reviewCyclesCompleted} IEP goals with multiple progress assessments</div>
                            </div>
                        )}
                    </div>

                    {/* 5. Teacher Time Efficiency */}
                    {data.impact?.timeSaved && (
                        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                                5. Teacher Time Efficiency Analysis
                            </h2>
                            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                                The implementation of AI-powered assessment and intervention tools has resulted in significant time savings for educators.
                                During this period, an estimated <strong>{data.impact.timeSaved.totalTimeSaved} hours</strong> were saved across various teaching activities, allowing educators to focus more time on direct student instruction and personalized support.
                            </p>
                            <div style={{ fontSize: '10px', marginLeft: '20px' }}>
                                <div style={{ marginBottom: '4px' }}>• <strong>Manual Observation Time Saved:</strong> {data.impact.timeSaved.manualObservationTimeSaved} hours (automated assessment tools reduced manual observation requirements)</div>
                                <div style={{ marginBottom: '4px' }}>• <strong>Lesson Planning Time Saved:</strong> {data.impact.timeSaved.lessonPlanningTimeSaved} hours (AI-generated lesson plan recommendations and templates)</div>
                                <div style={{ marginBottom: '4px' }}>• <strong>Progress Tracking Time Saved:</strong> {data.impact.timeSaved.trackingWorkloadTimeSaved} hours (automated progress monitoring and reporting)</div>
                                <div style={{ marginBottom: '4px' }}>• <strong>Differentiation Support Time Saved:</strong> {data.impact.timeSaved.differentiationSupportTimeSaved} hours (AI-powered personalized strategy recommendations)</div>
                            </div>
                        </div>
                    )}

                    {/* 6. AI-Generated Recommendations */}
                    {snapshot.recommendations && (
                        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                                6. Strategic Recommendations
                            </h2>
                            <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify', color: '#2d3748' }}>
                                {snapshot.recommendations}
                            </div>
                        </div>
                    )}

                    {/* Conclusion */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            Conclusion
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify' }}>
                            This report demonstrates the school's commitment to data-driven educational interventions and continuous improvement in student outcomes.
                            The comprehensive assessment and support program has successfully identified and addressed the diverse learning needs of the student population.
                            Continued monitoring and evidence-based intervention strategies will be essential to maintain and enhance these positive trends in student achievement and well-being.
                        </p>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '2px solid #cbd5e0', fontSize: '9px', color: '#718096', textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px' }}>
                            <strong>Report Generated:</strong> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            <strong>Confidential Document</strong> - For educational and administrative purposes only
                        </div>
                        <div style={{ fontSize: '8px', color: '#a0aec0' }}>
                            © {new Date().getFullYear()} Knowled Assessment Platform | AI-Powered Educational Insights
                        </div>
                    </div>
                </div>
            );

            const html = ReactDOMServer.renderToStaticMarkup(ReportComponent);
            const opt = {
                margin: 15,
                filename: filename,
                image: { type: 'jpeg' as const, quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            html2pdf().from(html).set(opt).save();
            toast({ title: 'Success', description: `Professional report exported as ${filename}` });
        } catch (error) {
            console.error('Failed to export PDF:', error);
            toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' });
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPeriodBadgeColor = (type: string) => {
        switch (type) {
            case 'MONTHLY': return 'bg-blue-100 text-blue-800';
            case 'QUARTERLY': return 'bg-purple-100 text-purple-800';
            case 'YEARLY': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">School Reports</h1>
                    <p className="text-gray-600 mt-1">Comprehensive analytics and insights for your school</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerateReport}
                        variant="default"
                        disabled={generateSnapshot.isPending}
                    >
                        {generateSnapshot.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Generate New Report
                    </Button>
                    {selectedSnapshotId && (
                        <Button onClick={handleExport} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    )}
                </div>
            </div>

            {/* Period Type Selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">Filter by Period:</label>
                        <Select value={periodType} onValueChange={(value: any) => {
                            setPeriodType(value);
                            setSelectedSnapshotId(null); // Reset selection when changing period
                        }}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Snapshots List */}
            <Card>
                <CardHeader>
                    <CardTitle>Previously Generated Reports</CardTitle>
                    <CardDescription>Select a report to view detailed analytics</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSnapshots ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            <span className="ml-2 text-gray-600">Loading reports...</span>
                        </div>
                    ) : snapshots.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-2">No reports generated yet for this period</p>
                            <p className="text-sm text-gray-500">Click "Generate New Report" to create your first report</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {snapshots.map((snapshot: any) => (
                                <Card
                                    key={snapshot.id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${selectedSnapshotId === snapshot.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                                        }`}
                                    onClick={() => setSelectedSnapshotId(snapshot.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <Badge className={getPeriodBadgeColor(snapshot.periodType)}>
                                                {snapshot.periodType}
                                            </Badge>
                                            {selectedSnapshotId === snapshot.id && (
                                                <Badge variant="default">Selected</Badge>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {formatDate(snapshot.createdAt)}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <TrendingUp className="h-4 w-4 mr-2" />
                                                {snapshot.totalSupported} students supported
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                Period: {new Date(snapshot.periodStart).toLocaleDateString()} - {new Date(snapshot.periodEnd).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Report Details - Only show when a snapshot is selected */}
            {selectedSnapshotId && (
                loadingReport ? (
                    <Card>
                        <CardContent className="p-12">
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                <span className="ml-3 text-gray-600">Loading report data...</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : reportData?.data ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Student Overview</TabsTrigger>
                            <TabsTrigger value="assessment">Assessment & Coverage</TabsTrigger>
                            <TabsTrigger value="impact">School Impact</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <StudentOverviewDashboard data={reportData.data.overview} snapshot={snapshot} />
                        </TabsContent>

                        <TabsContent value="assessment" className="space-y-6">
                            <AssessmentCoverageReport data={reportData.data.assessment} snapshot={snapshot} />
                        </TabsContent>

                        <TabsContent value="impact" className="space-y-6">
                            <SchoolImpactReport data={reportData.data.impact} snapshot={snapshot} />
                        </TabsContent>
                    </Tabs>
                ) : null
            )}
        </div>
    );
}
