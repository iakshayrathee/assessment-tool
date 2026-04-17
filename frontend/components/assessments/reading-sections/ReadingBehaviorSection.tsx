'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const EMOTIONAL_OPTIONS = ['Calm', 'Avoidant', 'Anxious'];
const MOTIVATION_OPTIONS = ['Intrinsic', 'Prompted', 'Resistant'];
const SELF_CORRECTION_OPTIONS = ['Independent', 'Prompted', 'None'];
const PROMPT_DEPENDENCY_OPTIONS = ['Independent', 'Needs cues', 'Fully assisted'];

function RatingSlider({ label, value, onChange, disabled }: {
  label: string; value: number | undefined; onChange: (v: number) => void; disabled?: boolean;
}) {
  const ratingLabels = ['Very Low', 'Low', 'Average', 'Good', 'Excellent'];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs text-muted-foreground font-medium">
          {value ? `${value}/5 — ${ratingLabels[value - 1]}` : 'Not rated'}
        </span>
      </div>
      <Slider
        min={1} max={5} step={1}
        value={value ? [value] : [3]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  );
}

export function ReadingBehaviorSection({ data, onChange, disabled }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rating Scale (1–5) + Observations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Scales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RatingSlider label="Interest in Reading" value={data.interestInReading}
            onChange={(v) => onChange({ interestInReading: v })} disabled={disabled} />
          <RatingSlider label="Reading Stamina" value={data.readingStamina}
            onChange={(v) => onChange({ readingStamina: v })} disabled={disabled} />
          <RatingSlider label="Frustration Tolerance" value={data.frustrationTolerance}
            onChange={(v) => onChange({ frustrationTolerance: v })} disabled={disabled} />
          <RatingSlider label="Confidence Level" value={data.confidenceLevel}
            onChange={(v) => onChange({ confidenceLevel: v })} disabled={disabled} />
        </div>

        {/* Attention Span */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Attention Span (minutes)</Label>
            <Input
              type="number" min={0} max={60}
              value={data.attentionSpanMinutes ?? ''}
              onChange={(e) => onChange({ attentionSpanMinutes: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g., 10"
              disabled={disabled}
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label>Task Avoidance</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.taskAvoidance === true}
                  onChange={() => onChange({ taskAvoidance: true })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.taskAvoidance === false}
                  onChange={() => onChange({ taskAvoidance: false })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">No</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Emotional Response</Label>
            <Select value={data.emotionalResponse || ''} onValueChange={(v) => onChange({ emotionalResponse: v })} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {EMOTIONAL_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivation</Label>
            <Select value={data.motivation || ''} onValueChange={(v) => onChange({ motivation: v })} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {MOTIVATION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Self-Correction Ability</Label>
            <Select value={data.selfCorrectionAbility || ''} onValueChange={(v) => onChange({ selfCorrectionAbility: v })} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SELF_CORRECTION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Prompt Dependency</Label>
          <Select value={data.promptDependency || ''} onValueChange={(v) => onChange({ promptDependency: v })} disabled={disabled}>
            <SelectTrigger className="mt-1 max-w-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {PROMPT_DEPENDENCY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Observations</Label>
          <Textarea
            value={data.behaviorObservations || ''}
            onChange={(e) => onChange({ behaviorObservations: e.target.value })}
            placeholder="Additional behavior observations..."
            disabled={disabled}
            className="mt-1"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
