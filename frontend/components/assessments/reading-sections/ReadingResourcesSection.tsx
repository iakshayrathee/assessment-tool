'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const DIFFICULTY_OPTIONS = ['Below Grade', 'At Grade', 'Above Grade'];
const MATERIAL_TYPES = ['Phonics', 'Story', 'Academic'];

export function ReadingResourcesSection({ data, onChange, disabled }: Props) {
  const resources = data.readingResources || {};

  const updateResources = (path: string, value: any) => {
    const parts = path.split('.');
    const updated = { ...resources };
    let current: any = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = current[parts[i]] ? { ...current[parts[i]] } : {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    onChange({ readingResources: updated });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Benchmark Reading Across Difficulty Levels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* A. School Text */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">A. School Text</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Grade Level Text Used</Label>
              <Input
                value={resources.schoolText?.gradeLevelUsed || ''}
                onChange={(e) => updateResources('schoolText.gradeLevelUsed', e.target.value)}
                placeholder="e.g., Grade 3"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select
                value={resources.schoolText?.difficulty || ''}
                onValueChange={(v) => updateResources('schoolText.difficulty', v)}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* B. Known Text */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">B. Known Text</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Passage ID</Label>
              <Input
                value={resources.knownText?.passageId || ''}
                onChange={(e) => updateResources('knownText.passageId', e.target.value)}
                placeholder="Passage identifier"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Accuracy %</Label>
              <Input
                type="number"
                min={0} max={100}
                value={resources.knownText?.accuracyPercent ?? ''}
                onChange={(e) => updateResources('knownText.accuracyPercent', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0-100"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Errors Count</Label>
              <Input
                type="number"
                min={0}
                value={resources.knownText?.errorsCount ?? ''}
                onChange={(e) => updateResources('knownText.errorsCount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* C. Unknown Text */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">C. Unknown Text</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Passage ID</Label>
              <Input
                value={resources.unknownText?.passageId || ''}
                onChange={(e) => updateResources('unknownText.passageId', e.target.value)}
                placeholder="Passage identifier"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Accuracy %</Label>
              <Input
                type="number"
                min={0} max={100}
                value={resources.unknownText?.accuracyPercent ?? ''}
                onChange={(e) => updateResources('unknownText.accuracyPercent', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0-100"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Errors Count</Label>
              <Input
                type="number"
                min={0}
                value={resources.unknownText?.errorsCount ?? ''}
                onChange={(e) => updateResources('unknownText.errorsCount', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* D. External Resources */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">D. External Resources</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Uses Storybooks</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={resources.externalResources?.usesStorybooks === true}
                    onChange={() => updateResources('externalResources.usesStorybooks', true)} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={resources.externalResources?.usesStorybooks === false}
                    onChange={() => updateResources('externalResources.usesStorybooks', false)} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Uses Apps/Websites</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={resources.externalResources?.usesApps === true}
                    onChange={() => updateResources('externalResources.usesApps', true)} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={resources.externalResources?.usesApps === false}
                    onChange={() => updateResources('externalResources.usesApps', false)} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
            <div>
              <Label>Type of Material</Label>
              <Select
                value={resources.externalResources?.materialType || ''}
                onValueChange={(v) => updateResources('externalResources.materialType', v)}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
