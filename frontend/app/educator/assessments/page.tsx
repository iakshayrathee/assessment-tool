'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PenTool, Calculator, FileText, Plus, Users, Loader2, Eye, Pencil } from 'lucide-react';
import { FormalAssessmentForm } from '@/components/assessments/FormalAssessmentForm';
import { ReadingAssessmentWizard } from '@/components/assessments/ReadingAssessmentWizard';
import { ReadingAssessmentLayout } from '@/components/assessments/reading-v2/ReadingAssessmentLayout';
import { ReadingComprehensionLayout } from '@/components/assessments/comprehension-v2/ReadingComprehensionLayout';
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

function AssessmentsContent() {
  const { user } = useAuth();
  const { t } = useTranslation('educator');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [assessmentTab, setAssessmentTab] = useState('formal');
  const [showFormalForm, setShowFormalForm] = useState(false);
  const [showSkillAssessment, setShowSkillAssessment] = useState<'reading' | 'writing' | 'math' | 'comprehension' | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const tabParam = searchParams.get('tab');
  const skillParam = searchParams.get('skill');

  useEffect(() => {
    if (tabParam && ['formal', 'skill'].includes(tabParam)) {
      setAssessmentTab(tabParam);
    }
    if (skillParam && ['reading', 'writing', 'math', 'comprehension'].includes(skillParam)) {
      setShowSkillAssessment(skillParam as any);
    } else if (tabParam === 'skill' && !skillParam) {
      setShowSkillAssessment(null);
    }
  }, [tabParam, skillParam]);

  const handleTabChange = (val: string) => {
    setAssessmentTab(val);
    router.replace(`/educator/assessments?tab=${val}`);
  };

  const handleCancelSkill = () => {
    setShowSkillAssessment(null);
    setEditingAssessment(null);
    router.replace('/educator/assessments?tab=skill');
  };

  const [formalAssessments, setFormalAssessments] = useState<any[]>([]);
  const [readingAssessments, setReadingAssessments] = useState<any[]>([]);
  const [comprehensionAssessments, setComprehensionAssessments] = useState<any[]>([]);
  const [writingAssessments, setWritingAssessments] = useState<any[]>([]);
  const [mathAssessments, setMathAssessments] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [editingAssessment, setEditingAssessment] = useState<any>(null);

  const [showMaxWarning, setShowMaxWarning] = useState(false);
  const [pendingAssessmentType, setPendingAssessmentType] = useState<'formal' | 'reading' | 'writing' | 'math' | 'comprehension' | null>(null);
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
      const allReadingRows: any[] = results[1].status === 'fulfilled' ? results[1].value || [] : [];
      setReadingAssessments(
        allReadingRows.filter((r: any) => (r.progressTracking?.flowType ?? 'READING') === 'READING')
      );
      setComprehensionAssessments(
        allReadingRows.filter((r: any) => r.progressTracking?.flowType === 'READING_COMPREHENSION')
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

  const handleCreateAssessment = (type: 'formal' | 'reading' | 'writing' | 'math' | 'comprehension') => {
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
      case 'comprehension':
        assessments = comprehensionAssessments;
        assessmentTypeName = 'Reading Comprehension';
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
        case 'comprehension':
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

  const openAssessmentForm = (type: 'formal' | 'reading' | 'writing' | 'math' | 'comprehension') => {
    setEditingAssessment(null);
    switch (type) {
      case 'formal':
        setShowFormalForm(true);
        break;
      case 'reading':
      case 'writing':
      case 'math':
      case 'comprehension':
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
      case 'comprehension':
        setShowSkillAssessment(type as 'reading' | 'writing' | 'math' | 'comprehension');
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
      case 'comprehension':
        setShowSkillAssessment(type as 'reading' | 'writing' | 'math' | 'comprehension');
        break;
    }
  };

  const handleAssessmentSuccess = () => {
    fetchAssessments();
    setShowFormalForm(false);
    setShowSkillAssessment(null);
    setEditingAssessment(null);
    router.replace(`/educator/assessments?tab=${assessmentTab}`);
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
        <p className="text-center text-muted-foreground py-8">{t('assessments.noAssessmentsYet', { type })}</p>
      );
    }

    const sortedAssessments = [...assessments].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('assessments.tableDate')}</TableHead>
            <TableHead>{t('assessments.tableTypeVersion')}</TableHead>
            {type === 'formal' && <TableHead>{t('assessments.tableAssessmentType')}</TableHead>}
            {type === 'formal' && <TableHead>{t('assessments.tableDiagnosis')}</TableHead>}
            <TableHead>{t('assessments.tableStatus')}</TableHead>
            <TableHead className="text-right">{t('assessments.tableActions')}</TableHead>
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
                  <TableCell>{assessment.diagnosis || t('assessments.pending')}</TableCell>
                </>
              )}
              <TableCell>
                <Badge variant={assessment.completed ? 'default' : 'secondary'}>
                  {assessment.completed ? t('assessments.statusCompleted') : t('assessments.statusInProgress')}
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
                    {t('assessments.view')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAssessment(assessment, type)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {t('assessments.edit')}
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
      title={t('assessments.title')}
      description={t('assessments.subtitle')}
      breadcrumbs={[{ label: t('assessments.breadcrumb') }]}
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
            {t('assessments.selectStudent')}
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
        <Tabs value={assessmentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formal">
              <FileText className="h-4 w-4 mr-2" />
              {t('assessments.tabFormal')}
            </TabsTrigger>
            <TabsTrigger value="skill">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('assessments.tabSkill')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formal" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('assessments.formalReferralsTitle')}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('assessments.formalReferralsDesc', { count: formalAssessments.length, max: MAX_ASSESSMENTS })}
                    </p>
                  </div>
                  <Button onClick={() => handleCreateAssessment('formal')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('assessments.newReferral')}
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
                  <ReadingAssessmentLayout
                    studentId={selectedStudent?.id || ''}
                    studentGrade={selectedStudent?.grade || ''}
                    assessmentId={editingAssessment?.type === 'reading' ? editingAssessment?.id : undefined}
                    initialData={editingAssessment?.type === 'reading' ? editingAssessment : undefined}
                    mode={editingAssessment?.type === 'reading' ? (editingAssessment?.mode || 'edit') : 'create'}
                    onSuccess={handleAssessmentSuccess}
                    onCancel={handleCancelSkill}
                  />
                )}
                {showSkillAssessment === 'comprehension' && (
                  <ReadingComprehensionLayout
                    studentId={selectedStudent?.id || ''}
                    studentGrade={selectedStudent?.grade || ''}
                    assessmentId={editingAssessment?.type === 'comprehension' ? editingAssessment?.id : undefined}
                    initialData={editingAssessment?.type === 'comprehension' ? editingAssessment : undefined}
                    mode={editingAssessment?.type === 'comprehension' ? (editingAssessment?.mode || 'edit') : 'create'}
                    onSuccess={handleAssessmentSuccess}
                    onCancel={handleCancelSkill}
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
                    onCancel={handleCancelSkill}
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
                    onCancel={handleCancelSkill}
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
                        {t('assessments.readingTitle', { count: readingAssessments.length, max: MAX_ASSESSMENTS })}
                      </CardTitle>
                      <Button onClick={() => handleCreateAssessment('reading')} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('assessments.new')}
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
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        {t('assessments.comprehensionTitle', { count: comprehensionAssessments.length, max: MAX_ASSESSMENTS })}
                      </CardTitle>
                      <Button onClick={() => handleCreateAssessment('comprehension')} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('assessments.new')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderAssessmentTable(comprehensionAssessments, 'comprehension')}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-success" />
                        {t('assessments.writingTitle', { count: writingAssessments.length, max: MAX_ASSESSMENTS })}
                      </CardTitle>
                      <Button onClick={() => handleCreateAssessment('writing')} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('assessments.new')}
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
                        {t('assessments.mathTitle', { count: mathAssessments.length, max: MAX_ASSESSMENTS })}
                      </CardTitle>
                      <Button onClick={() => handleCreateAssessment('math')} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('assessments.new')}
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
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">{t('assessments.noStudentSelected')}</h3>
              <p className="text-muted-foreground">
                {t('assessments.selectStudentPrompt')}
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
                  ? t('assessments.dialogViewFormal')
                  : editingAssessment
                    ? t('assessments.dialogEditFormal')
                    : t('assessments.dialogNewFormal')}
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

export default function AssessmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AssessmentsContent />
    </Suspense>
  );
}