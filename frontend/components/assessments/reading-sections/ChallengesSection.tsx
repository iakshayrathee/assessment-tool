'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const CHALLENGE_OPTIONS = [
  'Decoding',
  'Fluency',
  'Comprehension',
  'Phonological Awareness',
  'Sight Word Recognition',
  'Visual Tracking',
  'Attention/Focus',
  'Motivation',
  'Language Processing',
  'Working Memory',
];

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

export function ChallengesSection({ data, onChange, disabled }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Primary & Secondary Challenges</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Primary Challenge</Label>
            <Select
              value={data.primaryChallenge || ''}
              onValueChange={(v) => onChange({ primaryChallenge: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select primary challenge" /></SelectTrigger>
              <SelectContent>
                {CHALLENGE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Secondary Challenge</Label>
            <Select
              value={data.secondaryChallenge || ''}
              onValueChange={(v) => onChange({ secondaryChallenge: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select secondary challenge" /></SelectTrigger>
              <SelectContent>
                {CHALLENGE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-w-xs">
          <Label>Severity</Label>
          <Select
            value={data.challengeSeverity || ''}
            onValueChange={(v) => onChange({ challengeSeverity: v })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select severity" /></SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map(o => (
                <SelectItem key={o} value={o}>
                  <span className={o === 'Severe' ? 'text-red-600 font-medium' : o === 'Moderate' ? 'text-orange-600' : ''}>
                    {o}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        {data.primaryChallenge && (
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="font-medium">Summary:</span>{' '}
            {data.primaryChallenge}
            {data.secondaryChallenge ? ` + ${data.secondaryChallenge}` : ''}
            {data.challengeSeverity ? ` (${data.challengeSeverity})` : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
