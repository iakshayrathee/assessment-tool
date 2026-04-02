'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  FileText,
  Users,
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
  FileBarChart
} from 'lucide-react';
import { useCompleteCenterReportData, useGenerateCenterSnapshot, useCenterSnapshots } from '@/hooks/useCenterReports';
import ReactDOMServer from 'react-dom/server';
import { useToast } from '@/hooks/use-toast';

type PeriodType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export default function CenterReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('MONTHLY');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('overview');

  const centerId = user?.profile?.id;

  // Fetch snapshots list
  const { data: snapshotsData, isLoading: snapshotsLoading } = useCenterSnapshots(centerId, {
    page: 1,
    limit: 10,
    periodType: selectedPeriod
  });

  // Fetch complete report data
  const { data: reportData, isLoading: reportLoading, refetch } = useCompleteCenterReportData(
    centerId,
    selectedSnapshotId ? { snapshotId: selectedSnapshotId } : { periodType: selectedPeriod }
  );

  // Generate snapshot mutation
  const generateSnapshot = useGenerateCenterSnapshot(centerId);

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
      const center = reportData.center;
      const centerName = center?.centerName || 'Center';

      // Generate filename: CenterName_MONTHLY_Dec2024.pdf
      const periodMonth = new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const filename = `${centerName.replace(/\s+/g, '_')}_${snapshot.periodType}_Report_${periodMonth}.pdf`;

      const ReportComponent = (
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '11px', lineHeight: '1.6', color: '#000', padding: '30px 40px', maxWidth: '210mm', background: '#fff' }}>
          {/* Header */}
          <div style={{ borderBottom: '3px solid #2c5282', paddingBottom: '15px', marginBottom: '25px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
              Center Performance & Statistics Report
            </h1>
            <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '10px' }}>
              <strong>{centerName}</strong>
            </div>
            <div style={{ fontSize: '10px', color: '#718096', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div><strong>Reporting Period:</strong> {snapshot.periodType}</div>
                <div><strong>Period Duration:</strong> {new Date(snapshot.periodStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(snapshot.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Report Generated:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div><strong>Contact Person:</strong> {center?.contactPerson || 'N/A'}</div>
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

          {/* 1. Student Coverage Statistics */}
          <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
              1. Student Coverage Statistics
            </h2>
            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
              During the reporting period, the center served <strong>{snapshot.totalStudentsRegistered} registered students</strong> across <strong>{snapshot.schoolsCovered.length} schools</strong> and <strong>{snapshot.gradesCovered.length} grade levels</strong>.
              The center successfully assessed <strong>{snapshot.studentsAssessed} students</strong> and provided targeted interventions to <strong>{snapshot.studentsUnderIntervention} students</strong> who demonstrated need for specialized educational support.
              {snapshot.newStudentsThisPeriod > 0 && ` Additionally, ${snapshot.newStudentsThisPeriod} new students were enrolled during this period.`}
            </p>
            <div style={{ fontSize: '10px', marginLeft: '20px' }}>
              <div style={{ marginBottom: '4px' }}>• <strong>Total Students Registered:</strong> {snapshot.totalStudentsRegistered}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Students Assessed:</strong> {snapshot.studentsAssessed} ({((snapshot.studentsAssessed / snapshot.totalStudentsRegistered) * 100).toFixed(1)}% of total)</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Students Under Intervention:</strong> {snapshot.studentsUnderIntervention} ({((snapshot.studentsUnderIntervention / snapshot.totalStudentsRegistered) * 100).toFixed(1)}% of total)</div>
              <div style={{ marginBottom: '4px' }}>• <strong>New Students This Period:</strong> {snapshot.newStudentsThisPeriod}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Active Students:</strong> {snapshot.activeStudents}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Exited/Mainstreamed:</strong> {snapshot.exitedMainstreamed}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Schools Covered:</strong> {snapshot.schoolsCovered.join(', ') || 'N/A'}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Grades Covered:</strong> {snapshot.gradesCovered.join(', ') || 'N/A'}</div>
            </div>
          </div>

          {/* 2. Assessment Statistics */}
          <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
              2. Assessment Statistics
            </h2>
            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
              During this reporting period, the center conducted <strong>{snapshot.totalAssessmentsConducted} assessments</strong>, comprising <strong>{snapshot.baselineAssessments} baseline assessments</strong> and <strong>{snapshot.reviewProgressAssessments} review/progress assessments</strong>.
              {snapshot.averageAssessmentTime && ` The average assessment time was ${snapshot.averageAssessmentTime.toFixed(1)} hours.`}
              {snapshot.assessmentsPerEducator && ` Each educator conducted an average of ${snapshot.assessmentsPerEducator.toFixed(1)} assessments.`}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Assessment Type</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Count</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Baseline Assessments</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.baselineAssessments}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{((snapshot.baselineAssessments / snapshot.totalAssessmentsConducted) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Review/Progress Assessments</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.reviewProgressAssessments}</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{((snapshot.reviewProgressAssessments / snapshot.totalAssessmentsConducted) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. Intervention Statistics */}
          <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
              3. Intervention Statistics
            </h2>
            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
              The center implemented <strong>{snapshot.individualInterventionPlans} individual intervention plans</strong> and conducted <strong>{snapshot.totalInterventionSessions} intervention sessions</strong> during this period.
              {snapshot.avgSessionsPerStudent && ` On average, each student received ${snapshot.avgSessionsPerStudent.toFixed(1)} intervention sessions.`}
              {snapshot.avgDurationPerSession && ` The average session duration was ${snapshot.avgDurationPerSession.toFixed(0)} minutes.`}
            </p>
            <div style={{ fontSize: '10px', marginLeft: '20px' }}>
              <div style={{ marginBottom: '4px' }}>• <strong>Individual Intervention Plans:</strong> {snapshot.individualInterventionPlans}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Small Group Interventions:</strong> {snapshot.smallGroupInterventions}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Total Intervention Sessions:</strong> {snapshot.totalInterventionSessions}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Average Sessions per Student:</strong> {snapshot.avgSessionsPerStudent?.toFixed(1) || 'N/A'}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Average Duration per Session:</strong> {snapshot.avgDurationPerSession?.toFixed(0) || 'N/A'} minutes</div>
            </div>
          </div>

          {/* 4. Progress & Outcome Statistics */}
          <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
              4. Progress & Outcome Statistics
            </h2>
            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
              Student progress is tracked across four key developmental domains. The following improvements represent the average progress made by students receiving interventions during this reporting period.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Domain</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Average Improvement</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Reading</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.readingImprovement !== null ? `${snapshot.readingImprovement > 0 ? '+' : ''}${snapshot.readingImprovement.toFixed(1)}%` : 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{snapshot.readingImprovement !== null && snapshot.readingImprovement > 0 ? 'Positive progress' : 'Needs attention'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Writing</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.writingImprovement !== null ? `${snapshot.writingImprovement > 0 ? '+' : ''}${snapshot.writingImprovement.toFixed(1)}%` : 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{snapshot.writingImprovement !== null && snapshot.writingImprovement > 0 ? 'Positive progress' : 'Needs attention'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Mathematics</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.mathematicsImprovement !== null ? `${snapshot.mathematicsImprovement > 0 ? '+' : ''}${snapshot.mathematicsImprovement.toFixed(1)}%` : 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{snapshot.mathematicsImprovement !== null && snapshot.mathematicsImprovement > 0 ? 'Positive progress' : 'Needs attention'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Attention & Behavior</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.attentionBehaviorImprovement !== null ? `${snapshot.attentionBehaviorImprovement > 0 ? '+' : ''}${snapshot.attentionBehaviorImprovement.toFixed(1)}%` : 'N/A'}</td>
                  <td style={{ padding: '8px' }}>{snapshot.attentionBehaviorImprovement !== null && snapshot.attentionBehaviorImprovement > 0 ? 'Positive progress' : 'Needs attention'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Educator Productivity Metrics */}
          <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
              5. Educator Productivity Metrics
            </h2>
            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
              The center employed <strong>{snapshot.activeSpecialEducators} active special educators</strong> during this period.
              {snapshot.avgStudentsPerEducator && ` Each educator managed an average of ${snapshot.avgStudentsPerEducator.toFixed(1)} students.`}
              {snapshot.avgSessionsPerEducator && ` Educators conducted an average of ${snapshot.avgSessionsPerEducator.toFixed(1)} intervention sessions.`}
            </p>
            <div style={{ fontSize: '10px', marginLeft: '20px' }}>
              <div style={{ marginBottom: '4px' }}>• <strong>Active Special Educators:</strong> {snapshot.activeSpecialEducators}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Average Students per Educator:</strong> {snapshot.avgStudentsPerEducator?.toFixed(1) || 'N/A'}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Average Sessions per Educator:</strong> {snapshot.avgSessionsPerEducator?.toFixed(1) || 'N/A'}</div>
              <div style={{ marginBottom: '4px' }}>• <strong>Average Reports Generated per Educator:</strong> {snapshot.avgReportsGenerated?.toFixed(1) || 'N/A'}</div>
            </div>
          </div>

          {/* 6. Compliance & Documentation Statistics */}
          <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
              6. Compliance & Documentation Statistics
            </h2>
            <p style={{ fontSize: '10px', lineHeight: '1.7', marginBottom: '10px', textAlign: 'justify' }}>
              Documentation compliance is essential for quality assurance and regulatory requirements. The following metrics reflect the center's adherence to documentation standards.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2d3748' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Documentation Type</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontWeight: '700' }}>Completion Rate</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Assessment Records Available</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.assessmentRecordsAvailable?.toFixed(1) || 'N/A'}%</td>
                  <td style={{ padding: '8px' }}>{(snapshot.assessmentRecordsAvailable || 0) >= 90 ? 'Excellent' : (snapshot.assessmentRecordsAvailable || 0) >= 70 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Intervention Plans Documented</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.interventionPlansDocumented?.toFixed(1) || 'N/A'}%</td>
                  <td style={{ padding: '8px' }}>{(snapshot.interventionPlansDocumented || 0) >= 90 ? 'Excellent' : (snapshot.interventionPlansDocumented || 0) >= 70 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Progress Reviews Completed</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.progressReviewsCompleted?.toFixed(1) || 'N/A'}%</td>
                  <td style={{ padding: '8px' }}>{(snapshot.progressReviewsCompleted || 0) >= 90 ? 'Excellent' : (snapshot.progressReviewsCompleted || 0) >= 70 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Parent Reports Shared</td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{snapshot.parentReportsShared?.toFixed(1) || 'N/A'}%</td>
                  <td style={{ padding: '8px' }}>{(snapshot.parentReportsShared || 0) >= 90 ? 'Excellent' : (snapshot.parentReportsShared || 0) >= 70 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          {snapshot.recommendations && (
            <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748', marginBottom: '10px', borderBottom: '2px solid #cbd5e0', paddingBottom: '4px' }}>
                Strategic Recommendations
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
              This report demonstrates the center's commitment to data-driven educational interventions and continuous improvement in student outcomes.
              The comprehensive assessment and support program has successfully identified and addressed the diverse learning needs of the student population across multiple schools and grade levels.
              Continued monitoring, evidence-based intervention strategies, and strong educator-student ratios will be essential to maintain and enhance these positive trends in student achievement and well-being.
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

  if (!centerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = snapshotsLoading || reportLoading;
  const snapshot = reportData?.snapshot;
  const center = reportData?.center;

  return (
    <PageWrapper
      title="Center Performance & Statistics Report"
      description="Comprehensive analytics and performance metrics for your center"
      breadcrumbs={[{ label: 'Center', href: '/center' }, { label: 'Schools', href: '/center/schools' }, { label: 'Report' }]}
    >

      {/* Period Selector and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Period</label>
                <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {snapshotsData?.data && snapshotsData.data.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Snapshot</label>
                  <Select value={selectedSnapshotId} onValueChange={setSelectedSnapshotId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Latest snapshot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest Snapshot</SelectItem>
                      {snapshotsData.data.map((snap: any) => (
                        <SelectItem key={snap.id} value={snap.id}>
                          {new Date(snap.periodStart).toLocaleDateString()} - {new Date(snap.periodEnd).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

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
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSkeleton count={6} />
      ) : !snapshot ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Report Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first report to view center performance statistics
            </p>
            <Button onClick={handleGenerateReport} disabled={generateSnapshot.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generateSnapshot.isPending ? 'animate-spin' : ''}`} />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div id="report-content" className="space-y-6">
          {/* Report Header */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/30">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{center?.centerName}</h2>
                  <p className="text-muted-foreground">{center?.address}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Period: {new Date(snapshot.periodStart).toLocaleDateString()} - {new Date(snapshot.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {selectedPeriod} REPORT
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Different Sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="interventions">Interventions</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            {/* Overview Tab - Student Coverage */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Coverage Statistics
                  </CardTitle>
                  <CardDescription>Overview of student enrollment and engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                      title="Total Students Registered"
                      value={reportData.coverage.totalStudentsRegistered}
                      icon={Users}
                      color="blue"
                    />
                    <StatCard
                      title="Students Assessed"
                      value={reportData.coverage.studentsAssessed}
                      icon={CheckCircle}
                      color="green"
                    />
                    <StatCard
                      title="Under Intervention"
                      value={reportData.coverage.studentsUnderIntervention}
                      icon={Target}
                      color="orange"
                    />
                    <StatCard
                      title="New Students (This Period)"
                      value={reportData.coverage.newStudentsThisPeriod}
                      icon={TrendingUp}
                      color="purple"
                    />
                    <StatCard
                      title="Active Students"
                      value={reportData.coverage.activeStudents}
                      icon={Activity}
                      color="cyan"
                    />
                    <StatCard
                      title="Exited/Mainstreamed"
                      value={reportData.coverage.exitedMainstreamed}
                      icon={GraduationCap}
                      color="emerald"
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Schools Covered</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {snapshot.schoolsCovered.length > 0 ? (
                            snapshot.schoolsCovered.map((school: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{school}</Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No schools linked</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Grades Covered</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {snapshot.gradesCovered.length > 0 ? (
                            snapshot.gradesCovered.map((grade: string, idx: number) => (
                              <Badge key={idx} variant="outline">{grade}</Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No grades data</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessments Tab */}
            <TabsContent value="assessments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Assessment Statistics
                  </CardTitle>
                  <CardDescription>Comprehensive assessment data and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                      title="Total Assessments Conducted"
                      value={reportData.assessments.totalAssessmentsConducted}
                      icon={FileText}
                      color="blue"
                    />
                    <StatCard
                      title="Baseline Assessments"
                      value={reportData.assessments.baselineAssessments}
                      icon={BarChart3}
                      color="green"
                    />
                    <StatCard
                      title="Review/Progress Assessments"
                      value={reportData.assessments.reviewProgressAssessments}
                      icon={TrendingUp}
                      color="purple"
                    />
                    <StatCard
                      title="Avg Assessment Time (hours)"
                      value={reportData.assessments.averageAssessmentTime?.toFixed(1) || 'N/A'}
                      icon={Calendar}
                      color="orange"
                    />
                    <StatCard
                      title="Assessments per Educator"
                      value={reportData.assessments.assessmentsPerEducator?.toFixed(1) || 'N/A'}
                      icon={Users}
                      color="cyan"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interventions Tab */}
            <TabsContent value="interventions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Intervention Statistics
                  </CardTitle>
                  <CardDescription>Intervention plans and session data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                      title="Individual Intervention Plans"
                      value={reportData.interventions.individualInterventionPlans}
                      icon={Target}
                      color="blue"
                    />
                    <StatCard
                      title="Small Group Interventions"
                      value={reportData.interventions.smallGroupInterventions}
                      icon={Users}
                      color="green"
                    />
                    <StatCard
                      title="Total Intervention Sessions"
                      value={reportData.interventions.totalInterventionSessions}
                      icon={Activity}
                      color="purple"
                    />
                    <StatCard
                      title="Avg Sessions per Student"
                      value={reportData.interventions.avgSessionsPerStudent?.toFixed(1) || 'N/A'}
                      icon={BarChart3}
                      color="orange"
                    />
                    <StatCard
                      title="Avg Duration per Session (min)"
                      value={reportData.interventions.avgDurationPerSession?.toFixed(0) || 'N/A'}
                      icon={Calendar}
                      color="cyan"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress & Outcome Statistics
                  </CardTitle>
                  <CardDescription>Domain-wise improvement trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProgressCard
                      domain="Reading"
                      improvement={reportData.progress.readingImprovement}
                      icon={BookOpen}
                    />
                    <ProgressCard
                      domain="Writing"
                      improvement={reportData.progress.writingImprovement}
                      icon={FileText}
                    />
                    <ProgressCard
                      domain="Mathematics"
                      improvement={reportData.progress.mathematicsImprovement}
                      icon={BarChart3}
                    />
                    <ProgressCard
                      domain="Attention & Behavior"
                      improvement={reportData.progress.attentionBehaviorImprovement}
                      icon={Activity}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Productivity Tab */}
            <TabsContent value="productivity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Educator Productivity Metrics
                  </CardTitle>
                  <CardDescription>Performance and workload distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Active Special Educators"
                      value={reportData.productivity.activeSpecialEducators}
                      icon={Users}
                      color="blue"
                    />
                    <StatCard
                      title="Avg Students per Educator"
                      value={reportData.productivity.avgStudentsPerEducator?.toFixed(1) || 'N/A'}
                      icon={Users}
                      color="green"
                    />
                    <StatCard
                      title="Avg Sessions per Educator"
                      value={reportData.productivity.avgSessionsPerEducator?.toFixed(1) || 'N/A'}
                      icon={Activity}
                      color="purple"
                    />
                    <StatCard
                      title="Avg Reports Generated"
                      value={reportData.productivity.avgReportsGenerated?.toFixed(1) || 'N/A'}
                      icon={FileText}
                      color="orange"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Compliance & Documentation Statistics
                  </CardTitle>
                  <CardDescription>Documentation completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ComplianceCard
                      title="Assessment Records Available"
                      percentage={reportData.compliance.assessmentRecordsAvailable}
                    />
                    <ComplianceCard
                      title="Intervention Plans Documented"
                      percentage={reportData.compliance.interventionPlansDocumented}
                    />
                    <ComplianceCard
                      title="Progress Reviews Completed"
                      percentage={reportData.compliance.progressReviewsCompleted}
                    />
                    <ComplianceCard
                      title="Parent Reports Shared"
                      percentage={reportData.compliance.parentReportsShared}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageWrapper>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-primary/10 text-primary dark:bg-blue-950 dark:text-primary/80',
    green: 'bg-success/10 text-success dark:bg-green-950 dark:text-green-400',
    purple: 'bg-info/10 text-info dark:bg-purple-950 dark:text-purple-400',
    orange: 'bg-warning/10 text-warning dark:bg-orange-950 dark:text-orange-400',
    cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Progress Card Component
function ProgressCard({ domain, improvement, icon: Icon }: {
  domain: string;
  improvement: number | null;
  icon: any;
}) {
  const getImprovementColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value > 10) return 'text-success';
    if (value > 0) return 'text-primary';
    return 'text-warning';
  };

  const getImprovementBg = (value: number | null) => {
    if (value === null) return 'bg-muted dark:bg-gray-900';
    if (value > 10) return 'bg-success/10 dark:bg-green-950';
    if (value > 0) return 'bg-primary/10 dark:bg-blue-950';
    return 'bg-warning/10 dark:bg-orange-950';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getImprovementBg(improvement)}`}>
              <Icon className={`h-5 w-5 ${getImprovementColor(improvement)}`} />
            </div>
            <h3 className="font-semibold">{domain}</h3>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getImprovementColor(improvement)}`}>
              {improvement !== null ? `${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%` : 'N/A'}
            </span>
            <span className="text-sm text-muted-foreground">improvement</span>
          </div>
          {improvement !== null && (
            <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${improvement > 0 ? 'bg-success' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(Math.abs(improvement), 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compliance Card Component
function ComplianceCard({ title, percentage }: {
  title: string;
  percentage: number | null;
}) {
  const getComplianceColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value >= 90) return 'text-success';
    if (value >= 70) return 'text-primary';
    if (value >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getComplianceBg = (value: number | null) => {
    if (value === null) return 'bg-gray-500';
    if (value >= 90) return 'bg-success';
    if (value >= 70) return 'bg-blue-500';
    if (value >= 50) return 'bg-orange-500';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${getComplianceColor(percentage)}`}>
              {percentage !== null ? `${percentage.toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          {percentage !== null && (
            <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${getComplianceBg(percentage)}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
          {percentage !== null && (
            <p className="text-sm text-muted-foreground">
              {percentage >= 90 ? 'Excellent' : percentage >= 70 ? 'Good' : percentage >= 50 ? 'Fair' : 'Needs Improvement'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
