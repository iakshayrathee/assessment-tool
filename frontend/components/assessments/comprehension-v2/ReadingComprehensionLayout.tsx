'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Save, Eye, Download, X, Lock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';

import { ComprehensionSetupTab, type ReadingPrefill } from './ComprehensionSetupTab';
import { ComprehensionPassageTab } from './ComprehensionPassageTab';
import { ComprehensionSkillsTab } from './ComprehensionSkillsTab';
import { ComprehensionBehaviourTab } from './ComprehensionBehaviourTab';
import { ComprehensionErrorAnalysisTab } from './ComprehensionErrorAnalysisTab';
import { ComprehensionResultsTab } from './ComprehensionResultsTab';
import { ComprehensionStrengthsTab } from './ComprehensionStrengthsTab';
import { ComprehensionChallengesTab } from './ComprehensionChallengesTab';

// Results tab moved to last position
const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'passage', label: 'Passage' },
  { id: 'skills', label: 'Skills' },
  { id: 'behaviour', label: 'Behaviour' },
  { id: 'errors', label: 'Errors' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'results', label: 'Results' },
];

interface Props {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
  /** Latest Reading assessment for this student — used to pre-fill setup fields */
  readingData?: any;
}

function buildInitialState(data?: any) {
  const comp = data?.comprehension || {};
  return {
    setup: comp.setup || {
      assessmentDate: new Date().toISOString().split('T')[0],
    },
    passage: comp.passage || {},
    skills: comp.skills || {},
    behaviour: comp.behaviour || {},
    errorAnalysis: comp.errorAnalysis || {},
    results: comp.results || {},
    strengths: comp.strengths || {},
    challenges: comp.challenges || {},
  };
}

function buildPayload(state: ReturnType<typeof buildInitialState>, studentId: string, tabIdx: number): any {
  return {
    studentId,
    assessmentDate: state.setup.assessmentDate,
    currentStep: tabIdx + 1,
    comprehension: {
      setup: state.setup,
      passage: state.passage,
      skills: state.skills,
      behaviour: state.behaviour,
      errorAnalysis: state.errorAnalysis,
      results: state.results,
      strengths: state.strengths,
      challenges: state.challenges,
    },
    errorAnalysis: state.errorAnalysis,
    progressTracking: { flowType: 'READING_COMPREHENSION' },
  };
}

export function ReadingComprehensionLayout({
  studentId,
  studentGrade,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
  readingData,
}: Props) {
  const { t } = useTranslation('assessments');
  const isViewMode = mode === 'view';

  // Build pre-fill from the most recent Reading assessment
  const readingPrefill: ReadingPrefill | undefined = readingData
    ? {
        grade: readingData.currentGrade || studentGrade,
        language: readingData.readingResources?.setup?.language,
        assessmentDate: readingData.assessmentDate
          ? new Date(readingData.assessmentDate).toISOString().split('T')[0]
          : undefined,
        functionalGradeLevel: readingData.functionalGradeLevel,
      }
    : studentGrade
    ? { grade: studentGrade }
    : undefined;

  const [activeTab, setActiveTab] = useState('setup');
  const [state, setState] = useState(() => buildInitialState(initialData));
  const [savedId, setSavedId] = useState<string | null>(assessmentId || initialData?.id || null);
  const [savedAssessment, setSavedAssessment] = useState<any>(initialData || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(isViewMode);

  // Save Draft: warning dialog + lock state
  const [showDraftWarning, setShowDraftWarning] = useState(false);
  // Restore draft lock from persisted IN_PROGRESS status
  const [isDraftLocked, setIsDraftLocked] = useState(
    () => initialData?.status === 'IN_PROGRESS'
  );

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTabIdx = TABS.findIndex((t) => t.id === activeTab);

  // Once draft is locked, treat as view-mode for inputs
  const isInputDisabled = isViewMode || isDraftLocked;

  const updateSection = useCallback(<K extends keyof ReturnType<typeof buildInitialState>>(
    key: K,
    val: any
  ) => {
    setState((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Auto-save (only when not locked)
  useEffect(() => {
    if (isViewMode || isDraftLocked || !savedId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = buildPayload(state, studentId, activeTabIdx);
        await apiClient.updateReadingSkillAssessment(savedId, payload);
      } catch { /* silent */ }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [state, activeTab, isDraftLocked]);

  const handleSave = async (locked = false) => {
    if (isViewMode) return;
    setIsSaving(true);
    try {
      const payload = {
        ...buildPayload(state, studentId, activeTabIdx),
        ...(locked ? { status: 'IN_PROGRESS' } : {}),
      };
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

  /** Called when user clicks Save Draft — shows warning first */
  const handleSaveDraftClick = () => {
    setShowDraftWarning(true);
  };

  /** Confirmed: save + lock */
  const handleConfirmSaveDraft = async () => {
    setShowDraftWarning(false);
    await handleSave(true);
    setIsDraftLocked(true);
  };

  /** Save just the passage section */
  const handlePassageSave = async () => {
    if (isInputDisabled) return;
    await handleSave(false);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      let id = savedId;
      const payload = {
        ...buildPayload(state, studentId, 7),
        ...(isDraftLocked ? { status: 'IN_PROGRESS' } : {}),
      };
      if (!id) {
        const res = await apiClient.createReadingSkillAssessment(payload);
        id = res?.id || res?.data?.id;
        setSavedId(id);
      } else {
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
    const el = document.getElementById('comprehension-v2-report');
    if (!el) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().from(el).set({
        margin: 10,
        filename: `Comprehension_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`,
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
      {/* Header */}
      <Card>
        <CardContent className="pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">Reading Comprehension — Skill Assessment</h2>
            {savedId && <p className="text-xs text-muted-foreground">ID: {savedId}</p>}
            {isDraftLocked && (
              <div className="flex items-center gap-1.5 mt-1 text-amber-600">
                <Lock className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Draft saved — locked for editing</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isViewMode && !isDraftLocked && (
              <Button variant="outline" size="sm" onClick={handleSaveDraftClick} disabled={isSaving}>
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

      {/* Tabs — Results moved to last */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="setup" className="mt-4">
          <ComprehensionSetupTab
            data={state.setup}
            onChange={(d) => updateSection('setup', d)}
            disabled={isInputDisabled}
            prefill={readingPrefill}
          />
        </TabsContent>

        <TabsContent value="passage" className="mt-4">
          <ComprehensionPassageTab
            data={state.passage}
            onChange={(d) => updateSection('passage', d)}
            onSave={handlePassageSave}
            isSaving={isSaving}
            disabled={isInputDisabled}
          />
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <ComprehensionSkillsTab
            data={state.skills}
            onChange={(d) => updateSection('skills', d)}
            disabled={isInputDisabled}
            studentGrade={studentGrade}
          />
        </TabsContent>

        <TabsContent value="behaviour" className="mt-4">
          <ComprehensionBehaviourTab
            data={state.behaviour}
            onChange={(d) => updateSection('behaviour', d)}
            disabled={isInputDisabled}
          />
        </TabsContent>

        <TabsContent value="errors" className="mt-4">
          <ComprehensionErrorAnalysisTab
            data={state.errorAnalysis}
            onChange={(d) => updateSection('errorAnalysis', d)}
            disabled={isInputDisabled}
          />
        </TabsContent>

        <TabsContent value="strengths" className="mt-4">
          <ComprehensionStrengthsTab
            data={state.strengths}
            onChange={(d) => updateSection('strengths', d)}
            disabled={isInputDisabled}
          />
        </TabsContent>

        <TabsContent value="challenges" className="mt-4">
          <div className="space-y-4">
            <ComprehensionChallengesTab
              data={state.challenges}
              onChange={(d) => updateSection('challenges', d)}
              disabled={isInputDisabled}
            />
            {!isViewMode && !isDraftLocked && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleSaveDraftClick} disabled={isSaving}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {t('saveDraft', { defaultValue: 'Save Draft' })}
                </Button>
                <Button onClick={handleFinish} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  {isSaving ? t('completing', { defaultValue: 'Completing...' }) : t('completeAssessment', { defaultValue: 'Complete Assessment' })}
                </Button>
              </div>
            )}
            {isDraftLocked && !isViewMode && (
              <div className="flex justify-end">
                <Button onClick={handleFinish} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  {isSaving ? t('completing', { defaultValue: 'Completing...' }) : t('completeAssessment', { defaultValue: 'Complete Assessment' })}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Results — now last tab */}
        <TabsContent value="results" className="mt-4">
          <ComprehensionResultsTab
            skills={state.skills}
            onResultsChange={(r) => updateSection('results', r)}
          />
        </TabsContent>
      </Tabs>

      {/* Save Draft Warning Dialog */}
      <Dialog open={showDraftWarning} onOpenChange={setShowDraftWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Save Draft?
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p>
                Saving as a draft will <strong>lock this assessment for further editing</strong>.
              </p>
              <p>
                You will still be able to complete and submit it, but no fields can be changed after saving.
              </p>
              <p>Are you sure you want to proceed?</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDraftWarning(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSaveDraft} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
              <Lock className="h-4 w-4 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save & Lock Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reading Comprehension Assessment Report</DialogTitle>
          </DialogHeader>
          <div id="comprehension-v2-report" className="p-4 space-y-4 text-sm">
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary">Reading Comprehension Report</h3>
              <p className="text-muted-foreground">Date: {state.setup.assessmentDate}</p>
            </div>

            {state.setup.grade && (
              <div><strong>Grade:</strong> {state.setup.grade}</div>
            )}
            {state.setup.language && (
              <div><strong>Language:</strong> {state.setup.language}</div>
            )}
            {state.setup.purpose && (
              <div><strong>Purpose:</strong> {state.setup.purpose}</div>
            )}

            {Object.keys(state.skills).length > 0 && state.results?.overall !== undefined && (
              <div className="p-4 rounded-lg border bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">Results</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Literal:</strong> {state.results.literal}%</div>
                  <div><strong>Inferential:</strong> {state.results.inferential}%</div>
                  <div><strong>Vocabulary:</strong> {state.results.vocabulary}%</div>
                  <div><strong>Critical Thinking:</strong> {state.results.critical}%</div>
                  <div className="col-span-2"><strong>Overall:</strong> {state.results.overall}% — {state.results.functionalLevel}</div>
                </div>
              </div>
            )}

            {state.strengths?.selected?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Strengths</h4>
                <div className="flex flex-wrap gap-2">
                  {state.strengths.selected.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {state.challenges?.selected?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Challenges</h4>
                <div className="flex flex-wrap gap-2">
                  {state.challenges.selected.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowPreview(false); if (!isViewMode) onSuccess?.(); }}>
              {t('close', { defaultValue: 'Close' })}
            </Button>
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              {t('downloadPDF', { defaultValue: 'Download PDF' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
