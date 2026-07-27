'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GradeSelect } from '@/components/ui/GradeSelect';

const ASSESSMENT_TYPES = [
  { value: 'Grade-Based Assessment', label: 'Grade-Based Assessment' },
  { value: 'Knowledge Reading Comprehension Battery', label: 'Knowledge Reading Comprehension Battery' },
];

const LANGUAGE_OPTIONS = ['English', 'Kannada', 'Hindi', 'Other'];

const PURPOSE_OPTIONS = [
  'Screening',
  'Diagnostic',
  'Progress Monitoring',
  'Reassessment',
];

/** Pre-fill values sourced from an existing Reading assessment */
export interface ReadingPrefill {
  grade?: string;
  language?: string;
  assessmentDate?: string;
  functionalGradeLevel?: string;
}

interface Props {
  data: any;
  onChange: (d: any) => void;
  disabled?: boolean;
  /** Data pre-filled from the linked Reading assessment (if available) */
  prefill?: ReadingPrefill;
}

export function ComprehensionSetupTab({ data, onChange, disabled, prefill }: Props) {
  const { t } = useTranslation('assessments');
  const up = (field: string, val: any) => onChange({ ...data, [field]: val });

  const hasPrefill = !!(prefill?.grade || prefill?.language || prefill?.functionalGradeLevel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment Setup</CardTitle>

        {hasPrefill && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 mt-2">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">Pre-filled from Reading Assessment</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {prefill?.grade && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    Grade: {prefill.grade}
                  </Badge>
                )}
                {prefill?.functionalGradeLevel && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    Functional Level: {prefill.functionalGradeLevel}
                  </Badge>
                )}
                {prefill?.language && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                    Language: {prefill.language}
                  </Badge>
                )}
              </div>
              <p className="text-blue-600 mt-1">You can override any value below.</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Assessment Type</Label>
            <Select value={data.assessmentType || ''} onValueChange={(v) => up('assessmentType', v)} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              Grade / Level
              {prefill?.grade && !data.grade && (
                <span className="ml-2 text-xs text-blue-600">(pre-filled: {prefill.grade})</span>
              )}
            </Label>
            <GradeSelect
              value={data.grade || prefill?.grade || ''}
              onValueChange={(v) => up('grade', v)}
              placeholder="Select grade..."
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>
              Language of Assessment
              {prefill?.language && !data.language && (
                <span className="ml-2 text-xs text-blue-600">(pre-filled: {prefill.language})</span>
              )}
            </Label>
            <Select
              value={data.language || prefill?.language || ''}
              onValueChange={(v) => up('language', v)}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select language..." /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Assessment Purpose</Label>
            <Select value={data.purpose || ''} onValueChange={(v) => up('purpose', v)} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select purpose..." /></SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('dateOfAssessment', { defaultValue: 'Assessment Date' })}</Label>
            <Input
              type="date"
              value={data.assessmentDate || prefill?.assessmentDate || ''}
              onChange={(e) => up('assessmentDate', e.target.value)}
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Passage Selection / Theme</Label>
            <Input
              value={data.passageSelection || ''}
              onChange={(e) => up('passageSelection', e.target.value)}
              placeholder="e.g., Jungle adventure, social story..."
              disabled={disabled}
              className="mt-1"
            />
          </div>

          {prefill?.functionalGradeLevel && (
            <div className="md:col-span-2">
              <Label>Functional Reading Level (from Reading Assessment)</Label>
              <Input
                value={prefill.functionalGradeLevel}
                disabled
                className="mt-1 bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the functional reading level established in the linked Reading assessment.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
