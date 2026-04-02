'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';

interface IEPDocumentViewerProps {
  document: any;
  onPrint?: () => void;
  onExport?: () => void;
}

export function IEPDocumentViewer({ document, onPrint, onExport }: IEPDocumentViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    try {
      if (!contentRef.current) {
        toast.error('Cannot generate PDF - content not available');
        return;
      }

      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 10,
        filename: `${document.studentName.replace(/\s+/g, '-').toLowerCase()}-iep-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      html2pdf().from(contentRef.current).set(opt).save();
      toast.success('PDF downloaded successfully');
      onExport?.();
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF');
    }
  };
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header Actions */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={downloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* PDF Content */}
      <div ref={contentRef}>

        {/* IEP Header Page */}
        <Card className="print:shadow-none print:border-2">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-3xl font-bold">IEP 1</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-lg font-semibold">NAME :</span>
                  <span className="text-xl font-bold">{document.student?.fullName || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-lg font-semibold">AGE YEARS:</span>
                  <span className="text-xl font-bold">
                    {document.student?.dateOfBirth ? calculateAge(document.student.dateOfBirth) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-lg font-semibold">CLASS</span>
                  <span className="text-xl font-bold">{document.student?.grade || 'N/A'} STANDARD:</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-lg font-semibold">DURATION</span>
                  <span className="text-xl font-bold">{document.durationMonths} MONTHS:</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">AREAS OF REMEDIATION:</h3>
              <p className="text-lg leading-relaxed">
                {document.areasOfRemediation?.join(', ') || 'ORAL LANGUAGE, READING, WRITING, SPELLING, MATHS'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Table */}
        {document.weeklyEvaluations && document.weeklyEvaluations.length > 0 && (
          <Card className="print:shadow-none print:border-2 print:break-before-page">
            <CardHeader>
              <CardTitle>Assessment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left font-semibold">Subject</th>
                      <th className="border border-border p-3 text-left font-semibold">Test Goal</th>
                      <th className="border border-border p-3 text-left font-semibold">Analysis</th>
                      <th className="border border-border p-3 text-left font-semibold">Assessment</th>
                      <th className="border border-border p-3 text-center font-semibold rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        Attention
                      </th>
                      <th className="border border-border p-3 text-center font-semibold rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        Behavioral Sitting Tolerance
                      </th>
                      <th className="border border-border p-3 text-center font-semibold rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        Task Completion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.weeklyEvaluations.flatMap((evaluation: any) =>
                      evaluation.activities?.map((activity: any, idx: number) => (
                        <tr key={`${evaluation.id}-${idx}`} className="hover:bg-muted/40">
                          <td className="border border-border p-3 font-medium">{activity.subject}</td>
                          <td className="border border-border p-3">{activity.testGoalActivity}</td>
                          <td className="border border-border p-3">{activity.analysis}</td>
                          <td className="border border-border p-3">{activity.assessment}</td>
                          <td className="border border-border p-3 text-center">{activity.attentionLevel || 'N/A'}</td>
                          <td className="border border-border p-3 text-center">{activity.sittingTolerance || 'N/A'}</td>
                          <td className="border border-border p-3 text-center">{activity.taskCompletion || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subject Sections */}
        {document.subjectSections && document.subjectSections.length > 0 && (
          <>
            {document.subjectSections.map((section: any, index: number) => (
              <Card key={section.id} className="print:shadow-none print:border-2 print:break-before-page">
                <CardHeader className="border-b">
                  <CardTitle className="text-2xl">{section.subject.replace('_', ' ')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Present Level */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">Present Level</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Receptive</h4>
                        <div className="pl-4 space-y-2">
                          {section.presentLevelReceptive?.split('\n').map((line: string, idx: number) => (
                            <p key={idx} className="text-foreground">{line}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Expressive</h4>
                        <div className="pl-4 space-y-2">
                          {section.presentLevelExpressive?.split('\n').map((line: string, idx: number) => (
                            <p key={idx} className="text-foreground">{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Long-Term Goals */}
                  {section.longTermGoals && section.longTermGoals.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Long-Term Goal</h3>
                      <div className="pl-4 space-y-3">
                        {section.longTermGoals.map((goal: any, idx: number) => (
                          <div key={goal.id} className="flex gap-2">
                            <span className="font-semibold">{idx + 1}.</span>
                            <div className="flex-1">
                              <p className="text-foreground">{goal.description}</p>
                              {goal.durationMonths && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Duration: {goal.durationMonths} months
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short-Term Goals */}
                  {section.shortTermGoals && section.shortTermGoals.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Short Term Goal</h3>
                      <div className="pl-4">
                        <p className="mb-3 text-foreground">Will be able to -</p>
                        <div className="space-y-3">
                          {section.shortTermGoals.map((goal: any, idx: number) => (
                            <div key={goal.id} className="flex gap-2">
                              <span className="font-semibold">{idx + 1}</span>
                              <div className="flex-1">
                                <p className="text-foreground">{goal.description}</p>
                                {goal.teacherAssistance && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Teacher Assistance: {goal.teacherAssistance.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* Weekly Planning Table */}
        {document.weeklyEvaluations && document.weeklyEvaluations.length > 0 && (
          <Card className="print:shadow-none print:border-2 print:break-before-page">
            <CardHeader>
              <CardTitle>Weekly Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {document.weeklyEvaluations.map((evaluation: any) => (
                  <div key={evaluation.id}>
                    <h3 className="text-lg font-semibold mb-3">
                      Week of {formatDate(evaluation.weekStartDate)} (Week {evaluation.weekNumber})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border text-sm">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border border-border p-2 text-left font-semibold">Day</th>
                            <th className="border border-border p-2 text-left font-semibold">Subject</th>
                            <th className="border border-border p-2 text-left font-semibold">Test Goal/Activity</th>
                            <th className="border border-border p-2 text-left font-semibold">Analysis</th>
                            <th className="border border-border p-2 text-left font-semibold">Assessment</th>
                            <th className="border border-border p-2 text-left font-semibold">Attention</th>
                            <th className="border border-border p-2 text-left font-semibold">Sitting Tolerance</th>
                            <th className="border border-border p-2 text-left font-semibold">Task Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluation.activities && evaluation.activities.length > 0 ? (
                            evaluation.activities.map((activity: any, idx: number) => (
                              <tr key={idx} className="hover:bg-muted/40">
                                <td className="border border-border p-2 font-medium capitalize">{activity.day?.toLowerCase() || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.subject?.replace('_', ' ') || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.testGoalActivity || activity.activity || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.analysis || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.assessment || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.attentionLevel || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.sittingTolerance || 'N/A'}</td>
                                <td className="border border-border p-2">{activity.taskCompletion || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="border border-border p-4 text-center text-muted-foreground">
                                No activities recorded for this week
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Metadata */}
        <Card className="print:shadow-none print:border-2">
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Created:</span> {formatDate(document.createdAt)}
              </div>
              <div>
                <span className="font-semibold">Last Updated:</span> {formatDate(document.updatedAt)}
              </div>
              <div>
                <span className="font-semibold">Start Date:</span> {formatDate(document.startDate)}
              </div>
              <div>
                <span className="font-semibold">End Date:</span> {formatDate(document.endDate)}
              </div>
              <div>
                <span className="font-semibold">Educator:</span> {document.specialEducator?.fullName || 'N/A'}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{' '}
                <Badge variant={document.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {document.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

      </div> {/* Close PDF content wrapper */}
    </div>
  );
}

