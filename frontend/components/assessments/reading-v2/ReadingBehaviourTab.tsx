'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RatingSlider } from '@/components/assessments/shared/RatingSlider';
import { CheckboxGroup } from '@/components/assessments/shared/CheckboxGroup';
import { useTranslation } from 'react-i18next';

interface BehaviourData {
  // Scalars mirrored
  interestInReading?: number;
  motivation?: string;
  confidenceLevel?: number;
  readingStamina?: number;
  frustrationTolerance?: number;
  taskAvoidance?: boolean;
  attentionSpanMinutes?: number;
  promptDependency?: string;
  emotionalResponse?: string;
  behaviorObservations?: string;
  // JSON nested
  behaviours?: string[];
  distractibility?: string;
  impulsivity?: string;
  persistence?: string;
  overallRating?: string;
}

interface Props {
  data: BehaviourData;
  onChange: (d: BehaviourData) => void;
  disabled?: boolean;
}

const READING_BEHAVIOURS = [
  { value: 'Uses finger to track text', label: 'Uses finger to track text' },
  { value: 'Loses place', label: 'Loses place' },
  { value: 'Skips words', label: 'Skips words' },
  { value: 'Skips lines', label: 'Skips lines' },
  { value: 'Reads word-by-word', label: 'Reads word-by-word' },
  { value: 'Guesses unfamiliar words', label: 'Guesses unfamiliar words' },
  { value: 'Sounds out words', label: 'Sounds out words' },
  { value: 'Re-reads difficult words', label: 'Re-reads difficult words' },
  { value: 'Self-corrects errors', label: 'Self-corrects errors' },
  { value: 'Reads punctuation correctly', label: 'Reads punctuation correctly' },
  { value: 'Ignores punctuation', label: 'Ignores punctuation' },
  { value: 'Monotone reading', label: 'Monotone reading' },
  { value: 'Reads with expression', label: 'Reads with expression' },
  { value: 'Hesitates frequently', label: 'Hesitates frequently' },
  { value: 'Gives up easily', label: 'Gives up easily' },
  { value: 'Requests help frequently', label: 'Requests help frequently' },
];

const MOTIVATION_OPTIONS = [
  { value: 'Intrinsic', label: 'Intrinsic' },
  { value: 'Prompted', label: 'Prompted' },
  { value: 'Resistant', label: 'Resistant' },
];

const EMOTIONAL_OPTIONS = [
  { value: 'Calm', label: 'Calm' },
  { value: 'Avoidant', label: 'Avoidant' },
  { value: 'Anxious', label: 'Anxious' },
];

const PROMPT_OPTIONS = [
  { value: 'Independent', label: 'Independent' },
  { value: 'Occasional Prompt', label: 'Occasional Prompt' },
  { value: 'Frequent Prompt', label: 'Frequent Prompt' },
  { value: 'Constant Prompt', label: 'Constant Prompt' },
];

const LEVEL_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'High', label: 'High' },
];

const OVERALL_OPTIONS = [
  { value: 'Age Appropriate', label: 'Age Appropriate' },
  { value: 'Mild Concern', label: 'Mild Concern' },
  { value: 'Moderate Concern', label: 'Moderate Concern' },
  { value: 'Significant Concern', label: 'Significant Concern' },
];

export function ReadingBehaviourTab({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const update = (field: keyof BehaviourData, value: any) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      {/* A. Engagement & Motivation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">A. Engagement &amp; Motivation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RatingSlider
              label={t('interestInReading', { defaultValue: 'Interest in Reading' })}
              value={data.interestInReading}
              onChange={(v) => update('interestInReading', v)}
              disabled={disabled}
            />
            <RatingSlider
              label={t('confidenceLevel', { defaultValue: 'Confidence Level' })}
              value={data.confidenceLevel}
              onChange={(v) => update('confidenceLevel', v)}
              disabled={disabled}
            />
            <RatingSlider
              label={t('readingStamina', { defaultValue: 'Reading Stamina' })}
              value={data.readingStamina}
              onChange={(v) => update('readingStamina', v)}
              disabled={disabled}
            />
            <RatingSlider
              label={t('frustrationTolerance', { defaultValue: 'Frustration Tolerance' })}
              value={data.frustrationTolerance}
              onChange={(v) => update('frustrationTolerance', v)}
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('motivation', { defaultValue: 'Motivation' })}</Label>
              <Select value={data.motivation || ''} onValueChange={(v) => update('motivation', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {MOTIVATION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 mt-1">
              <Label>{t('taskAvoidance', { defaultValue: 'Task Avoidance' })}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={data.taskAvoidance === true} onChange={() => update('taskAvoidance', true)} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={data.taskAvoidance === false} onChange={() => update('taskAvoidance', false)} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">No</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. Reading Behaviours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">B. Reading Behaviours</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            options={READING_BEHAVIOURS}
            value={data.behaviours || []}
            onChange={(v) => update('behaviours', v)}
            disabled={disabled}
            columns={2}
          />
        </CardContent>
      </Card>

      {/* C. Attention & Self-Regulation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">C. Attention &amp; Self-Regulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('attentionSpanMinutes', { defaultValue: 'Attention Span (minutes)' })}</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={data.attentionSpanMinutes ?? ''}
                onChange={(e) => update('attentionSpanMinutes', e.target.value ? Number(e.target.value) : undefined)}
                disabled={disabled}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t('promptDependency', { defaultValue: 'Prompt Dependency' })}</Label>
              <Select value={data.promptDependency || ''} onValueChange={(v) => update('promptDependency', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {PROMPT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('emotionalResponse', { defaultValue: 'Emotional Response' })}</Label>
              <Select value={data.emotionalResponse || ''} onValueChange={(v) => update('emotionalResponse', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {EMOTIONAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Distractibility</Label>
              <Select value={data.distractibility || ''} onValueChange={(v) => update('distractibility', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Impulsivity During Reading</Label>
              <Select value={data.impulsivity || ''} onValueChange={(v) => update('impulsivity', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Persistence</Label>
              <Select value={data.persistence || ''} onValueChange={(v) => update('persistence', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D. Educator Observations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">D. Educator Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Include: reading strategy used; response to unfamiliar words; behaviour during difficult passages; additional observations.
          </p>
          <Textarea
            value={data.behaviorObservations || ''}
            onChange={(e) => update('behaviorObservations', e.target.value)}
            placeholder={t('behaviorObservationsPlaceholder', { defaultValue: 'Additional behavior observations...' })}
            disabled={disabled}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Overall Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Overall Reading Behaviour</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={data.overallRating || ''}
            onValueChange={(v) => update('overallRating', v)}
            disabled={disabled}
            className="flex flex-col gap-2"
          >
            {OVERALL_OPTIONS.map((o) => (
              <div key={o.value} className="flex items-center space-x-2">
                <RadioGroupItem value={o.value} id={`overall-${o.value}`} />
                <Label htmlFor={`overall-${o.value}`}>{o.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
