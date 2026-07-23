'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReadingBatteryWorkspace } from './ReadingBatteryWorkspace';
import { CoreReadingSkillsSection } from '@/components/assessments/reading-sections/CoreReadingSkillsSection';
import { useTranslation } from 'react-i18next';

interface Props {
  // Knowledge-based skill data (developmental skills)
  formData: any;
  onFormDataChange: (updates: any) => void;
  // Battery
  batteryData: { observation?: string; performance?: string; remarks?: string; reportUrl?: string };
  onBatteryChange: (d: any) => void;
  disabled?: boolean;
}

export function AssessmentMaterialTab({
  formData,
  onFormDataChange,
  batteryData,
  onBatteryChange,
  disabled,
}: Props) {
  const { t } = useTranslation('assessments');

  return (
    <div className="space-y-8">
      {/* Knowledge-Based Developmental Skills */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t('knowledgeBasedAssessment', { defaultValue: 'Knowled-Based Assessment' })}
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          {t('knowledgeBasedDesc', { defaultValue: 'Developmental skill areas — not tied to a specific grade level.' })}
        </p>
        <CoreReadingSkillsSection
          data={formData}
          onChange={onFormDataChange}
          disabled={disabled}
        />
      </div>

      {/* Reading Battery Workspace */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {t('assessment2Battery', { defaultValue: 'Reading Battery Workspace' })}
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
