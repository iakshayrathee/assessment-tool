'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const ERROR_TYPES = [
  { key: 'substitution', label: 'Substitution', desc: 'Replacing one word with another' },
  { key: 'omission', label: 'Omission', desc: 'Skipping words or parts of words' },
  { key: 'insertion', label: 'Insertion', desc: 'Adding extra words' },
  { key: 'reversal', label: 'Reversal (b/d, p/q)', desc: 'Reversing letters or words' },
  { key: 'guessing', label: 'Guessing', desc: 'Guessing words from context or pictures' },
  { key: 'slowDecoding', label: 'Slow Decoding', desc: 'Very slow letter-by-letter reading' },
  { key: 'repetition', label: 'Repetition', desc: 'Repeating words or phrases' },
  { key: 'skippingLines', label: 'Skipping Lines', desc: 'Losing track and skipping lines' },
];

export function ErrorAnalysisSection({ data, onChange, disabled }: Props) {
  const errors = data.errorAnalysis || {};

  const updateError = (key: string, field: string, value: any) => {
    const updated = { ...errors };
    updated[key] = { ...(updated[key] || {}), [field]: value };

    // Auto-compute dominant error type
    let maxFreq = 0;
    let dominant = '';
    for (const et of ERROR_TYPES) {
      const entry = updated[et.key];
      if (entry?.present && entry?.frequency > maxFreq) {
        maxFreq = entry.frequency;
        dominant = et.label;
      }
    }
    updated.dominantErrorType = dominant || null;

    // Compute average frequency
    const presentErrors = ERROR_TYPES.filter(et => updated[et.key]?.present && updated[et.key]?.frequency);
    if (presentErrors.length > 0) {
      const totalFreq = presentErrors.reduce((sum, et) => sum + (updated[et.key]?.frequency || 0), 0);
      updated.errorFrequencyPercent = Math.round(totalFreq / presentErrors.length);
    }

    onChange({ errorAnalysis: updated });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Multi-select + Frequency Count</CardTitle>
        <p className="text-sm text-muted-foreground">
          Check each error type observed and estimate its frequency (% of reading attempts).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {ERROR_TYPES.map(({ key, label, desc }) => {
          const entry = errors[key] || {};
          return (
            <div key={key} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.present || false}
                  onChange={(e) => updateError(key, 'present', e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 rounded"
                />
                <div>
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </label>
              {entry.present && (
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Label className="text-xs whitespace-nowrap">Freq %</Label>
                  <Input
                    type="number" min={0} max={100}
                    value={entry.frequency ?? ''}
                    onChange={(e) => updateError(key, 'frequency', e.target.value ? Number(e.target.value) : undefined)}
                    disabled={disabled}
                    className="h-8 w-20 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Auto-computed summary */}
        {errors.dominantErrorType && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Dominant Error Type:</span>{' '}
              <span className="text-primary font-semibold">{errors.dominantErrorType}</span>
            </p>
            {errors.errorFrequencyPercent !== undefined && (
              <p className="text-sm mt-1">
                <span className="font-medium">Average Error Frequency:</span> {errors.errorFrequencyPercent}%
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
