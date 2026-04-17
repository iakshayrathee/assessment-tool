'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
  studentGrade?: string;
}

const MEDIUM_OPTIONS = ['English', 'Hindi', 'Regional'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Other'];

export function BasicInfoSection({ data, onChange, disabled, studentGrade }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Context & Demographic Normalization</CardTitle>
        <p className="text-sm text-muted-foreground">
          Student name, age, grade, school, and center are auto-linked from the student profile.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assessmentDate">Date of Assessment</Label>
            <Input
              id="assessmentDate"
              type="date"
              value={data.assessmentDate || ''}
              onChange={(e) => onChange({ assessmentDate: e.target.value })}
              disabled={disabled}
              className="mt-1"
            />
          </div>

          {studentGrade && (
            <div>
              <Label>Student Grade (from profile)</Label>
              <Input value={studentGrade} disabled className="mt-1 bg-muted" />
            </div>
          )}

          <div>
            <Label htmlFor="mediumOfInstruction">Medium of Instruction</Label>
            <Select
              value={data.mediumOfInstruction || ''}
              onValueChange={(v) => onChange({ mediumOfInstruction: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select medium" /></SelectTrigger>
              <SelectContent>
                {MEDIUM_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="firstLanguage">First Language</Label>
            <Select
              value={data.firstLanguage || ''}
              onValueChange={(v) => onChange({ firstLanguage: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select language" /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="parentConcern">Parent Concern</Label>
          <Textarea
            id="parentConcern"
            value={data.parentConcern || ''}
            onChange={(e) => onChange({ parentConcern: e.target.value })}
            placeholder="Describe any concerns raised by the parent..."
            disabled={disabled}
            className="mt-1"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
