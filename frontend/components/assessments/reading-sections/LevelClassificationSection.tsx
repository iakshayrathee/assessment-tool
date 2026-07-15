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

export function LevelClassificationSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const classifyLevel = (accuracy: number | undefined | null): string | null => {
    if (accuracy === undefined || accuracy === null) return null;
    if (accuracy >= 90) return 'Independent';
    if (accuracy >= 75) return 'Instructional';
    return 'Frustration';
  };

  const getLevelColor = (level: string | null): string => {
    if (!level) return '';
    if (level === 'Independent') return 'text-green-700 bg-green-50 border-green-200';
    if (level === 'Instructional') return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getLevelDisplayLabel = (level: string) => {
    const map: Record<string, string> = {
      'Independent': t('levelIndependent', { defaultValue: 'Independent' }),
      'Instructional': t('levelInstructional', { defaultValue: 'Instructional' }),
      'Frustration': t('levelFrustration', { defaultValue: 'Frustration' })
    };
    return map[level] || level;
  };

  const knownLevel = classifyLevel(data.knownTextAccuracy);
  const unknownLevel = classifyLevel(data.unknownTextAccuracy);

  // Also sync from reading resources if available
  const resourceKnownAccuracy = data.readingResources?.knownText?.accuracyPercent;
  const resourceUnknownAccuracy = data.readingResources?.unknownText?.accuracyPercent;

  const effectiveKnownAccuracy = data.knownTextAccuracy ?? resourceKnownAccuracy;
  const effectiveUnknownAccuracy = data.unknownTextAccuracy ?? resourceUnknownAccuracy;

  const effectiveKnownLevel = classifyLevel(effectiveKnownAccuracy);
  const effectiveUnknownLevel = classifyLevel(effectiveUnknownAccuracy);
  const effectiveFinalLevel = effectiveUnknownLevel || effectiveKnownLevel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('autoCalculatedLevelTitle', { defaultValue: 'Auto-Calculated Level Classification' })}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('levelClassificationDesc', { defaultValue: 'Levels are automatically classified based on accuracy percentages. Independent ≥90% | Instructional 75–89% | Frustration <75%' })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Known Text */}
          <div className="space-y-3">
            <div>
              <Label>{t('knownTextAccuracyLabel', { defaultValue: 'Known Text Accuracy %' })}</Label>
              <Input
                type="number" min={0} max={100} step={0.1}
                value={data.knownTextAccuracy ?? ''}
                onChange={(e) => onChange({ knownTextAccuracy: e.target.value ? Number(e.target.value) : undefined })}
                placeholder={t('enterAccuracyPlaceholder', { defaultValue: 'Enter accuracy (0-100)' })}
                disabled={disabled}
                className="mt-1"
              />
            </div>
            {effectiveKnownLevel && (
              <div className={`p-3 rounded-lg border ${getLevelColor(effectiveKnownLevel)}`}>
                <p className="text-sm font-medium">
                  {t('knownTextLevelLabel', { defaultValue: 'Known Text Level: {{level}}', level: getLevelDisplayLabel(effectiveKnownLevel) })}
                </p>
                <p className="text-xs mt-0.5">
                  {t('basedOnAccuracy', { defaultValue: 'Based on {{accuracy}}% accuracy', accuracy: effectiveKnownAccuracy })}
                </p>
              </div>
            )}
          </div>

          {/* Unknown Text */}
          <div className="space-y-3">
            <div>
              <Label>{t('unknownTextAccuracyLabel', { defaultValue: 'Unknown Text Accuracy %' })}</Label>
              <Input
                type="number" min={0} max={100} step={0.1}
                value={data.unknownTextAccuracy ?? ''}
                onChange={(e) => onChange({ unknownTextAccuracy: e.target.value ? Number(e.target.value) : undefined })}
                placeholder={t('enterAccuracyPlaceholder', { defaultValue: 'Enter accuracy (0-100)' })}
                disabled={disabled}
                className="mt-1"
              />
            </div>
            {effectiveUnknownLevel && (
              <div className={`p-3 rounded-lg border ${getLevelColor(effectiveUnknownLevel)}`}>
                <p className="text-sm font-medium">
                  {t('unknownTextLevelLabel', { defaultValue: 'Unknown Text Level: {{level}}', level: getLevelDisplayLabel(effectiveUnknownLevel) })}
                </p>
                <p className="text-xs mt-0.5">
                  {t('basedOnAccuracy', { defaultValue: 'Based on {{accuracy}}% accuracy', accuracy: effectiveUnknownAccuracy })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Final Reading Level */}
        {effectiveFinalLevel && (
          <div className={`p-4 rounded-lg border-2 ${getLevelColor(effectiveFinalLevel)} text-center`}>
            <p className="text-lg font-bold">
              {t('finalReadingLevelLabel', { defaultValue: 'Final Reading Level: {{level}}', level: getLevelDisplayLabel(effectiveFinalLevel) })}
            </p>
            <p className="text-xs mt-1">
              {effectiveFinalLevel === 'Independent' && t('independentDesc', { defaultValue: 'Student can read independently with minimal support needed.' })}
              {effectiveFinalLevel === 'Instructional' && t('instructionalDesc', { defaultValue: 'Student needs guided instruction and support while reading.' })}
              {effectiveFinalLevel === 'Frustration' && t('frustrationDesc', { defaultValue: 'Material is too difficult — student needs easier texts and intensive support.' })}
            </p>
          </div>
        )}

        {/* Classification Guide */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="font-medium text-green-700">{getLevelDisplayLabel('Independent')}</p>
            <p className="text-green-600">≥90% accuracy</p>
          </div>
          <div className="p-2 bg-orange-50 rounded text-center">
            <p className="font-medium text-orange-700">{getLevelDisplayLabel('Instructional')}</p>
            <p className="text-orange-600">75–89% accuracy</p>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <p className="font-medium text-red-700">{getLevelDisplayLabel('Frustration')}</p>
            <p className="text-red-600">&lt;75% accuracy</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
