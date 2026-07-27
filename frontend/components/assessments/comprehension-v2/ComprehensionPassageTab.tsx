'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { GradeSelect } from '@/components/ui/GradeSelect';

interface PassageSection {
  gradeLevel?: string;
  passageUsed?: string;
  readingMode?: string;
  timeTaken?: string;
  observation?: string;
  source?: string;
  familiarity?: string;
  difficultyLevel?: string;
}

interface Props {
  data: { schoolText?: PassageSection; knownText?: PassageSection; unknownText?: PassageSection };
  onChange: (d: any) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  disabled?: boolean;
}

const READING_MODES = ['Silent', 'Oral', 'Read Aloud by Educator'];
const FAMILIARITY_OPTIONS = ['Highly familiar', 'Somewhat familiar', 'Memorized'];
const SOURCE_OPTIONS = ['Textbook (new lesson)', 'Storybook (unseen)', 'Teacher-created', 'External material'];

function PassageCard({ title, prefix, data, onChange, disabled }: {
  title: string;
  prefix: 'school' | 'known' | 'unknown';
  data?: PassageSection;
  onChange: (d: PassageSection) => void;
  disabled?: boolean;
}) {
  const up = (f: keyof PassageSection, v: string) => onChange({ ...data, [f]: v });
  const d = data || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prefix === 'school' && (
            <>
              <div>
                <Label>Grade Level</Label>
                <GradeSelect
                  value={d.gradeLevel || ''}
                  onValueChange={(v) => up('gradeLevel', v)}
                  placeholder="Select grade..."
                  disabled={disabled}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Passage Used</Label>
                <Input value={d.passageUsed || ''} onChange={(e) => up('passageUsed', e.target.value)} disabled={disabled} className="mt-1" />
              </div>
            </>
          )}
          {prefix === 'known' && (
            <>
              <div>
                <Label>Source</Label>
                <Select value={d.source || ''} onValueChange={(v) => up('source', v)} disabled={disabled}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select source..." /></SelectTrigger>
                  <SelectContent>{SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Familiarity</Label>
                <Select value={d.familiarity || ''} onValueChange={(v) => up('familiarity', v)} disabled={disabled}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{FAMILIARITY_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          )}
          {prefix === 'unknown' && (
            <>
              <div>
                <Label>Source</Label>
                <Select value={d.source || ''} onValueChange={(v) => up('source', v)} disabled={disabled}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select source..." /></SelectTrigger>
                  <SelectContent>{SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty Level</Label>
                <Select value={d.difficultyLevel || ''} onValueChange={(v) => up('difficultyLevel', v)} disabled={disabled}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {['Easy', 'Grade Level', 'Hard'].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <Label>Reading Mode</Label>
            <Select value={d.readingMode || ''} onValueChange={(v) => up('readingMode', v)} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select mode..." /></SelectTrigger>
              <SelectContent>{READING_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time Taken</Label>
            <Input value={d.timeTaken || ''} onChange={(e) => up('timeTaken', e.target.value)} placeholder="e.g., 5 minutes" disabled={disabled} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Observation</Label>
          <Textarea value={d.observation || ''} onChange={(e) => up('observation', e.target.value)} disabled={disabled} rows={2} className="mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ComprehensionPassageTab({ data, onChange, onSave, isSaving, disabled }: Props) {
  return (
    <div className="space-y-4">
      <PassageCard
        title="A. School Text"
        prefix="school"
        data={data.schoolText}
        onChange={(d) => onChange({ ...data, schoolText: d })}
        disabled={disabled}
      />
      <PassageCard
        title="B. Known Text"
        prefix="known"
        data={data.knownText}
        onChange={(d) => onChange({ ...data, knownText: d })}
        disabled={disabled}
      />
      <PassageCard
        title="C. Unknown Text"
        prefix="unknown"
        data={data.unknownText}
        onChange={(d) => onChange({ ...data, unknownText: d })}
        disabled={disabled}
      />

      {/* Save button for passage tab */}
      {!disabled && onSave && (
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onSave} disabled={isSaving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save Passage'}
          </Button>
        </div>
      )}
    </div>
  );
}
