'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

function computeGapValue(current: string | undefined, reading: string | undefined): number | null {
  if (!current || !reading) return null;
  const gradeMap: Record<string, number> = {
    'Pre-K': -1, 'KG': 0, 'LKG': 0, 'UKG': 0.5,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
  };

  const currentNum = gradeMap[current] ?? parseFloat(current);
  const readingNum = gradeMap[reading] ?? parseFloat(reading);

  if (isNaN(currentNum) || isNaN(readingNum)) return null;
  return readingNum - currentNum;
}

export function GradeLevelMappingSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');
  const diff = computeGapValue(data.currentGrade, data.readingGradeLevel);

  let gapText = '';
  if (diff !== null) {
    if (diff === 0) gapText = t('atGradeLevel', { defaultValue: 'At grade level' });
    else if (diff > 0) gapText = t('yearsAbove', { defaultValue: '+{{diff}} year(s) above', diff });
    else gapText = t('yearsBelow', { defaultValue: '{{diff}} year(s) below', diff });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('gradeLevelMappingTitle', { defaultValue: 'Grade Level Mapping' })}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('gradeLevelMappingDesc', { defaultValue: "Compare the student's current grade with their actual reading grade level. The gap is auto-calculated." })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>{t('currentGradeLabel', { defaultValue: 'Current Grade' })}</Label>
            <Input
              value={data.currentGrade || ''}
              onChange={(e) => {
                const val = e.target.value;
                const newDiff = computeGapValue(val, data.readingGradeLevel);
                let newGap = '';
                if (newDiff !== null) {
                  if (newDiff === 0) newGap = 'At grade level';
                  else if (newDiff > 0) newGap = `+${newDiff} years above`;
                  else newGap = `${newDiff} years below`;
                }
                onChange({
                  currentGrade: val,
                  gradeGap: newGap,
                });
              }}
              placeholder="e.g., 4"
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>{t('readingGradeLevelLabel', { defaultValue: 'Reading Grade Level (AI Predicted / Assessed)' })}</Label>
            <Input
              value={data.readingGradeLevel || ''}
              onChange={(e) => {
                const val = e.target.value;
                const newDiff = computeGapValue(data.currentGrade, val);
                let newGap = '';
                if (newDiff !== null) {
                  if (newDiff === 0) newGap = 'At grade level';
                  else if (newDiff > 0) newGap = `+${newDiff} years above`;
                  else newGap = `${newDiff} years below`;
                }
                onChange({
                  readingGradeLevel: val,
                  gradeGap: newGap,
                });
              }}
              placeholder="e.g., 2"
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>{t('gapAutoCalculatedLabel', { defaultValue: 'Gap (Auto-calculated)' })}</Label>
            <Input
              value={gapText || data.gradeGap || ''}
              disabled
              className="mt-1 bg-muted font-medium"
            />
          </div>
        </div>

        {/* Visual Gap Indicator */}
        {gapText && (
          <div className={`p-4 rounded-lg border-2 text-center ${
            diff === 0
              ? 'border-green-300 bg-green-50 text-green-700'
              : diff && diff > 0
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}>
            <p className="text-lg font-bold">{gapText}</p>
            {diff !== null && diff < 0 && (
              <p className="text-xs mt-1">
                {t('gapBelowRecommendation', { defaultValue: 'Student is reading below expected grade level — intervention recommended.' })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
