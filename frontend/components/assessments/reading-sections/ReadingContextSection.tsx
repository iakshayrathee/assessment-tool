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

const EXPOSURE_OPTIONS = ['Daily', 'Weekly', 'Rare', 'None'];
const SCHOOLING_OPTIONS = ['CBSE', 'ICSE', 'State', 'IB', 'Other'];

export function ReadingContextSection({ data, onChange, disabled }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Avoid Misdiagnosis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Understanding the child&apos;s background helps avoid false positives in assessment.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Exposure to Reading at Home</Label>
            <Select
              value={data.readingExposureAtHome || ''}
              onValueChange={(v) => onChange({ readingExposureAtHome: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                {EXPOSURE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type of Schooling</Label>
            <Select
              value={data.typeOfSchooling || ''}
              onValueChange={(v) => onChange({ typeOfSchooling: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {SCHOOLING_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Reading Support at Home</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.readingSupportAtHome === true}
                  onChange={() => onChange({ readingSupportAtHome: true })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.readingSupportAtHome === false}
                  onChange={() => onChange({ readingSupportAtHome: false })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">No</span>
              </label>
            </div>
            {data.readingSupportAtHome && (
              <Input
                value={data.readingSupportDetails || ''}
                onChange={(e) => onChange({ readingSupportDetails: e.target.value })}
                placeholder="Details about support..."
                disabled={disabled}
                className="mt-1"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Language Mismatch (Home vs School)</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.languageMismatch === true}
                  onChange={() => onChange({ languageMismatch: true })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.languageMismatch === false}
                  onChange={() => onChange({ languageMismatch: false })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Previous Intervention</Label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={data.previousIntervention === true}
                onChange={() => onChange({ previousIntervention: true })} disabled={disabled} className="h-4 w-4" />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={data.previousIntervention === false}
                onChange={() => onChange({ previousIntervention: false })} disabled={disabled} className="h-4 w-4" />
              <span className="text-sm">No</span>
            </label>
          </div>
          {data.previousIntervention && (
            <Input
              value={data.previousInterventionType || ''}
              onChange={(e) => onChange({ previousInterventionType: e.target.value })}
              placeholder="Type of intervention (e.g., speech therapy, remedial reading)..."
              disabled={disabled}
              className="mt-1"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
