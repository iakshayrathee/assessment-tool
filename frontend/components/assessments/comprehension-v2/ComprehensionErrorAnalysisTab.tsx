'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  data: any;
  onChange: (d: any) => void;
  disabled?: boolean;
}

const ERROR_TYPES = [
  { key: 'literalErrors', label: 'Literal errors' },
  { key: 'inferentialErrors', label: 'Inferential errors' },
  { key: 'vocabularyErrors', label: 'Vocabulary errors' },
  { key: 'sequencingErrors', label: 'Sequencing errors' },
  { key: 'recallErrors', label: 'Recall errors' },
  { key: 'misinterpretation', label: 'Misinterpretation' },
  { key: 'guessingResponses', label: 'Guessing responses' },
  { key: 'needsRepeatedQuestioning', label: 'Needs repeated questioning' },
];

export function ComprehensionErrorAnalysisTab({ data, onChange, disabled }: Props) {
  const toggleError = (key: string) => onChange({ ...data, [key]: !data[key] });
  const setCount = (key: string, val: string) => onChange({ ...data, [`${key}Count`]: val ? Number(val) : undefined });
  const up = (f: string, v: string) => onChange({ ...data, [f]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comprehension Error Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Check each error type observed and optionally record the count.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {ERROR_TYPES.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
            <label className="flex items-center gap-3 flex-1 cursor-pointer">
              <Checkbox
                checked={!!data[key]}
                onCheckedChange={() => toggleError(key)}
                disabled={disabled}
              />
              <span className="text-sm">{label}</span>
            </label>
            {data[key] && (
              <div className="flex items-center gap-2 min-w-[120px]">
                <Label className="text-xs whitespace-nowrap">Count</Label>
                <Input
                  type="number"
                  min={0}
                  value={data[`${key}Count`] ?? ''}
                  onChange={(e) => setCount(key, e.target.value)}
                  disabled={disabled}
                  className="h-8 w-20 text-sm"
                />
              </div>
            )}
          </div>
        ))}

        <div className="pt-2">
          <Label>Observation</Label>
          <Textarea
            value={data.observation || ''}
            onChange={(e) => up('observation', e.target.value)}
            placeholder="Additional error analysis observations..."
            disabled={disabled}
            rows={3}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
