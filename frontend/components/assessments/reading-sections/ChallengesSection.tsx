'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

export function ChallengesSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const CHALLENGE_OPTIONS = [
    { value: 'Decoding', label: t('challengeDecoding', { defaultValue: 'Decoding' }) },
    { value: 'Fluency', label: t('challengeFluency', { defaultValue: 'Fluency' }) },
    { value: 'Comprehension', label: t('challengeComprehension', { defaultValue: 'Comprehension' }) },
    { value: 'Phonological Awareness', label: t('challengePhonological', { defaultValue: 'Phonological Awareness' }) },
    { value: 'Sight Word Recognition', label: t('challengeSightWord', { defaultValue: 'Sight Word Recognition' }) },
    { value: 'Visual Tracking', label: t('challengeVisualTracking', { defaultValue: 'Visual Tracking' }) },
    { value: 'Attention/Focus', label: t('challengeAttentionFocus', { defaultValue: 'Attention/Focus' }) },
    { value: 'Motivation', label: t('challengeMotivation', { defaultValue: 'Motivation' }) },
    { value: 'Language Processing', label: t('challengeLanguageProcessing', { defaultValue: 'Language Processing' }) },
    { value: 'Working Memory', label: t('challengeWorkingMemory', { defaultValue: 'Working Memory' }) },
  ];

  const SEVERITY_OPTIONS = [
    { value: 'Mild', label: t('severityMild', { defaultValue: 'Mild' }) },
    { value: 'Moderate', label: t('severityModerate', { defaultValue: 'Moderate' }) },
    { value: 'Severe', label: t('severitySevere', { defaultValue: 'Severe' }) },
  ];

  const getChallengeLabel = (val: string) => {
    const matched = CHALLENGE_OPTIONS.find(o => o.value === val);
    return matched ? matched.label : val;
  };

  const getSeverityLabel = (val: string) => {
    const matched = SEVERITY_OPTIONS.find(o => o.value === val);
    return matched ? matched.label : val;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('primarySecondaryChallenges', { defaultValue: 'Primary & Secondary Challenges' })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('primaryChallenge', { defaultValue: 'Primary Challenge' })}</Label>
            <Select
              value={data.primaryChallenge || ''}
              onValueChange={(v) => onChange({ primaryChallenge: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectPrimaryChallenge', { defaultValue: 'Select primary challenge' })} /></SelectTrigger>
              <SelectContent>
                {CHALLENGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('secondaryChallenge', { defaultValue: 'Secondary Challenge' })}</Label>
            <Select
              value={data.secondaryChallenge || ''}
              onValueChange={(v) => onChange({ secondaryChallenge: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectSecondaryChallenge', { defaultValue: 'Select secondary challenge' })} /></SelectTrigger>
              <SelectContent>
                {CHALLENGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-w-xs">
          <Label>{t('severity', { defaultValue: 'Severity' })}</Label>
          <Select
            value={data.challengeSeverity || ''}
            onValueChange={(v) => onChange({ challengeSeverity: v })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectSeverity', { defaultValue: 'Select severity' })} /></SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  <span className={o.value === 'Severe' ? 'text-red-600 font-medium' : o.value === 'Moderate' ? 'text-orange-600' : ''}>
                    {o.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        {data.primaryChallenge && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="font-medium">{t('summary', { defaultValue: 'Summary' })}:</span>{' '}
            {getChallengeLabel(data.primaryChallenge)}
            {data.secondaryChallenge ? ` + ${getChallengeLabel(data.secondaryChallenge)}` : ''}
            {data.challengeSeverity ? ` (${getSeverityLabel(data.challengeSeverity)})` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
