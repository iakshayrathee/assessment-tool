'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxGroup } from '@/components/assessments/shared/CheckboxGroup';

const CHALLENGE_OPTIONS = [
  { value: 'Difficulty answering WH questions', label: 'Difficulty answering WH questions' },
  { value: 'Weak inferencing', label: 'Weak inferencing' },
  { value: 'Poor vocabulary understanding', label: 'Poor vocabulary understanding' },
  { value: 'Difficulty identifying main idea', label: 'Difficulty identifying main idea' },
  { value: 'Difficulty summarizing', label: 'Difficulty summarizing' },
  { value: 'Needs prompting', label: 'Needs prompting' },
  { value: 'Difficulty making predictions', label: 'Difficulty making predictions' },
];

interface Props {
  data: { selected?: string[]; notes?: string };
  onChange: (d: any) => void;
  disabled?: boolean;
}

export function ComprehensionChallengesTab({ data, onChange, disabled }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comprehension Challenges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CheckboxGroup
          label="Select observed challenges:"
          options={CHALLENGE_OPTIONS}
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
            placeholder="Additional notes about comprehension challenges..."
            disabled={disabled}
            rows={3}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
