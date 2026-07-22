'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

export const QUALITY_OPTIONS = [
  { value: 'Excellent', label: 'Excellent', score: 90 },
  { value: 'Good', label: 'Good', score: 75 },
  { value: 'Developing', label: 'Developing', score: 60 },
  { value: 'Needs Support', label: 'Needs Support', score: 40 },
];

export const FLUENCY_OPTIONS = [
  { value: 'Fast', label: 'Fast (above grade)', score: 90 },
  { value: 'On-level', label: 'On-level', score: 75 },
  { value: 'Slow', label: 'Slow', score: 60 },
  { value: 'Very slow', label: 'Very slow', score: 40 },
];

export const ERROR_OPTIONS = [
  { value: 'Minimal', label: 'Minimal', penalty: 0 },
  { value: 'Moderate', label: 'Moderate', penalty: -10 },
  { value: 'Frequent', label: 'Frequent', penalty: -20 },
];

export const DIFFICULTY_OPTIONS = [
  { value: 'Easy', label: 'Easy', adjustment: -5 },
  { value: 'Grade Level', label: 'Grade Level', adjustment: 0 },
  { value: 'Hard', label: 'Hard', adjustment: 5 },
];

export type RubricType = 'quality' | 'fluency' | 'errors' | 'difficulty';

interface Props {
  label: string;
  type: RubricType;
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const OPTIONS_MAP: Record<RubricType, { value: string; label: string }[]> = {
  quality: QUALITY_OPTIONS,
  fluency: FLUENCY_OPTIONS,
  errors: ERROR_OPTIONS,
  difficulty: DIFFICULTY_OPTIONS,
};

export function RubricSelect({ label, type, value, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');
  const options = OPTIONS_MAP[type];

  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={t('select', { defaultValue: 'Select...' })} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
