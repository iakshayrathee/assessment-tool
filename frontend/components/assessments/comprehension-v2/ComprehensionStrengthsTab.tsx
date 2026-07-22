'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxGroup } from '@/components/assessments/shared/CheckboxGroup';

const STRENGTH_OPTIONS = [
  { value: 'Good recall', label: 'Good recall' },
  { value: 'Strong vocabulary', label: 'Strong vocabulary' },
  { value: 'Good sequencing', label: 'Good sequencing' },
  { value: 'Understands main idea', label: 'Understands main idea' },
  { value: 'Good inferencing', label: 'Good inferencing' },
  { value: 'Strong reasoning', label: 'Strong reasoning' },
  { value: 'Good listening comprehension', label: 'Good listening comprehension' },
];

interface Props {
  data: { selected?: string[]; notes?: string };
  onChange: (d: any) => void;
  disabled?: boolean;
}

export function ComprehensionStrengthsTab({ data, onChange, disabled }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comprehension Strengths</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CheckboxGroup
          label="Select observed strengths:"
          options={STRENGTH_OPTIONS}
          value={data.selected || []}
          onChange={(v) => onChange({ ...data, selected: v })}
          disabled={disabled}
          columns={2}
        />
        <div>
          <Label>Educator Notes</Label>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            placeholder="Additional notes about comprehension strengths..."
            disabled={disabled}
            rows={3}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
