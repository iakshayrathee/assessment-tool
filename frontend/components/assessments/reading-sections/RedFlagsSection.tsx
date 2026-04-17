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

const RED_FLAG_OPTIONS = [
  { key: 'attentionIssues', label: 'Attention Issues', desc: 'Difficulty sustaining focus during reading tasks' },
  { key: 'languageProcessingIssues', label: 'Language Processing Issues', desc: 'Trouble understanding or processing spoken/written language' },
  { key: 'avoidanceBehavior', label: 'Avoidance Behavior', desc: 'Consistently avoids reading tasks or activities' },
];

export function RedFlagsSection({ data, onChange, disabled }: Props) {
  const flags = data.redFlags || { attentionIssues: false, languageProcessingIssues: false, avoidanceBehavior: false, custom: [] };

  const toggleFlag = (key: string) => {
    onChange({ redFlags: { ...flags, [key]: !flags[key] } });
  };

  const addCustomFlag = (value: string) => {
    if (!value.trim()) return;
    const custom = [...(flags.custom || []), value.trim()];
    onChange({ redFlags: { ...flags, custom } });
  };

  const removeCustomFlag = (index: number) => {
    const custom = [...(flags.custom || [])];
    custom.splice(index, 1);
    onChange({ redFlags: { ...flags, custom } });
  };

  const activeCount = RED_FLAG_OPTIONS.filter(o => flags[o.key]).length + (flags.custom?.length || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Auto + Manual Tagging</CardTitle>
        <p className="text-sm text-muted-foreground">
          Flag concerns that may need further investigation. These appear in the report.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {RED_FLAG_OPTIONS.map(({ key, label, desc }) => (
          <label key={key}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              flags[key] ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'hover:bg-muted/30'
            }`}
          >
            <input
              type="checkbox"
              checked={flags[key] || false}
              onChange={() => toggleFlag(key)}
              disabled={disabled}
              className="h-4 w-4 mt-0.5 rounded"
            />
            <div>
              <span className="text-sm font-medium">{label}</span>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </label>
        ))}

        {/* Custom flags */}
        <div>
          <Label>Additional Red Flags</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Type a custom red flag and press Enter..."
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomFlag((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
          {flags.custom?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {flags.custom.map((flag: string, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  {flag}
                  {!disabled && (
                    <button onClick={() => removeCustomFlag(idx)} className="hover:text-red-600">×</button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {activeCount > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              ⚠ {activeCount} red flag{activeCount > 1 ? 's' : ''} identified
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
