'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradeBasedFlow } from './GradeBasedFlow';
import { ReadingBatteryWorkspace } from './ReadingBatteryWorkspace';
import { CoreReadingSkillsSection } from '@/components/assessments/reading-sections/CoreReadingSkillsSection';
import { useTranslation } from 'react-i18next';
import type { TextSectionData } from './GradeTextSections';
import type { GradeAttempt } from '@/components/assessments/shared/AttemptHistoryPanel';

interface Props {
  approach: 'grade' | 'skill';
  onApproachChange: (a: 'grade' | 'skill') => void;
  // Grade-based
  studentGrade?: string;
  attempts: GradeAttempt[];
  onAttemptsChange: (a: GradeAttempt[]) => void;
  functionalGradeLevel?: string;
  onFunctionalGradeChange: (g: string) => void;
  schoolText: TextSectionData;
  knownText: TextSectionData;
  unknownText: TextSectionData;
  onSchoolTextChange: (d: TextSectionData) => void;
  onKnownTextChange: (d: TextSectionData) => void;
  onUnknownTextChange: (d: TextSectionData) => void;
  // Battery
  batteryData: { observation?: string; performance?: string; remarks?: string; reportUrl?: string };
  onBatteryChange: (d: any) => void;
  // Skill-based (delegates to existing sections)
  formData: any;
  onFormDataChange: (updates: any) => void;
  // Actions
  onSave: () => Promise<void>;
  onFinish: () => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
}

export function AssessmentMaterialTab({
  approach,
  onApproachChange,
  studentGrade,
  attempts,
  onAttemptsChange,
  functionalGradeLevel,
  onFunctionalGradeChange,
  schoolText,
  knownText,
  unknownText,
  onSchoolTextChange,
  onKnownTextChange,
  onUnknownTextChange,
  batteryData,
  onBatteryChange,
  formData,
  onFormDataChange,
  onSave,
  onFinish,
  disabled,
  isSaving,
}: Props) {
  const { t } = useTranslation('assessments');

  return (
    <div className="space-y-6">
      {/* Approach Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('assessmentApproach', { defaultValue: 'Assessment Approach' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => !disabled && onApproachChange('grade')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                approach === 'grade'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted/50 border-border'
              }`}
              disabled={disabled}
            >
              {t('gradedBasedAssessment', { defaultValue: 'Grade-Based Assessment' })}
              <p className={`text-xs mt-1 font-normal ${approach === 'grade' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {t('gradeBasedDesc', { defaultValue: 'Iterative grade-descent assessment' })}
              </p>
            </button>
            <button
              type="button"
              onClick={() => !disabled && onApproachChange('skill')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                approach === 'skill'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted/50 border-border'
              }`}
              disabled={disabled}
            >
              {t('skillBasedAssessment', { defaultValue: 'Skill-Based Assessment' })}
              <p className={`text-xs mt-1 font-normal ${approach === 'skill' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {t('skillBasedDesc', { defaultValue: 'Developmental skills assessment' })}
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment 1: Grade or Skill based */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t('assessment1Title', { defaultValue: 'Assessment 1: Reading Evaluation' })}
        </h4>

        {approach === 'grade' ? (
          <GradeBasedFlow
            studentGrade={studentGrade}
            attempts={attempts}
            onAttemptsChange={onAttemptsChange}
            functionalGradeLevel={functionalGradeLevel}
            onFunctionalGradeChange={onFunctionalGradeChange}
            schoolText={schoolText}
            knownText={knownText}
            unknownText={unknownText}
            onSchoolTextChange={onSchoolTextChange}
            onKnownTextChange={onKnownTextChange}
            onUnknownTextChange={onUnknownTextChange}
            onSave={onSave}
            onFinish={onFinish}
            disabled={disabled}
            isSaving={isSaving}
          />
        ) : (
          <CoreReadingSkillsSection
            data={formData}
            onChange={onFormDataChange}
            disabled={disabled}
          />
        )}
      </div>

      {/* Assessment 2: Battery Workspace */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t('assessment2Battery', { defaultValue: 'Assessment 2: Reading Battery Workspace' })}
        </h4>
        <ReadingBatteryWorkspace
          data={batteryData}
          onChange={onBatteryChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
