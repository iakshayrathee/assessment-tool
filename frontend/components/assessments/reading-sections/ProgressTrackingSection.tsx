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

export function ProgressTrackingSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');
  const progress = data.progressTracking || {};

  const updateProgress = (field: string, value: any) => {
    const updated = { ...progress, [field]: value };

    // Auto-compute improvement %
    if (updated.baselineScore !== undefined && updated.currentScore !== undefined &&
        updated.baselineScore > 0) {
      updated.improvementPercent = Math.round(
        ((updated.currentScore - updated.baselineScore) / updated.baselineScore) * 100
      );
    }

    onChange({ progressTracking: updated });
  };

  const improvement = progress.improvementPercent;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('baselineReassessmentTitle', { defaultValue: 'Baseline, Reassessment & Improvement' })}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('baselineReassessmentDesc', { defaultValue: 'Track progress over time. Improvement % is auto-calculated.' })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Tracking */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>{t('baselineScoreLabel', { defaultValue: 'Baseline Score' })}</Label>
            <Input
              type="number" min={0} max={100}
              value={progress.baselineScore ?? ''}
              onChange={(e) => updateProgress('baselineScore', e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('baselineScorePlaceholder', { defaultValue: 'Initial score (0-100)' })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('currentScoreLabel', { defaultValue: 'Current Score' })}</Label>
            <Input
              type="number" min={0} max={100}
              value={progress.currentScore ?? ''}
              onChange={(e) => updateProgress('currentScore', e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('currentScorePlaceholder', { defaultValue: 'Current score (0-100)' })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('improvementPercentLabel', { defaultValue: 'Improvement %' })}</Label>
            <Input
              value={improvement !== undefined ? `${improvement}%` : ''}
              disabled
              className="mt-1 bg-muted font-medium"
            />
          </div>
        </div>

        {/* Improvement Indicator */}
        {improvement !== undefined && (
          <div className={`p-4 rounded-lg border-2 text-center ${
            improvement > 0
              ? 'border-green-300 bg-green-50 text-green-700'
              : improvement === 0
              ? 'border-gray-300 bg-gray-50 text-gray-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}>
            <p className="text-2xl font-bold">
              {improvement > 0 ? '↑' : improvement < 0 ? '↓' : '→'} {Math.abs(improvement)}%
            </p>
            <p className="text-sm mt-1">
              {improvement > 0 ? t('improvementFromBaseline', { defaultValue: 'Improvement from baseline' }) :
               improvement < 0 ? t('regressionFromBaseline', { defaultValue: 'Regression from baseline' }) :
               t('noChangeFromBaseline', { defaultValue: 'No change from baseline' })}
            </p>
          </div>
        )}

        {/* Session Tracking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('sessionsCompletedLabel', { defaultValue: 'Sessions Completed' })}</Label>
            <Input
              type="number" min={0}
              value={progress.sessionsCompleted ?? ''}
              onChange={(e) => updateProgress('sessionsCompleted', e.target.value ? Number(e.target.value) : undefined)}
              placeholder={t('sessionsCompletedPlaceholder', { defaultValue: 'Number of sessions' })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t('reassessmentDateLabel', { defaultValue: 'Reassessment Date' })}</Label>
            <Input
              type="date"
              value={progress.reassessmentDate || ''}
              onChange={(e) => updateProgress('reassessmentDate', e.target.value)}
              disabled={disabled}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
