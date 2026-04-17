'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const STRENGTH_OPTIONS = [
  { key: 'strongPhonics', label: 'Strong Phonics' },
  { key: 'goodMemory', label: 'Good Memory' },
  { key: 'goodComprehension', label: 'Good Comprehension' },
  { key: 'expressiveReading', label: 'Expressive Reading' },
  { key: 'visualLearner', label: 'Visual Learner' },
  { key: 'auditoryLearner', label: 'Auditory Learner' },
  { key: 'goodVocabulary', label: 'Good Vocabulary' },
  { key: 'strongOralLanguage', label: 'Strong Oral Language' },
  { key: 'motivatedReader', label: 'Motivated Reader' },
  { key: 'goodAttentionSpan', label: 'Good Attention Span' },
];

export function StrengthsSection({ data, onChange, disabled }: Props) {
  const strengths = data.strengths || { selected: [], educatorNotes: '' };

  const toggleStrength = (key: string) => {
    const selected = strengths.selected || [];
    const updated = selected.includes(key)
      ? selected.filter((s: string) => s !== key)
      : [...selected, key];
    onChange({ strengths: { ...strengths, selected: updated } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Multi-select + Notes</CardTitle>
        <p className="text-sm text-muted-foreground">Identify the student&apos;s reading strengths.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STRENGTH_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={(strengths.selected || []).includes(key)}
                onChange={() => toggleStrength(key)}
                disabled={disabled}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <div>
          <Label>Educator Notes</Label>
          <Textarea
            value={strengths.educatorNotes || ''}
            onChange={(e) => onChange({ strengths: { ...strengths, educatorNotes: e.target.value } })}
            placeholder="Additional observations about the student's strengths..."
            disabled={disabled}
            className="mt-1"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
