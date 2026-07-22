'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

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

const GRADE_OPTIONS = [
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8',
];

interface Props {
  data: any;
  onChange: (d: any) => void;
  disabled?: boolean;
}

export function ComprehensionSetupTab({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');
  const up = (field: string, val: any) => onChange({ ...data, [field]: val });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment Setup</CardTitle>
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
            <Label>Grade / Level</Label>
            <Select value={data.grade || ''} onValueChange={(v) => up('grade', v)} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade..." /></SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Language of Assessment</Label>
            <Select value={data.language || ''} onValueChange={(v) => up('language', v)} disabled={disabled}>
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
              value={data.assessmentDate || ''}
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
        </div>
      </CardContent>
    </Card>
  );
}
