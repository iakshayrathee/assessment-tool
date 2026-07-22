'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';

import { AssessmentDetailsTab } from './AssessmentDetailsTab';
import { AssessmentMaterialTab } from './AssessmentMaterialTab';
import { ReadingBehaviourTab } from './ReadingBehaviourTab';
import { ReadingStrengthsTab } from './ReadingStrengthsTab';
import { ReadingAssessmentPreview } from '@/components/assessments/reading-sections/ReadingAssessmentPreview';
import type { TextSectionData } from './GradeTextSections';
import type { GradeAttempt } from '@/components/assessments/shared/AttemptHistoryPanel';

interface Props {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

function buildPayload(state: ReturnType<typeof buildInitialState>, studentId: string, tab: string): any {
  const { details, approach, attempts, functionalGrade, schoolText, knownText, unknownText, battery, behaviour, strengths } = state;
  return {
    studentId,
    assessmentDate: details.assessmentDate,
    functionalGradeLevel: functionalGrade,
    currentStep: ['details', 'material', 'behaviour', 'strengths'].indexOf(tab) + 1,
    // scalar behaviour fields
    interestInReading: behaviour.interestInReading,
    confidenceLevel: behaviour.confidenceLevel,
    readingStamina: behaviour.readingStamina,
    frustrationTolerance: behaviour.frustrationTolerance,
    taskAvoidance: behaviour.taskAvoidance,
    attentionSpanMinutes: behaviour.attentionSpanMinutes,
    promptDependency: behaviour.promptDependency,
    emotionalResponse: behaviour.emotionalResponse,
    motivation: behaviour.motivation,
    behaviorObservations: behaviour.behaviorObservations,
    // scalar text section fields
    schoolTextGradeLevel: schoolText.gradeLevelUsed,
    schoolTextDifficulty: schoolText.difficulty,
    schoolTextQuality: schoolText.accuracy,
    schoolTextFluency: schoolText.fluency,
    schoolTextErrors: schoolText.errors,
    schoolTextObservation: schoolText.observation,
    knownTextType: knownText.source,
    knownTextFamiliarity: knownText.familiarity,
    knownTextDifficulty: knownText.difficulty,
    knownTextQuality: knownText.accuracy,
    knownTextFluency: knownText.fluency,
    knownTextErrors: knownText.errors,
    knownTextObservation: knownText.observation,
    unknownTextSource: unknownText.source,
    unknownTextDifficulty: unknownText.difficulty,
    unknownTextQuality: unknownText.accuracy,
    unknownTextFluency: unknownText.fluency,
    unknownTextErrors: unknownText.errors,
    unknownTextObservation: unknownText.observation,
    // battery scalars
    batteryTestConducted: !!(battery.observation || battery.performance),
    batteryTestSummary: battery.observation,
    batteryTestReportUrl: battery.reportUrl,
    // JSON columns
    readingResources: {
      setup: {
        assessor: details.assessor,
        language: details.language,
        durationMinutes: details.durationMinutes,
        purpose: details.purpose,
      },
      approach,
      battery: {
        performance: battery.performance,
        remarks: battery.remarks,
      },
    },
    gradeLevelMappings: { attempts },
    strengths: strengths,
    redFlags: { behaviour: {
      behaviours: behaviour.behaviours,
      distractibility: behaviour.distractibility,
      impulsivity: behaviour.impulsivity,
      persistence: behaviour.persistence,
      overallRating: behaviour.overallRating,
    }},
    progressTracking: { flowType: 'READING' },
  };
}

function buildInitialState(data?: any) {
  const pt = data?.progressTracking || {};
  const rr = data?.readingResources || {};
  const gm = data?.gradeLevelMappings || {};
  const rf = data?.redFlags?.behaviour || {};
  const str = data?.strengths || {};

  return {
    details: {
      assessmentDate: data?.assessmentDate ? new Date(data.assessmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      assessor: rr?.setup?.assessor || '',
      language: rr?.setup?.language || '',
      durationMinutes: rr?.setup?.durationMinutes,
      purpose: rr?.setup?.purpose || '',
    },
    approach: (rr?.approach || 'grade') as 'grade' | 'skill',
    attempts: (gm?.attempts || []) as GradeAttempt[],
    functionalGrade: data?.functionalGradeLevel || '',
    schoolText: {
      gradeLevelUsed: data?.schoolTextGradeLevel,
      difficulty: data?.schoolTextDifficulty,
      accuracy: data?.schoolTextQuality,
      fluency: data?.schoolTextFluency,
      errors: data?.schoolTextErrors,
      observation: data?.schoolTextObservation,
    } as TextSectionData,
    knownText: {
      source: data?.knownTextType,
      familiarity: data?.knownTextFamiliarity,
      difficulty: data?.knownTextDifficulty,
      accuracy: data?.knownTextQuality,
      fluency: data?.knownTextFluency,
      errors: data?.knownTextErrors,
      observation: data?.knownTextObservation,
    } as TextSectionData,
    unknownText: {
      source: data?.unknownTextSource,
      difficulty: data?.unknownTextDifficulty,
      accuracy: data?.unknownTextQuality,
      fluency: data?.unknownTextFluency,
      errors: data?.unknownTextErrors,
      observation: data?.unknownTextObservation,
    } as TextSectionData,
    battery: {
      observation: data?.batteryTestSummary || rr?.battery?.observation || '',
      performance: rr?.battery?.performance || '',
      remarks: rr?.battery?.remarks || '',
      reportUrl: data?.batteryTestReportUrl || '',
    },
    behaviour: {
      interestInReading: data?.interestInReading as number | undefined,
      motivation: data?.motivation as string | undefined,
      confidenceLevel: data?.confidenceLevel as number | undefined,
      readingStamina: data?.readingStamina as number | undefined,
      frustrationTolerance: data?.frustrationTolerance as number | undefined,
      taskAvoidance: data?.taskAvoidance as boolean | undefined,
      attentionSpanMinutes: data?.attentionSpanMinutes as number | undefined,
      promptDependency: data?.promptDependency as string | undefined,
      emotionalResponse: data?.emotionalResponse as string | undefined,
      behaviorObservations: data?.behaviorObservations as string | undefined,
      behaviours: (rf?.behaviours || []) as string[],
      distractibility: (rf?.distractibility || '') as string,
      impulsivity: (rf?.impulsivity || '') as string,
      persistence: (rf?.persistence || '') as string,
      overallRating: (rf?.overallRating || '') as string,
    },
    strengths: str,
    skillData: data || {},
  };
}

export function ReadingAssessmentLayout({
  studentId,
  studentGrade,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
}: Props) {
  const { t } = useTranslation(['assessments', 'educator']);
  const isViewMode = mode === 'view';

  const [activeTab, setActiveTab] = useState('details');
  const [state, setState] = useState(() => buildInitialState(initialData));
  const [savedId, setSavedId] = useState<string | null>(assessmentId || initialData?.id || null);
  const [savedAssessment, setSavedAssessment] = useState<any>(initialData || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(isViewMode);
  const startTimeRef = useRef<number>(Date.now());
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback(<K extends keyof ReturnType<typeof buildInitialState>>(
    key: K,
    val: any
  ) => {
    setState((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (isViewMode || !savedId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = buildPayload(state, studentId, activeTab);
        await apiClient.updateReadingSkillAssessment(savedId, payload);
      } catch {
        // silent
      }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [state, activeTab]);

  const handleSave = async () => {
    if (isViewMode) return;
    setIsSaving(true);
    try {
      const payload = buildPayload(state, studentId, activeTab);
      let res;
      if (savedId) {
        res = await apiClient.updateReadingSkillAssessment(savedId, payload);
      } else {
        res = await apiClient.createReadingSkillAssessment(payload);
        setSavedId(res?.id || res?.data?.id);
      }
      setSavedAssessment(res?.data || res);
      toast.success(t('assessmentSaved'));
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      let id = savedId;
      if (!id) {
        const payload = buildPayload(state, studentId, 'strengths');
        const res = await apiClient.createReadingSkillAssessment(payload);
        id = res?.id || res?.data?.id;
        setSavedId(id);
      } else {
        const payload = buildPayload(state, studentId, 'strengths');
        await apiClient.updateReadingSkillAssessment(id, payload);
      }
      const res = await apiClient.completeReadingSkillAssessment(id!);
      setSavedAssessment(res?.data || res);
      toast.success(t('assessmentSubmitted'));
      setShowPreview(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to complete assessment');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async () => {
    const reportEl = document.getElementById('reading-v2-report');
    if (!reportEl) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().from(reportEl).set({
        margin: 10,
        filename: `Reading_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).save();
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <Card>
        <CardContent className="pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">{t('reading', { defaultValue: 'Reading' })} — {t('skillAssessment', { defaultValue: 'Skill Assessment' })}</h2>
            {savedId && <p className="text-xs text-muted-foreground">ID: {savedId}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isViewMode && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSaving ? t('savingAssessment', { defaultValue: 'Saving...' }) : t('saveDraft', { defaultValue: 'Save Draft' })}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {t('viewReport', { defaultValue: 'View Report' })}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              {isViewMode ? t('close', { defaultValue: 'Close' }) : t('cancel', { defaultValue: 'Cancel' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Assessment Details</TabsTrigger>
          <TabsTrigger value="material">Assessment Material</TabsTrigger>
          <TabsTrigger value="behaviour">Reading Behaviour</TabsTrigger>
          <TabsTrigger value="strengths">Reading Strengths</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <AssessmentDetailsTab
            data={state.details}
            onChange={(v) => update('details', { ...state.details, ...v })}
            disabled={isViewMode}
            startTime={startTimeRef.current}
          />
        </TabsContent>

        <TabsContent value="material" className="mt-4">
          <AssessmentMaterialTab
            approach={state.approach}
            onApproachChange={(a) => update('approach', a)}
            studentGrade={studentGrade}
            attempts={state.attempts}
            onAttemptsChange={(a) => update('attempts', a)}
            functionalGradeLevel={state.functionalGrade}
            onFunctionalGradeChange={(g) => update('functionalGrade', g)}
            schoolText={state.schoolText}
            knownText={state.knownText}
            unknownText={state.unknownText}
            onSchoolTextChange={(d) => update('schoolText', d)}
            onKnownTextChange={(d) => update('knownText', d)}
            onUnknownTextChange={(d) => update('unknownText', d)}
            batteryData={state.battery}
            onBatteryChange={(d) => update('battery', d)}
            formData={state.skillData}
            onFormDataChange={(u) => update('skillData', { ...state.skillData, ...u })}
            onSave={handleSave}
            onFinish={handleFinish}
            disabled={isViewMode}
            isSaving={isSaving}
          />
        </TabsContent>

        <TabsContent value="behaviour" className="mt-4">
          <ReadingBehaviourTab
            data={state.behaviour}
            onChange={(d) => update('behaviour', d)}
            disabled={isViewMode}
          />
        </TabsContent>

        <TabsContent value="strengths" className="mt-4">
          <div className="space-y-4">
            <ReadingStrengthsTab
              data={state.strengths}
              onChange={(d) => update('strengths', d)}
              disabled={isViewMode}
            />
            {!isViewMode && (
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {t('saveDraft', { defaultValue: 'Save Draft' })}
                </Button>
                <Button onClick={handleFinish} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  {isSaving ? t('completing', { defaultValue: 'Completing...' }) : t('completeAssessment', { defaultValue: 'Complete Assessment' })}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('readingAssessmentReport', { defaultValue: 'Reading Assessment Report' })}</DialogTitle>
          </DialogHeader>
          <div id="reading-v2-report">
            <ReadingAssessmentPreview
              data={{
                assessmentDate: state.details.assessmentDate,
                interestInReading: state.behaviour.interestInReading,
                attentionSpanMinutes: state.behaviour.attentionSpanMinutes,
                readingStamina: state.behaviour.readingStamina,
                frustrationTolerance: state.behaviour.frustrationTolerance,
                emotionalResponse: state.behaviour.emotionalResponse,
                taskAvoidance: state.behaviour.taskAvoidance,
                motivation: state.behaviour.motivation,
                confidenceLevel: state.behaviour.confidenceLevel,
                behaviorObservations: state.behaviour.behaviorObservations,
                promptDependency: state.behaviour.promptDependency,
                schoolTextGradeLevel: state.schoolText.gradeLevelUsed,
                schoolTextDifficulty: state.schoolText.difficulty,
                schoolTextQuality: state.schoolText.accuracy,
                schoolTextFluency: state.schoolText.fluency,
                schoolTextErrors: state.schoolText.errors,
                schoolTextObservation: state.schoolText.observation,
                knownTextType: state.knownText.source,
                knownTextFamiliarity: state.knownText.familiarity,
                knownTextDifficulty: state.knownText.difficulty,
                knownTextQuality: state.knownText.accuracy,
                knownTextFluency: state.knownText.fluency,
                knownTextErrors: state.knownText.errors,
                knownTextObservation: state.knownText.observation,
                unknownTextSource: state.unknownText.source,
                unknownTextDifficulty: state.unknownText.difficulty,
                unknownTextQuality: state.unknownText.accuracy,
                unknownTextFluency: state.unknownText.fluency,
                unknownTextErrors: state.unknownText.errors,
                unknownTextObservation: state.unknownText.observation,
                strengths: state.strengths,
                redFlags: { behaviour: state.behaviour },
                progressTracking: { flowType: 'READING' },
              }}
              savedAssessment={savedAssessment}
              studentDetails={savedAssessment?.student}
              educatorDetails={savedAssessment?.specialEducator}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowPreview(false); if (!isViewMode) onSuccess?.(); }}>
              {t('close', { defaultValue: 'Close' })}
            </Button>
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" /> {t('downloadPDF', { defaultValue: 'Download PDF' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
