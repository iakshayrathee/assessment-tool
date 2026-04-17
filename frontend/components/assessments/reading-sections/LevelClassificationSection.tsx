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

function classifyLevel(accuracy: number | undefined | null): string | null {
  if (accuracy === undefined || accuracy === null) return null;
  if (accuracy >= 90) return 'Independent';
  if (accuracy >= 75) return 'Instructional';
  return 'Frustration';
}

function getLevelColor(level: string | null): string {
  if (!level) return '';
  if (level === 'Independent') return 'text-green-700 bg-green-50 border-green-200';
  if (level === 'Instructional') return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function LevelClassificationSection({ data, onChange, disabled }: Props) {
  const knownLevel = classifyLevel(data.knownTextAccuracy);
  const unknownLevel = classifyLevel(data.unknownTextAccuracy);
  const finalLevel = unknownLevel || knownLevel;

  // Also sync from reading resources if available
  const resourceKnownAccuracy = data.readingResources?.knownText?.accuracyPercent;
  const resourceUnknownAccuracy = data.readingResources?.unknownText?.accuracyPercent;

  const effectiveKnownAccuracy = data.knownTextAccuracy ?? resourceKnownAccuracy;
  const effectiveUnknownAccuracy = data.unknownTextAccuracy ?? resourceUnknownAccuracy;

  const effectiveKnownLevel = classifyLevel(effectiveKnownAccuracy);
  const effectiveUnknownLevel = classifyLevel(effectiveUnknownAccuracy);
  const effectiveFinalLevel = effectiveUnknownLevel || effectiveKnownLevel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Auto-Calculated Level Classification</CardTitle>
        <p className="text-sm text-muted-foreground">
          Levels are automatically classified based on accuracy percentages.
          Independent ≥90% | Instructional 75–89% | Frustration &lt;75%
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Known Text */}
          <div className="space-y-3">
            <div>
              <Label>Known Text Accuracy %</Label>
              <Input
                type="number" min={0} max={100} step={0.1}
                value={data.knownTextAccuracy ?? ''}
                onChange={(e) => onChange({ knownTextAccuracy: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter accuracy (0-100)"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            {effectiveKnownLevel && (
              <div className={`p-3 rounded-lg border ${getLevelColor(effectiveKnownLevel)}`}>
                <p className="text-sm font-medium">Known Text Level: {effectiveKnownLevel}</p>
                <p className="text-xs mt-0.5">Based on {effectiveKnownAccuracy}% accuracy</p>
              </div>
            )}
          </div>

          {/* Unknown Text */}
          <div className="space-y-3">
            <div>
              <Label>Unknown Text Accuracy %</Label>
              <Input
                type="number" min={0} max={100} step={0.1}
                value={data.unknownTextAccuracy ?? ''}
                onChange={(e) => onChange({ unknownTextAccuracy: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter accuracy (0-100)"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            {effectiveUnknownLevel && (
              <div className={`p-3 rounded-lg border ${getLevelColor(effectiveUnknownLevel)}`}>
                <p className="text-sm font-medium">Unknown Text Level: {effectiveUnknownLevel}</p>
                <p className="text-xs mt-0.5">Based on {effectiveUnknownAccuracy}% accuracy</p>
              </div>
            )}
          </div>
        </div>

        {/* Final Reading Level */}
        {effectiveFinalLevel && (
          <div className={`p-4 rounded-lg border-2 ${getLevelColor(effectiveFinalLevel)} text-center`}>
            <p className="text-lg font-bold">Final Reading Level: {effectiveFinalLevel}</p>
            <p className="text-xs mt-1">
              {effectiveFinalLevel === 'Independent' && 'Student can read independently with minimal support needed.'}
              {effectiveFinalLevel === 'Instructional' && 'Student needs guided instruction and support while reading.'}
              {effectiveFinalLevel === 'Frustration' && 'Material is too difficult — student needs easier texts and intensive support.'}
            </p>
          </div>
        )}

        {/* Classification Guide */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="font-medium text-green-700">Independent</p>
            <p className="text-green-600">≥90% accuracy</p>
          </div>
          <div className="p-2 bg-orange-50 rounded text-center">
            <p className="font-medium text-orange-700">Instructional</p>
            <p className="text-orange-600">75–89% accuracy</p>
          </div>
          <div className="p-2 bg-red-50 rounded text-center">
            <p className="font-medium text-red-700">Frustration</p>
            <p className="text-red-600">&lt;75% accuracy</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
