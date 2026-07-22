'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface AssessmentDetailsData {
  assessmentDate?: string;
  assessor?: string;
  language?: string;
  durationMinutes?: number;
  purpose?: string;
}

interface Props {
  data: AssessmentDetailsData;
  onChange: (updates: Partial<AssessmentDetailsData>) => void;
  disabled?: boolean;
  startTime?: number; // epoch ms when assessment started, for duration tracking
}

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Other', label: 'Other' },
];

const PURPOSE_OPTIONS = [
  { value: 'Screening', label: 'Screening' },
  { value: 'Diagnostic', label: 'Diagnostic' },
  { value: 'Progress Monitoring', label: 'Progress Monitoring' },
  { value: 'Reassessment', label: 'Reassessment' },
];

export function AssessmentDetailsTab({ data, onChange, disabled, startTime }: Props) {
  const { t } = useTranslation('assessments');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-track elapsed time
  useEffect(() => {
    if (disabled || !startTime) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 60000);
      onChange({ durationMinutes: elapsed });
    };
    tick();
    timerRef.current = setInterval(tick, 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime, disabled]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('assessmentDetailsTitle', { defaultValue: 'Assessment Details' })}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('assessmentDetailsDesc', { defaultValue: 'Basic setup information for this assessment session.' })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('dateOfAssessment', { defaultValue: 'Assessment Date' })}</Label>
            <Input
              type="date"
              value={data.assessmentDate || ''}
              onChange={(e) => onChange({ assessmentDate: e.target.value })}
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>{t('assessorLabel', { defaultValue: 'Assessor' })}</Label>
            <Input
              value={data.assessor || ''}
              onChange={(e) => onChange({ assessor: e.target.value })}
              placeholder={t('assessorPlaceholder', { defaultValue: 'Name of assessor...' })}
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>{t('languageOfAssessment', { defaultValue: 'Language of Assessment' })}</Label>
            <Select
              value={data.language || ''}
              onValueChange={(v) => onChange({ language: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('selectLanguagePlaceholder', { defaultValue: 'Select language' })} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('durationAutoLabel', { defaultValue: 'Duration (Auto)' })}</Label>
            <Input
              value={data.durationMinutes !== undefined ? `${data.durationMinutes} min` : ''}
              disabled
              className="mt-1 bg-muted"
              placeholder={t('durationPlaceholder', { defaultValue: 'Auto-tracked...' })}
            />
          </div>

          <div className="md:col-span-2">
            <Label>{t('assessmentPurpose', { defaultValue: 'Assessment Purpose' })}</Label>
            <Select
              value={data.purpose || ''}
              onValueChange={(v) => onChange({ purpose: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('selectPurpose', { defaultValue: 'Select purpose' })} />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
