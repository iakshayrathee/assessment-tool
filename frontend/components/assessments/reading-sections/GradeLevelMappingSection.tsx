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

function computeGap(current: string | undefined, reading: string | undefined): string {
  if (!current || !reading) return '';
  const gradeMap: Record<string, number> = {
    'Pre-K': -1, 'KG': 0, 'LKG': 0, 'UKG': 0.5,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
  };

  const currentNum = gradeMap[current] ?? parseFloat(current);
  const readingNum = gradeMap[reading] ?? parseFloat(reading);

  if (isNaN(currentNum) || isNaN(readingNum)) return '';
  const diff = readingNum - currentNum;
  if (diff === 0) return 'At grade level';
  if (diff > 0) return `+${diff} year${Math.abs(diff) !== 1 ? 's' : ''} above`;
  return `${diff} year${Math.abs(diff) !== 1 ? 's' : ''} below`;
}

export function GradeLevelMappingSection({ data, onChange, disabled }: Props) {
  const gap = computeGap(data.currentGrade, data.readingGradeLevel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grade Level Mapping</CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare the student&apos;s current grade with their actual reading grade level. The gap is auto-calculated.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Current Grade</Label>
            <Input
              value={data.currentGrade || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange({
                  currentGrade: val,
                  gradeGap: computeGap(val, data.readingGradeLevel),
                });
              }}
              placeholder="e.g., 4"
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Reading Grade Level (AI Predicted / Assessed)</Label>
            <Input
              value={data.readingGradeLevel || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange({
                  readingGradeLevel: val,
                  gradeGap: computeGap(data.currentGrade, val),
                });
              }}
              placeholder="e.g., 2"
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Gap (Auto-calculated)</Label>
            <Input
              value={gap || data.gradeGap || ''}
              disabled
              className="mt-1 bg-muted font-medium"
            />
          </div>
        </div>

        {/* Visual Gap Indicator */}
        {gap && (
          <div className={`p-4 rounded-lg border-2 text-center ${
            gap === 'At grade level'
              ? 'border-green-300 bg-green-50 text-green-700'
              : gap.includes('above')
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}>
            <p className="text-lg font-bold">{gap}</p>
            {gap.includes('below') && (
              <p className="text-xs mt-1">
                Student is reading below expected grade level — intervention recommended.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
