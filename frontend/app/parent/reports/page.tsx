'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    BarChart3,
    Target,
    CheckCircle,
    AlertCircle,
    BookOpen,
    GraduationCap,
    Activity,
    RefreshCw,
    Users,
    X,
    Clock
} from 'lucide-react';
import { useCompleteParentReportData, useGenerateParentSnapshot, useParentSnapshots } from '@/hooks/useParentReports';
import ReactDOMServer from 'react-dom/server';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';

type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export default function ParentReportsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('MONTHLY');
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPeriodFilter, setHistoryPeriodFilter] = useState<PeriodType | 'ALL'>('ALL');

    // Fetch parent dashboard to get children
    const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
        queryKey: ['parent-dashboard'],
        queryFn: () => apiClient.getParentDashboard(),
        enabled: !!user
    });

    // Get children list
    const children = dashboardData?.children || [];

    // Auto-select first child if not selected
    const studentId = selectedChildId || children[0]?.id;

    // Fetch snapshots list for history modal
    const { data: snapshotsData, isLoading: snapshotsLoading } = useParentSnapshots(studentId, {
        page: historyPage,
        limit: 10,
        periodType: historyPeriodFilter === 'ALL' ? undefined : historyPeriodFilter
    });

    // Fetch complete report data
    const { data: reportData, isLoading: reportLoading, refetch } = useCompleteParentReportData(
        studentId,
        selectedSnapshotId ? { snapshotId: selectedSnapshotId } : { periodType: selectedPeriod }
    );

    // Generate snapshot mutation
    const generateSnapshot = useGenerateParentSnapshot(studentId);

    const handleGenerateReport = async () => {
        try {
            await generateSnapshot.mutateAsync({ periodType: selectedPeriod });
            toast({
                title: 'Success',
                description: 'New report generated successfully'
            });
            refetch();
        } catch (error) {
            console.error('Failed to generate report:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate report',
                variant: 'destructive'
            });
        }
    };

    const handleExportPDF = async () => {
        if (!reportData?.snapshot) {
            toast({
                title: 'Warning',
                description: 'Please select a report first',
                variant: 'destructive'
            });
            return;
        }

        try {
            const html2pdf = (await import('html2pdf.js')).default;

            const snapshot = reportData.snapshot;
            const student = reportData.student;
            const studentName = student?.fullName || snapshot.studentName;

            // Generate filename
            const periodMonth = new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const filename = `${studentName.replace(/\s+/g, '_')}_Progress_Report_${periodMonth}.pdf`;

            const ReportComponent = (
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '11px', lineHeight: '1.6', color: '#000', padding: '30px 40px', maxWidth: '210mm', background: '#fff' }}>
                    {/* Header */}
                    <div style={{ borderBottom: '3px solid #2c5282', paddingBottom: '15px', marginBottom: '25px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
                            Student Progress Report
                        </h1>
                        <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '10px' }}>
                            <strong>{studentName}</strong> - Grade {snapshot.studentGrade}
                        </div>
                        <div style={{ fontSize: '10px', color: '#718096', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div><strong>Reporting Period:</strong> {snapshot.periodType}</div>
                                <div><strong>Period Duration:</strong> {new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(snapshot.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div><strong>Report Generated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                <div><strong>Special Educator:</strong> {snapshot.assignedEducatorName || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Parent-Friendly Summary */}
                    {snapshot.parentFriendlySummary && (
                        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid', background: '#f7fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px' }}>
                                Summary for Parents
                            </h2>
                            <div style={{ fontSize: '10px', lineHeight: '1.7', color: '#2d3748' }}>
                                {snapshot.parentFriendlySummary}
                            </div>
                        </div>
                    )}

                    {/* 1. Assessment Summary */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            1. Assessment Summary
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            During this period, your child completed <strong>{snapshot.totalAssessments} assessment{snapshot.totalAssessments !== 1 ? 's' : ''}</strong>.
                            {snapshot.latestAssessmentDate && ` The most recent assessment was conducted on ${new Date(snapshot.latestAssessmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`}
                            {snapshot.riskLevel && ` Current support level: ${snapshot.riskLevel}.`}
                        </p>
                        <div style={{ fontSize: '10px', marginLeft: '20px' }}>
                            <div style={{ marginBottom: '4px' }}>• <strong>Total Assessments:</strong> {snapshot.totalAssessments}</div>
                            {snapshot.latestAssessmentScore && <div style={{ marginBottom: '4px' }}>• <strong>Latest Assessment Score:</strong> {snapshot.latestAssessmentScore.toFixed(1)}%</div>}
                            <div style={{ marginBottom: '4px' }}>• <strong>Support Level:</strong> {snapshot.riskLevel || 'Not assessed'}</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>Progress:</strong> {snapshot.assessmentProgress || 'In progress'}</div>
                        </div>
                    </div>

                    {/* 2. Progress Tracking */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            2. Learning Progress by Subject Area
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            Your child's progress is tracked across different learning areas. The percentages below show improvement compared to previous assessments.
                            {snapshot.overallGoalCompletion && ` Overall, ${snapshot.overallGoalCompletion.toFixed(0)}% of learning goals have been achieved.`}
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Learning Area</th>
                                    <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Progress</th>
                                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Reading</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.readingProgress !== null ? `${snapshot.readingProgress > 0 ? '+' : ''}${snapshot.readingProgress.toFixed(1)}%` : 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{snapshot.readingProgress !== null && snapshot.readingProgress > 0 ? 'Improving' : 'Needs support'}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Writing</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.writingProgress !== null ? `${snapshot.writingProgress > 0 ? '+' : ''}${snapshot.writingProgress.toFixed(1)}%` : 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{snapshot.writingProgress !== null && snapshot.writingProgress > 0 ? 'Improving' : 'Needs support'}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Mathematics</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.mathProgress !== null ? `${snapshot.mathProgress > 0 ? '+' : ''}${snapshot.mathProgress.toFixed(1)}%` : 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{snapshot.mathProgress !== null && snapshot.mathProgress > 0 ? 'Improving' : 'Needs support'}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px' }}>Attention & Focus</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.attentionProgress !== null ? `${snapshot.attentionProgress > 0 ? '+' : ''}${snapshot.attentionProgress.toFixed(1)}%` : 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{snapshot.attentionProgress !== null && snapshot.attentionProgress > 0 ? 'Improving' : 'Needs support'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Attendance & Participation */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            3. Attendance & Session Participation
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            Regular attendance is important for your child's progress. During this period, <strong>{snapshot.sessionsAttended} out of {snapshot.totalSessionsScheduled} scheduled sessions</strong> were attended.
                            {snapshot.participationRate && ` This represents a ${snapshot.participationRate.toFixed(0)}% attendance rate.`}
                        </p>
                        <div style={{ fontSize: '10px', marginLeft: '20px' }}>
                            <div style={{ marginBottom: '4px' }}>• <strong>Sessions Scheduled:</strong> {snapshot.totalSessionsScheduled}</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>Sessions Attended:</strong> {snapshot.sessionsAttended}</div>
                            <div style={{ marginBottom: '4px' }}>• <strong>Attendance Rate:</strong> {snapshot.participationRate?.toFixed(0) || 'N/A'}%</div>
                            {snapshot.lastSessionDate && <div style={{ marginBottom: '4px' }}>• <strong>Last Session:</strong> {new Date(snapshot.lastSessionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
                        </div>
                    </div>

                    {/* 4. Individual Intervention Plan */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            4. Individual Intervention Plan
                        </h2>

                        {/* Focus Areas */}
                        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#2d3748', marginTop: '15px', marginBottom: '8px' }}>
                            Focus Areas for Intervention
                        </h3>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
                            The following learning areas have been identified for targeted support:
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '15px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Learning Area</th>
                                    <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Support Required</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Reading</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.focusReading ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Writing</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.focusWriting ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Mathematics</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.focusMathematics ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '8px' }}>Attention & Focus</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.focusAttention ? 'Yes' : 'No'}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px' }}>Learning Confidence</td>
                                    <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.focusConfidence ? 'Yes' : 'No'}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Intervention Goals */}
                        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#2d3748', marginTop: '15px', marginBottom: '8px' }}>
                            Intervention Goals
                        </h3>
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>Short-Term Goals (Next 4-6 Weeks):</div>
                            <div style={{ fontSize: '10px', lineHeight: '1.7', marginLeft: '15px', whiteSpace: 'pre-wrap' }}>
                                {snapshot.shortTermGoals || 'Goals will be set by your child\'s educator'}
                            </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px' }}>Long-Term Goals (Overall Plan Period):</div>
                            <div style={{ fontSize: '10px', lineHeight: '1.7', marginLeft: '15px', whiteSpace: 'pre-wrap' }}>
                                {snapshot.longTermGoals || 'Long-term goals will be developed based on progress'}
                            </div>
                        </div>

                        {/* Intervention Strategies */}
                        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#2d3748', marginTop: '15px', marginBottom: '8px' }}>
                            Intervention Strategies & Support Plan
                        </h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Area</th>
                                    <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>How Support Will Be Provided</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshot.readingStrategy && (
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px' }}>Reading</td>
                                        <td style={{ padding: '8px' }}>{snapshot.readingStrategy}</td>
                                    </tr>
                                )}
                                {snapshot.writingStrategy && (
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px' }}>Writing</td>
                                        <td style={{ padding: '8px' }}>{snapshot.writingStrategy}</td>
                                    </tr>
                                )}
                                {snapshot.mathematicsStrategy && (
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px' }}>Mathematics</td>
                                        <td style={{ padding: '8px' }}>{snapshot.mathematicsStrategy}</td>
                                    </tr>
                                )}
                                {snapshot.attentionStrategy && (
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '8px' }}>Attention</td>
                                        <td style={{ padding: '8px' }}>{snapshot.attentionStrategy}</td>
                                    </tr>
                                )}
                                {snapshot.confidenceStrategy && (
                                    <tr>
                                        <td style={{ padding: '8px' }}>Confidence</td>
                                        <td style={{ padding: '8px' }}>{snapshot.confidenceStrategy}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Educator Notes */}
                    {snapshot.educatorNotes && (
                        <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                                Educator's Notes
                            </h2>
                            <div style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify', color: '#2d3748' }}>
                                {snapshot.educatorNotes}
                            </div>
                        </div>
                    )}

                    {/* Next Steps */}
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                            Next Steps
                        </h2>
                        <p style={{ fontSize: '10px', lineHeight: '1.7', textAlign: 'justify' }}>
                            We encourage you to stay involved in your child's learning journey. Please:
                        </p>
                        <div style={{ fontSize: '10px', marginLeft: '20px', marginTop: '8px' }}>
                            <div style={{ marginBottom: '4px' }}>• Review this report with your child's special educator</div>
                            <div style={{ marginBottom: '4px' }}>• Practice the recommended strategies at home</div>
                            <div style={{ marginBottom: '4px' }}>• Ensure regular attendance at scheduled sessions</div>
                            <div style={{ marginBottom: '4px' }}>• Communicate any concerns or observations with the educator</div>
                            {snapshot.nextReviewDate && <div style={{ marginBottom: '4px' }}>• <strong>Next Review Date:</strong> {new Date(snapshot.nextReviewDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '2px solid #cbd5e0', fontSize: '9px', color: '#718096', textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px' }}>
                            <strong>Report Generated:</strong> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            <strong>Confidential Document</strong> - For educational purposes only
                        </div>
                        <div style={{ fontSize: '8px', color: '#a0aec0' }}>
                            © {new Date().getFullYear()} Knowled Assessment Platform | Supporting Every Child's Learning Journey
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
            toast({ title: 'Success', description: `Report exported as ${filename}` });
        } catch (error) {
            console.error('Failed to export PDF:', error);
            toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' });
        }
    };

    const snapshot = reportData?.snapshot;
    const student = reportData?.student;

    if (dashboardLoading) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!studentId || children.length === 0) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>No Children Found</CardTitle>
                        <CardDescription>Please contact support to link your child's profile.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <PageWrapper
            title="Progress Reports"
            description="View your child's learning progress and intervention plan"
            breadcrumbs={[{ label: 'Parent', href: '/parent' }, { label: 'Reports' }]}
            actions={
                <div className="flex gap-2">
                    <Button
                        onClick={handleGenerateReport}
                        disabled={generateSnapshot.isPending}
                        variant="outline"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${generateSnapshot.isPending ? 'animate-spin' : ''}`} />
                        {generateSnapshot.isPending ? 'Generating...' : 'Generate New Report'}
                    </Button>
                    {snapshot && (
                        <Button
                            onClick={handleExportPDF}
                            variant="default"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>
                    )}
                </div>
            }
        >

            {/* Period Selector & Child Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Report Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Child Selector */}
                    {children.length > 1 && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Select Child</label>
                            <Select value={studentId} onValueChange={(value) => setSelectedChildId(value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {children.map((child: any) => (
                                        <SelectItem key={child.id} value={child.id}>
                                            {child.fullName} - Grade {child.grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Period Selector */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Report Period</label>
                        <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodType)}>
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

                    {/* View Previous Reports Button */}
                    {snapshotsData && snapshotsData.pagination.total > 0 && (
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowHistoryModal(true)}
                                className="w-full"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                View Previous Reports ({snapshotsData.pagination.total})
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Report History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-border">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Report History</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHistoryModal(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="mt-4 flex gap-4">
                                <Select
                                    value={historyPeriodFilter}
                                    onValueChange={(value) => {
                                        setHistoryPeriodFilter(value as PeriodType | 'ALL');
                                        setHistoryPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Periods</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                        <SelectItem value="YEARLY">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Report List */}
                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            {snapshotsLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-primary border-t-transparent mx-auto"></div>
                                    <p className="mt-2 text-muted-foreground">Loading reports...</p>
                                </div>
                            ) : snapshotsData && snapshotsData.data.length > 0 ? (
                                <div className="space-y-3">
                                    {snapshotsData.data.map((snap: any) => (
                                        <div
                                            key={snap.id}
                                            className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${selectedSnapshotId === snap.id ? 'border-blue-500 bg-primary/10' : 'border-border'
                                                }`}
                                            onClick={() => {
                                                setSelectedSnapshotId(snap.id);
                                                setShowHistoryModal(false);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant={
                                                                snap.periodType === 'MONTHLY'
                                                                    ? 'default'
                                                                    : snap.periodType === 'QUARTERLY'
                                                                        ? 'secondary'
                                                                        : 'outline'
                                                            }
                                                        >
                                                            {snap.periodType}
                                                        </Badge>
                                                        {selectedSnapshotId === snap.id && (
                                                            <Badge variant="default" className="bg-success">
                                                                Currently Viewing
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-medium text-foreground">
                                                        Period: {new Date(snap.periodStart).toLocaleDateString()} -{' '}
                                                        {new Date(snap.periodEnd).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Generated: {new Date(snap.createdAt).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-muted-foreground">
                                                        {snap.totalAssessments} assessments
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {snap.sessionsAttended}/{snap.totalSessionsScheduled} sessions
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No reports found for the selected filter
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {snapshotsData && snapshotsData.pagination.totalPages > 1 && (
                            <div className="p-6 border-t border-border">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-muted-foreground">
                                        Page {snapshotsData.pagination.page} of {snapshotsData.pagination.totalPages} (
                                        {snapshotsData.pagination.total} total reports)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                                            disabled={historyPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setHistoryPage(Math.min(snapshotsData.pagination.totalPages, historyPage + 1))
                                            }
                                            disabled={historyPage === snapshotsData.pagination.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Report Content */}
            {reportLoading ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-primary border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading report...</p>
                    </CardContent>
                </Card>
            ) : snapshot ? (
                <div className="space-y-6">
                    {/* Student Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Student Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Name</div>
                                    <div className="font-semibold">{snapshot.studentName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Grade</div>
                                    <div className="font-semibold">{snapshot.studentGrade}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Age</div>
                                    <div className="font-semibold">{snapshot.studentAge} years</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Special Educator</div>
                                    <div className="font-semibold">{snapshot.assignedEducatorName || 'Not assigned'}</div>
                                </div>
                            </div>
                            {snapshot.parentFriendlySummary && (
                                <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                                    <div className="text-sm font-semibold text-blue-900 mb-2">Summary</div>
                                    <div className="text-sm text-primary">{snapshot.parentFriendlySummary}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assessment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Assessment Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Total Assessments</div>
                                    <div className="text-2xl font-bold">{snapshot.totalAssessments}</div>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Latest Score</div>
                                    <div className="text-2xl font-bold">{snapshot.latestAssessmentScore?.toFixed(0) || 'N/A'}%</div>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Support Level</div>
                                    <div className="text-2xl font-bold">{snapshot.riskLevel || 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Last Assessment</div>
                                    <div className="text-sm font-semibold">{snapshot.latestAssessmentDate ? new Date(snapshot.latestAssessmentDate).toLocaleDateString() : 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Tracking */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Learning Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: 'Reading', progress: snapshot.readingProgress },
                                    { name: 'Writing', progress: snapshot.writingProgress },
                                    { name: 'Mathematics', progress: snapshot.mathProgress },
                                    { name: 'Attention & Focus', progress: snapshot.attentionProgress }
                                ].map((area) => (
                                    <div key={area.name}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">{area.name}</span>
                                            <span className="text-sm font-semibold">
                                                {area.progress !== null ? `${area.progress > 0 ? '+' : ''}${area.progress.toFixed(1)}%` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${area.progress && area.progress > 0 ? 'bg-success' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(Math.abs(area.progress || 0), 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {snapshot.overallGoalCompletion !== null && (
                                    <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                                        <div className="text-sm font-semibold text-green-900">Overall Goal Completion</div>
                                        <div className="text-3xl font-bold text-success">{snapshot.overallGoalCompletion.toFixed(0)}%</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Attendance & Participation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Sessions Scheduled</div>
                                    <div className="text-2xl font-bold">{snapshot.totalSessionsScheduled}</div>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Sessions Attended</div>
                                    <div className="text-2xl font-bold">{snapshot.sessionsAttended}</div>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Attendance Rate</div>
                                    <div className="text-2xl font-bold">{snapshot.participationRate?.toFixed(0) || 'N/A'}%</div>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-lg">
                                    <div className="text-sm text-muted-foreground">Last Session</div>
                                    <div className="text-sm font-semibold">{snapshot.lastSessionDate ? new Date(snapshot.lastSessionDate).toLocaleDateString() : 'N/A'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Individual Intervention Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Individual Intervention Plan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Focus Areas */}
                            <div>
                                <h3 className="font-semibold mb-3">Focus Areas for Intervention</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {[
                                        { name: 'Reading', value: snapshot.focusReading },
                                        { name: 'Writing', value: snapshot.focusWriting },
                                        { name: 'Mathematics', value: snapshot.focusMathematics },
                                        { name: 'Attention', value: snapshot.focusAttention },
                                        { name: 'Confidence', value: snapshot.focusConfidence }
                                    ].map((area) => (
                                        <div key={area.name} className={`p-3 rounded-lg border ${area.value ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border'}`}>
                                            <div className="text-sm font-medium">{area.name}</div>
                                            <div className="text-xs mt-1">{area.value ? 'Yes' : 'No'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Goals */}
                            <div>
                                <h3 className="font-semibold mb-3">Intervention Goals</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                                        <div className="font-medium text-sm mb-2">Short-Term Goals (Next 4-6 Weeks)</div>
                                        <div className="text-sm whitespace-pre-wrap">{snapshot.shortTermGoals || 'Goals will be set by your child\'s educator'}</div>
                                    </div>
                                    <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                                        <div className="font-medium text-sm mb-2">Long-Term Goals (Overall Plan Period)</div>
                                        <div className="text-sm whitespace-pre-wrap">{snapshot.longTermGoals || 'Long-term goals will be developed based on progress'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Strategies */}
                            <div>
                                <h3 className="font-semibold mb-3">Intervention Strategies & Support Plan</h3>
                                <div className="space-y-2">
                                    {[
                                        { name: 'Reading', strategy: snapshot.readingStrategy },
                                        { name: 'Writing', strategy: snapshot.writingStrategy },
                                        { name: 'Mathematics', strategy: snapshot.mathematicsStrategy },
                                        { name: 'Attention', strategy: snapshot.attentionStrategy },
                                        { name: 'Confidence', strategy: snapshot.confidenceStrategy }
                                    ].filter(s => s.strategy).map((area) => (
                                        <div key={area.name} className="p-3 bg-muted/40 rounded-lg">
                                            <div className="font-medium text-sm">{area.name}</div>
                                            <div className="text-sm text-foreground mt-1">{area.strategy}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Next Review */}
                            {snapshot.nextReviewDate && (
                                <div className="p-4 bg-info/10 rounded-lg border border-purple-200">
                                    <div className="font-medium text-sm text-purple-900">Next Review Date</div>
                                    <div className="text-lg font-bold text-purple-700">{new Date(snapshot.nextReviewDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No report data available. Generate a new report to get started.</p>
                    </CardContent>
                </Card>
            )}
        </PageWrapper>
    );
}
