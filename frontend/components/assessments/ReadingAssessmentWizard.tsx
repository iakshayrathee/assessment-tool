'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, ChevronLeft, ChevronRight, Check, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';

import { BasicInfoSection } from './reading-sections/BasicInfoSection';
import { ReadingContextSection } from './reading-sections/ReadingContextSection';
import { ReadingResourcesSection } from './reading-sections/ReadingResourcesSection';
import { ReadingBehaviorSection } from './reading-sections/ReadingBehaviorSection';
import { CoreReadingSkillsSection } from './reading-sections/CoreReadingSkillsSection';
import { ComprehensionSection } from './reading-sections/ComprehensionSection';
import { ErrorAnalysisSection } from './reading-sections/ErrorAnalysisSection';
import { StrengthsSection } from './reading-sections/StrengthsSection';
import { ChallengesSection } from './reading-sections/ChallengesSection';
import { RedFlagsSection } from './reading-sections/RedFlagsSection';
import { LevelClassificationSection } from './reading-sections/LevelClassificationSection';
import { GradeLevelMappingSection } from './reading-sections/GradeLevelMappingSection';
import { AIInsightsSection } from './reading-sections/AIInsightsSection';
import { ProgressTrackingSection } from './reading-sections/ProgressTrackingSection';
import { ReadingAssessmentPreview } from './reading-sections/ReadingAssessmentPreview';

const STEPS = [
  { id: 1, title: 'Basic Info', shortTitle: 'Info' },
  { id: 2, title: 'Reading Context', shortTitle: 'Context' },
  { id: 3, title: 'Reading Resources', shortTitle: 'Resources' },
  { id: 4, title: 'Reading Behavior', shortTitle: 'Behavior' },
  { id: 5, title: 'Core Reading Skills', shortTitle: 'Skills' },
  { id: 6, title: 'Comprehension', shortTitle: 'Comp.' },
  { id: 7, title: 'Error Analysis', shortTitle: 'Errors' },
  { id: 8, title: 'Strengths', shortTitle: 'Strengths' },
  { id: 9, title: 'Challenges', shortTitle: 'Challenges' },
  { id: 10, title: 'Red Flags', shortTitle: 'Flags' },
  { id: 11, title: 'Level Classification', shortTitle: 'Level' },
  { id: 12, title: 'Grade Mapping', shortTitle: 'Grade' },
  { id: 13, title: 'AI Insights & Plan', shortTitle: 'AI Plan' },
  { id: 14, title: 'Progress Tracking', shortTitle: 'Progress' },
];

export interface ReadingAssessmentFormData {
  // Section 1: Basic Info
  assessmentDate?: string;
  mediumOfInstruction?: string;
  firstLanguage?: string;
  parentConcern?: string;

  // Section 2: Reading Context
  readingExposureAtHome?: string;
  readingSupportAtHome?: string;
  readingSupportDetails?: string;
  exposureDetails?: string;
  supportDetails?: string;
  typeOfSchooling?: string;
  languageMismatch?: string;
  previousIntervention?: string;
  previousInterventionType?: string;
  interventionDetails?: string;
  readingMaterialAccess?: string;

// Enhanced Scoring Fields for Learning Context
  exposureScore?: number;
  supportScore?: number;
  interventionScore?: number;
  languageRiskScore?: number;
  materialAccessScore?: number;
  environmentScore?: number;
  environmentBuffer?: number;

  // Section 3: Reading Resources
  readingResources?: any;

  // Section 4: Reading Behavior
  interestInReading?: number;
  attentionSpanMinutes?: number;
  readingStamina?: number;
  frustrationTolerance?: number;
  emotionalResponse?: string;
  taskAvoidance?: boolean;
  motivation?: string;
  confidenceLevel?: number;
  selfCorrectionAbility?: string;
  promptDependency?: string;
  behaviorObservations?: string;

  // Section 5: Core Reading Skills
  phonologicalAwareness?: any;
  decodingSkills?: any;
  wordsPerMinute?: number;
  fluencyAccuracy?: number;
  fluencyErrorRate?: number;
  hesitationCount?: number;
  sightWordsPercent?: number;
  punctuationAwareness?: boolean;
  readingExpression?: string;
  pausingCorrectness?: string;
  skipsLinesVisual?: boolean;
  usesFinger?: boolean;
  losesPlace?: boolean;

  // Section 6: Comprehension
  comprehension?: any;

  // Section 7: Error Analysis
  errorAnalysis?: any;

  // Section 8: Strengths
  strengths?: any;

  // Section 9: Challenges
  primaryChallenge?: string;
  secondaryChallenge?: string;
  challengeSeverity?: string;

  // Section 10: Red Flags
  redFlags?: any;

  // Section 11: Level Classification (auto-computed, but accuracy inputs here)
  knownTextAccuracy?: number;
  unknownTextAccuracy?: number;

  // Section 12: Grade Level Mapping
  currentGrade?: string;
  readingGradeLevel?: string;
  gradeGap?: string;

  // Section 13: AI Insights
  aiInsights?: any;
  aiInsightsStatus?: string;

  // Section 14: Progress Tracking
  progressTracking?: any;

  // Enhanced Scoring System - Resources Section
  schoolTextScore?: number;
  knownTextScore?: number;
  unknownTextScore?: number;
  finalReadingScore?: number;

  // Enhanced Scoring System - Final Risk Assessment
  resourceContextScore?: number;
  finalRiskScore?: number;

  // Detailed Resource Assessment Fields - School Text
  schoolTextGradeLevel?: string;
  schoolTextDifficulty?: string;
  schoolTextQuality?: string;
  schoolTextFluency?: string;
  schoolTextErrors?: string;
  schoolTextObservation?: string;

  // Detailed Resource Assessment Fields - Known Text
  knownTextType?: string;
  knownTextFamiliarity?: string;
  knownTextDifficulty?: string;
  knownTextQuality?: string;
  knownTextFluency?: string;
  knownTextErrors?: string;
  knownTextObservation?: string;

  // Detailed Resource Assessment Fields - Unknown Text
  unknownTextSource?: string;
  unknownTextDifficulty?: string;
  unknownTextQuality?: string;
  unknownTextFluency?: string;
  unknownTextErrors?: string;
  unknownTextObservation?: string;

  // Resource Context Assessment
  materialTypes?: string[];
  materialLevels?: string[];
  readingIndependence?: string;

  // Legacy compat
  [key: string]: any;
}

interface ReadingAssessmentWizardProps {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReadingAssessmentWizard({
  studentId,
  studentGrade,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
}: ReadingAssessmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialData?.currentStep || 1);
  const [formData, setFormData] = useState<ReadingAssessmentFormData>(
    initialData ? mapInitialData(initialData) : { assessmentDate: new Date().toISOString().split('T')[0] }
  );
  const [savedAssessment, setSavedAssessment] = useState<any>(initialData || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(mode === 'view');
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const isViewMode = mode === 'view';

  const studentDetails = savedAssessment?.student || null;
  const educatorDetails = savedAssessment?.specialEducator || null;

  const updateFormData = useCallback((updates: Partial<ReadingAssessmentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Utility function to clean data for API calls
  const cleanDataForApi = (data: ReadingAssessmentFormData): ReadingAssessmentFormData => {
    const cleanedData = { ...data };
    
    // Convert boolean values to strings if they exist
    if (typeof cleanedData.readingSupportAtHome === 'boolean') {
      cleanedData.readingSupportAtHome = cleanedData.readingSupportAtHome ? 'Regular support (daily/weekly)' : 'No support';
    }
    if (typeof cleanedData.languageMismatch === 'boolean') {
      cleanedData.languageMismatch = cleanedData.languageMismatch ? 'Yes - minor difference' : 'No';
    }
    if (typeof cleanedData.previousIntervention === 'boolean') {
      cleanedData.previousIntervention = cleanedData.previousIntervention ? 'School-based support' : 'None';
    }
    
    return cleanedData;
  };

  // Auto-save draft on step change (debounced)
  useEffect(() => {
    if (isViewMode || !savedAssessment?.id) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    setAutoSaveTimer(timer);
    return () => { if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleAutoSave = async () => {
    if (isViewMode || !savedAssessment?.id) return;
    try {
      const cleanedData = cleanDataForApi(formData);
      
      await apiClient.updateReadingSkillAssessment(savedAssessment.id, {
        ...cleanedData,
        studentId,
        currentStep,
      });
    } catch {
      // Silent auto-save failure
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      const cleanedData = cleanDataForApi(formData);
      const payload = { studentId, ...cleanedData, currentStep };
      
      // Debug logging
      console.log('DEBUG: Payload being sent:', {
        readingSupportAtHome: payload.readingSupportAtHome,
        readingSupportAtHomeType: typeof payload.readingSupportAtHome,
        languageMismatch: payload.languageMismatch,
        languageMismatchType: typeof payload.languageMismatch,
        previousIntervention: payload.previousIntervention,
        previousInterventionType: typeof payload.previousIntervention,
      });

      let response;
      if (mode === 'edit' && assessmentId) {
        response = await apiClient.updateReadingSkillAssessment(assessmentId, payload);
        toast.success('Reading assessment updated successfully!');
      } else if (savedAssessment?.id) {
        response = await apiClient.updateReadingSkillAssessment(savedAssessment.id, payload);
        toast.success('Reading assessment saved!');
      } else {
        response = await apiClient.createReadingSkillAssessment(payload);
        toast.success('Reading assessment created!');
      }

      setSavedAssessment(response.data || response);
    } catch (error: any) {
      console.error('Save reading assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to save reading assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    const id = assessmentId || savedAssessment?.id;
    if (!id) {
      await handleSave();
      return;
    }

    try {
      setIsSubmitting(true);
      
      const cleanedData = cleanDataForApi(formData);
      
      // Save latest data first
      await apiClient.updateReadingSkillAssessment(id, { studentId, ...cleanedData, currentStep: 14 });
      // Then mark complete
      const response = await apiClient.completeReadingSkillAssessment(id);
      setSavedAssessment(response.data || response);
      toast.success('Reading assessment completed!');
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentStep < 14) setCurrentStep(currentStep + 1);
  };

  const goPrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const progress = Math.round((currentStep / 14) * 100);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const studentName = studentDetails?.fullName?.replace(/\s+/g, '_') || 'student';
      const grade = studentDetails?.grade ? `grade_${studentDetails.grade}` : 'grade_unknown';
      const educatorName = educatorDetails?.fullName?.replace(/\s+/g, '_') || 'educator';
      const filename = `Reading_${studentName}_${grade}_${educatorName}_${dateStr}_${timeStr}.pdf`;

      html2pdf().from(reportRef.current).set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();
      toast.success('PDF downloaded successfully');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const renderStep = () => {
    const props = { data: formData, onChange: updateFormData, disabled: isViewMode };

    switch (currentStep) {
      case 1: return <BasicInfoSection {...props} studentGrade={studentGrade} />;
      case 2: return <ReadingContextSection {...props} />;
      case 3: return <ReadingResourcesSection {...props} />;
      case 4: return <ReadingBehaviorSection {...props} />;
      case 5: return <CoreReadingSkillsSection {...props} />;
      case 6: return <ComprehensionSection {...props} />;
      case 7: return <ErrorAnalysisSection {...props} />;
      case 8: return <StrengthsSection {...props} />;
      case 9: return <ChallengesSection {...props} />;
      case 10: return <RedFlagsSection {...props} />;
      case 11: return <LevelClassificationSection {...props} />;
      case 12: return <GradeLevelMappingSection {...props} />;
      case 13: return <AIInsightsSection {...props} assessmentId={assessmentId || savedAssessment?.id} studentName={studentDetails?.fullName} studentGrade={studentGrade} />;
      case 14: return <ProgressTrackingSection {...props} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Step Navigation Header */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              Reading Assessment — Step {currentStep} of 14
            </h2>
            <span className="text-sm text-muted-foreground">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />

          {/* Step Pills */}
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  step.id === currentStep
                    ? 'bg-primary text-primary-foreground font-medium'
                    : step.id < currentStep
                    ? 'bg-primary/20 text-primary hover:bg-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {step.shortTitle}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-primary">
          {STEPS[currentStep - 1].title}
        </h3>
        {!isViewMode && (
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSubmitting}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
        )}
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>

          {isViewMode && (
            <Button onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-1" /> View Report
            </Button>
          )}

          {!isViewMode && currentStep < 14 && (
            <Button onClick={goNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {!isViewMode && currentStep === 14 && (
            <Button onClick={handleComplete} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Completing...' : 'Complete Assessment'}
            </Button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reading Assessment Report</DialogTitle>
          </DialogHeader>
          <div ref={reportRef}>
            <ReadingAssessmentPreview
              data={formData}
              savedAssessment={savedAssessment}
              studentDetails={studentDetails}
              educatorDetails={educatorDetails}
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => { setShowPreview(false); if (!isViewMode) onSuccess?.(); }}>
              Close
            </Button>
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mapInitialData(data: any): ReadingAssessmentFormData {
  return {
    assessmentDate: data.assessmentDate ? new Date(data.assessmentDate).toISOString().split('T')[0] : undefined,
    mediumOfInstruction: data.mediumOfInstruction,
    firstLanguage: data.firstLanguage,
    parentConcern: data.parentConcern,
    readingExposureAtHome: data.readingExposureAtHome,
    readingSupportAtHome: data.readingSupportAtHome,
    readingSupportDetails: data.readingSupportDetails,
    exposureDetails: data.exposureDetails,
    supportDetails: data.supportDetails,
    typeOfSchooling: data.typeOfSchooling,
    languageMismatch: data.languageMismatch,
    previousIntervention: data.previousIntervention,
    previousInterventionType: data.previousInterventionType,
    interventionDetails: data.interventionDetails,
    readingMaterialAccess: data.readingMaterialAccess,
    
    // Enhanced Scoring Fields
    exposureScore: data.exposureScore,
    supportScore: data.supportScore,
    interventionScore: data.interventionScore,
    languageRiskScore: data.languageRiskScore,
    materialAccessScore: data.materialAccessScore,
    environmentScore: data.environmentScore,
    environmentBuffer: data.environmentBuffer,
    
    readingResources: data.readingResources,
    interestInReading: data.interestInReading,
    attentionSpanMinutes: data.attentionSpanMinutes,
    readingStamina: data.readingStamina,
    frustrationTolerance: data.frustrationTolerance,
    emotionalResponse: data.emotionalResponse,
    taskAvoidance: data.taskAvoidance,
    motivation: data.motivation,
    confidenceLevel: data.confidenceLevel,
    selfCorrectionAbility: data.selfCorrectionAbility,
    promptDependency: data.promptDependency,
    behaviorObservations: data.behaviorObservations,
    phonologicalAwareness: data.phonologicalAwareness,
    decodingSkills: data.decodingSkills,
    wordsPerMinute: data.wordsPerMinute,
    fluencyAccuracy: data.fluencyAccuracy,
    fluencyErrorRate: data.fluencyErrorRate,
    hesitationCount: data.hesitationCount,
    sightWordsPercent: data.sightWordsPercent,
    punctuationAwareness: data.punctuationAwareness,
    readingExpression: data.readingExpression,
    pausingCorrectness: data.pausingCorrectness,
    skipsLinesVisual: data.skipsLinesVisual,
    usesFinger: data.usesFinger,
    losesPlace: data.losesPlace,
    comprehension: data.comprehension,
    errorAnalysis: data.errorAnalysis,
    strengths: data.strengths,
    primaryChallenge: data.primaryChallenge,
    secondaryChallenge: data.secondaryChallenge,
    challengeSeverity: data.challengeSeverity,
    redFlags: data.redFlags,
    knownTextAccuracy: data.knownTextAccuracy,
    unknownTextAccuracy: data.unknownTextAccuracy,
    currentGrade: data.currentGrade,
    readingGradeLevel: data.readingGradeLevel,
    gradeGap: data.gradeGap,
    aiInsights: data.aiInsights,
    aiInsightsStatus: data.aiInsightsStatus,
    progressTracking: data.progressTracking,
    
    // Enhanced Scoring System - Resources Section
    schoolTextScore: data.schoolTextScore,
    knownTextScore: data.knownTextScore,
    unknownTextScore: data.unknownTextScore,
    finalReadingScore: data.finalReadingScore,
    
    // Enhanced Scoring System - Final Risk Assessment
    resourceContextScore: data.resourceContextScore,
    finalRiskScore: data.finalRiskScore,
    
    // Detailed Resource Assessment Fields - School Text
    schoolTextGradeLevel: data.schoolTextGradeLevel,
    schoolTextDifficulty: data.schoolTextDifficulty,
    schoolTextQuality: data.schoolTextQuality,
    schoolTextFluency: data.schoolTextFluency,
    schoolTextErrors: data.schoolTextErrors,
    schoolTextObservation: data.schoolTextObservation,
    
    // Detailed Resource Assessment Fields - Known Text
    knownTextType: data.knownTextType,
    knownTextFamiliarity: data.knownTextFamiliarity,
    knownTextDifficulty: data.knownTextDifficulty,
    knownTextQuality: data.knownTextQuality,
    knownTextFluency: data.knownTextFluency,
    knownTextErrors: data.knownTextErrors,
    knownTextObservation: data.knownTextObservation,
    
    // Detailed Resource Assessment Fields - Unknown Text
    unknownTextSource: data.unknownTextSource,
    unknownTextDifficulty: data.unknownTextDifficulty,
    unknownTextQuality: data.unknownTextQuality,
    unknownTextFluency: data.unknownTextFluency,
    unknownTextErrors: data.unknownTextErrors,
    unknownTextObservation: data.unknownTextObservation,
    
    // Resource Context Assessment
    materialTypes: data.materialTypes,
    materialLevels: data.materialLevels,
    readingIndependence: data.readingIndependence,
  };
}
