'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RATING_OPTIONS = ['Excellent', 'Good', 'Average', 'Below Average', 'Poor'];
const YES_NO = ['Yes', 'No', 'Sometimes'];

interface Props {
  data: any;
  onChange: (d: any) => void;
  disabled?: boolean;
}

const FIELDS = [
  { key: 'attentionWhileReading', label: 'Attention while reading', options: RATING_OPTIONS },
  { key: 'concentration', label: 'Concentration', options: RATING_OPTIONS },
  { key: 'respondsIndependently', label: 'Responds independently', options: YES_NO },
  { key: 'requiresPrompts', label: 'Requires prompts', options: YES_NO },
  { key: 'usesTextAsEvidence', label: 'Uses text as evidence', options: YES_NO },
  { key: 'confidenceWhileAnswering', label: 'Confidence while answering', options: RATING_OPTIONS },
  { key: 'readingStamina', label: 'Reading stamina', options: RATING_OPTIONS },
];

export function ComprehensionBehaviourTab({ data, onChange, disabled }: Props) {
  const up = (f: string, v: string) => onChange({ ...data, [f]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Behaviour During Comprehension</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, options }) => (
            <div key={key}>
              <Label>{label}</Label>
              <Select value={data[key] || ''} onValueChange={(v) => up(key, v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div>
          <Label>Observation</Label>
          <Textarea
            value={data.observation || ''}
            onChange={(e) => up('observation', e.target.value)}
            placeholder="Additional behavioural observations during comprehension activities..."
            disabled={disabled}
            rows={3}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
