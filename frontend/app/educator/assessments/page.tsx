'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PenTool, Calculator, FileText, Plus, Users, Loader2, Eye, Pencil } from 'lucide-react';
import { FormalAssessmentForm } from '@/components/assessments/FormalAssessmentForm';
import { ReadingSkillAssessment } from '@/components/assessments/ReadingSkillAssessment';
import { WritingSkillAssessment } from '@/components/assessments/WritingSkillAssessment';
import { MathSkillAssessment } from '@/components/assessments/MathSkillAssessment';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';
import { MaxAssessmentsWarningDialog } from '@/components/assessments/MaxAssessmentsWarningDialog';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { useAIAssessment } from '@/hooks/useAI';
import { AIAssessmentPanel } from '@/components/ai/AIInsightPanels';
import { PageWrapper } from '@/components/layout/PageWrapper';

const MAX_ASSESSMENTS = 3;

const getVersionLabel = (version?: number, isFirst?: boolean) => {
  if (isFirst) return 'Initial Assessment';
  if (!version || version === 1) return 'Reassessment';
  return `Reassessment V${version}`;
};

// Helper function to check if student's grade is eligible for comprehensive assessments
// Students in Nursery, LKG, UKG, Kindergarten, Grade 1, and Grade 2 are not eligible
const isGradeEligibleForAssessments = (grade: string): boolean => {
  const earlyGrades = ['Nursery', 'LKG', 'UKG', 'Kindergarten', 'Grade 1', 'Grade 2'];
  return !earlyGrades.includes(grade);
};

export default function AssessmentsPage() {
  const { user } = useAuth();

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [assessmentTab, setAssessmentTab] = useState('formal');
  const [showFormalForm, setShowFormalForm] = useState(false);
  const [showSkillAssessment, setShowSkillAssessment] = useState<'reading' | 'writing' | 'math' | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const [formalAssessments, setFormalAssessments] = useState<any[]>([]);
  const [readingAssessments, setReadingAssessments] = useState<any[]>([]);
  const [writingAssessments, setWritingAssessments] = useState<any[]>([]);
  const [mathAssessments, setMathAssessments] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [editingAssessment, setEditingAssessment] = useState<any>(null);

  const [showMaxWarning, setShowMaxWarning] = useState(false);
  const [pendingAssessmentType, setPendingAssessmentType] = useState<'formal' | 'reading' | 'writing' | 'math' | null>(null);
  const [oldestAssessment, setOldestAssessment] = useState<any>(null);

  // AI hook — enabled when student is selected
  const aiAssessment = useAIAssessment(selectedStudent?.id || '', !!selectedStudent?.id);

  const handleSaveAIRisk = async (riskLevel: string) => {
    try {
      if (!selectedStudent?.id) return;
      await apiClient.saveAIRisk(selectedStudent.id, riskLevel);
      toast.success(`Student risk category updated to ${riskLevel}.`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update risk category');
    }
  };

  useEffect(() => {
    if (selectedStudent?.id) {
      fetchAssessments();
    } else {
      setFormalAssessments([]);
      setReadingAssessments([]);
      setWritingAssessments([]);
      setMathAssessments([]);
    }
  }, [selectedStudent?.id]);

  const fetchAssessments = async () => {
    if (!selectedStudent?.id) return;

    setLoadingAssessments(true);
    try {
      // Use Promise.allSettled to prevent one failure from breaking all assessments
      const results = await Promise.allSettled([
        apiClient.getFormalAssessmentsByStudent(selectedStudent.id),
        apiClient.getReadingSkillAssessmentsByStudent(selectedStudent.id),
        apiClient.getWritingSkillAssessmentsByStudent(selectedStudent.id),
        apiClient.getMathSkillAssessmentsByStudent(selectedStudent.id),
      ]);

      // Extract successful results, use empty array for failures
      setFormalAssessments(
        results[0].status === 'fulfilled' ? results[0].value || [] : []
      );
      setReadingAssessments(
        results[1].status === 'fulfilled' ? results[1].value || [] : []
      );
      setWritingAssessments(
        results[2].status === 'fulfilled' ? results[2].value || [] : []
      );
      setMathAssessments(
        results[3].status === 'fulfilled' ? results[3].value || [] : []
      );

      // Log any failures for debugging
      const assessmentTypes = ['formal', 'reading', 'writing', 'math'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch ${assessmentTypes[index]} assessments:`, result.reason);
        }
      });

      // Show error toast only if all requests failed
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        toast.error('Failed to load assessments');
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleCreateAssessment = (type: 'formal' | 'reading' | 'writing' | 'math') => {
    let assessments: any[] = [];
    let assessmentTypeName = '';

    switch (type) {
      case 'formal':
        assessments = formalAssessments;
        assessmentTypeName = 'Formal';
        break;
      case 'reading':
        assessments = readingAssessments;
        assessmentTypeName = 'Reading';
        break;
      case 'writing':
        assessments = writingAssessments;
        assessmentTypeName = 'Writing';
        break;
      case 'math':
        assessments = mathAssessments;
        assessmentTypeName = 'Math';
        break;
    }

    if (assessments.length >= MAX_ASSESSMENTS) {
      const oldest = assessments.reduce((prev, current) => {
        const prevDate = new Date(prev.createdAt);
        const currentDate = new Date(current.createdAt);
        return prevDate < currentDate ? prev : current;
      });

      setOldestAssessment({ ...oldest, type: assessmentTypeName });
      setPendingAssessmentType(type);
      setShowMaxWarning(true);
    } else {
      openAssessmentForm(type);
    }
  };

  const handleMaxWarningConfirm = async () => {
    if (!oldestAssessment || !pendingAssessmentType) return;

    try {
      switch (pendingAssessmentType) {
        case 'formal':
          await apiClient.deleteFormalAssessment(oldestAssessment.id);
          break;
        case 'reading':
        case 'writing':
        case 'math':
          await apiClient.deleteFormalAssessment(oldestAssessment.id);
          break;
      }

      toast.success('Oldest assessment deleted');
      await fetchAssessments();
      setShowMaxWarning(false);
      openAssessmentForm(pendingAssessmentType);
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete oldest assessment');
    }
  };

  const openAssessmentForm = (type: 'formal' | 'reading' | 'writing' | 'math') => {
    setEditingAssessment(null);
    switch (type) {
      case 'formal':
        setShowFormalForm(true);
        break;
      case 'reading':
      case 'writing':
      case 'math':
        setShowSkillAssessment(type);
        break;
    }
  };

  const handleViewAssessment = (assessment: any, type: string) => {
    setEditingAssessment({ ...assessment, type, mode: 'view' });

    switch (type) {
      case 'formal':
        setShowFormalForm(true);
        break;
      case 'reading':
      case 'writing':
      case 'math':
        setShowSkillAssessment(type as 'reading' | 'writing' | 'math');
        break;
    }
  };

  const handleEditAssessment = (assessment: any, type: string) => {
    setEditingAssessment({ ...assessment, type, mode: 'edit' });

    switch (type) {
      case 'formal':
        setShowFormalForm(true);
        break;
      case 'reading':
      case 'writing':
      case 'math':
        setShowSkillAssessment(type as 'reading' | 'writing' | 'math');
        break;
    }
  };

  const handleAssessmentSuccess = () => {
    fetchAssessments();
    setShowFormalForm(false);
    setShowSkillAssessment(null);
    setEditingAssessment(null);
  };

  const renderAssessmentTable = (assessments: any[], type: string) => {
    if (loadingAssessments) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (assessments.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">No {type} assessments yet</p>
      );
    }

    const sortedAssessments = [...assessments].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type/Version</TableHead>
            {type === 'formal' && <TableHead>Assessment Type</TableHead>}
            {type === 'formal' && <TableHead>Diagnosis</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssessments.map((assessment, index) => (
            <TableRow key={assessment.id}>
              <TableCell className="font-medium">
                {format(new Date(assessment.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {getVersionLabel(assessment.version, index === 0)}
                </Badge>
              </TableCell>
              {type === 'formal' && (
                <>
                  <TableCell>{assessment.assessmentType || 'N/A'}</TableCell>
                  <TableCell>{assessment.diagnosis || 'Pending'}</TableCell>
                </>
              )}
              <TableCell>
                <Badge variant={assessment.completed ? 'default' : 'secondary'}>
                  {assessment.completed ? 'Completed' : 'In Progress'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewAssessment(assessment, type)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAssessment(assessment, type)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <PageWrapper
      title="Comprehensive Assessments"
      description="Formal referrals and detailed skill assessments"
      breadcrumbs={[{ label: 'Educator' }, { label: 'Assessments' }]}
      actions={
        selectedStudent ? (
          <Button
            variant="outline"
            onClick={() => setShowStudentModal(true)}
            className="flex items-center gap-4 bg-primary/10 px-4 py-3 rounded-lg border border-primary/20 min-w-[250px] hover:bg-primary/10"
          >
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-sm truncate">
                {selectedStudent.fullName || selectedStudent.name || 'Unknown'}
              </p>
              <p className="text-xs text-primary">
                <GradeDisplay grade={selectedStudent.grade || 'N/A'} />
              </p>
            </div>
            <Users className="h-4 w-4 flex-shrink-0" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowStudentModal(true)}
            className="flex items-center gap-2 px-4 py-2 min-w-[140px]"
          >
            <Users className="h-4 w-4" />
            Select Student
          </Button>
        )
      }
    >

      {/* AI Assessment Analysis */}
      {selectedStudent?.id && (
        <AIAssessmentPanel
          data={aiAssessment.data}
          isLoading={aiAssessment.isLoading}
          error={aiAssessment.error}
          onLoad={() => {}}
          onSaveRisk={handleSaveAIRisk}
        />
      )}

      {selectedStudent?.id ? (
        isGradeEligibleForAssessments(selectedStudent.grade) ? (
          <Tabs value={assessmentTab} onValueChange={setAssessmentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formal">
                <FileText className="h-4 w-4 mr-2" />
                Formal Assessments
              </TabsTrigger>
              <TabsTrigger value="skill">
                <BookOpen className="h-4 w-4 mr-2" />
                Skill Assessments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formal" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Formal Assessment Referrals</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create referrals for psychological, educational, or specialized assessments ({formalAssessments.length}/{MAX_ASSESSMENTS})
                      </p>
                    </div>
                    <Button onClick={() => handleCreateAssessment('formal')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Referral
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderAssessmentTable(formalAssessments, 'formal')}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skill" className="mt-6">
              {showSkillAssessment ? (
                <div>
                  {showSkillAssessment === 'reading' && (
                    <ReadingSkillAssessment
                      studentId={selectedStudent?.id || ''}
                      studentGrade={selectedStudent?.grade || ''}
                      assessmentId={editingAssessment?.type === 'reading' ? editingAssessment?.id : undefined}
                      initialData={editingAssessment?.type === 'reading' ? editingAssessment : undefined}
                      mode={editingAssessment?.type === 'reading' ? (editingAssessment?.mode || 'edit') : 'create'}
                      onSuccess={handleAssessmentSuccess}
                      onCancel={() => {
                        setShowSkillAssessment(null);
                        setEditingAssessment(null);
                      }}
                    />
                  )}
                  {showSkillAssessment === 'writing' && (
                    <WritingSkillAssessment
                      studentId={selectedStudent?.id || ''}
                      studentGrade={selectedStudent?.grade || ''}
                      assessmentId={editingAssessment?.type === 'writing' ? editingAssessment?.id : undefined}
                      initialData={editingAssessment?.type === 'writing' ? editingAssessment : undefined}
                      mode={editingAssessment?.type === 'writing' ? (editingAssessment?.mode || 'edit') : 'create'}
                      onSuccess={handleAssessmentSuccess}
                      onCancel={() => {
                        setShowSkillAssessment(null);
                        setEditingAssessment(null);
                      }}
                    />
                  )}
                  {showSkillAssessment === 'math' && (
                    <MathSkillAssessment
                      studentId={selectedStudent?.id || ''}
                      studentGrade={selectedStudent?.grade || ''}
                      assessmentId={editingAssessment?.type === 'math' ? editingAssessment?.id : undefined}
                      initialData={editingAssessment?.type === 'math' ? editingAssessment : undefined}
                      mode={editingAssessment?.type === 'math' ? (editingAssessment?.mode || 'edit') : 'create'}
                      onSuccess={handleAssessmentSuccess}
                      onCancel={() => {
                        setShowSkillAssessment(null);
                        setEditingAssessment(null);
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Reading Assessments ({readingAssessments.length}/{MAX_ASSESSMENTS})
                        </CardTitle>
                        <Button onClick={() => handleCreateAssessment('reading')} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderAssessmentTable(readingAssessments, 'reading')}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <PenTool className="h-5 w-5 text-success" />
                          Writing Assessments ({writingAssessments.length}/{MAX_ASSESSMENTS})
                        </CardTitle>
                        <Button onClick={() => handleCreateAssessment('writing')} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderAssessmentTable(writingAssessments, 'writing')}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="h-5 w-5 text-info" />
                          Math Assessments ({mathAssessments.length}/{MAX_ASSESSMENTS})
                        </CardTitle>
                        <Button onClick={() => handleCreateAssessment('math')} size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          New
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderAssessmentTable(mathAssessments, 'math')}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="flex-1">
            <CardContent className="py-12">
              <div className="text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Comprehensive Assessments Not Required
                </h3>
                <p className="text-muted-foreground mb-4">
                  Formal comprehensive assessments are designed for students in Grade 3 and above.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-900 font-medium mb-2">
                    <strong>{selectedStudent.fullName}</strong> is currently in <strong><GradeDisplay grade={selectedStudent.grade} /></strong>
                  </p>
                  <p className="text-sm text-primary">
                    Students in Nursery, LKG, UKG, Kindergarten, Grade 1, and Grade 2 do not require these detailed assessments at this stage of their development.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  For early grade students, please use age-appropriate observation and developmental milestone tracking instead.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="flex-1">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No Student Selected</h3>
              <p className="text-muted-foreground">
                Please select a student from above to begin an assessment
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={(studentId, student) => setSelectedStudent(student)}
        selectedStudentId={selectedStudent?.id}
      />

      <Dialog open={showFormalForm} onOpenChange={setShowFormalForm}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>
                {editingAssessment?.mode === 'view'
                  ? 'View Formal Assessment'
                  : editingAssessment
                    ? 'Edit Formal Assessment'
                    : 'New Formal Assessment Referral'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6">
            <FormalAssessmentForm
              studentId={selectedStudent?.id || ''}
              referredBy={user?.profile?.fullName || 'Educator'}
              assessmentId={editingAssessment?.id}
              initialData={editingAssessment}
              mode={editingAssessment?.mode || (editingAssessment ? 'edit' : 'create')}
              onSuccess={handleAssessmentSuccess}
              onCancel={() => {
                setShowFormalForm(false);
                setEditingAssessment(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <MaxAssessmentsWarningDialog
        isOpen={showMaxWarning}
        onClose={() => {
          setShowMaxWarning(false);
          setPendingAssessmentType(null);
          setOldestAssessment(null);
        }}
        onConfirm={handleMaxWarningConfirm}
        oldestAssessment={oldestAssessment}
        assessmentTypeName={pendingAssessmentType || ''}
      />
    </PageWrapper>
  );
}