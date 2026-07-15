'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

function RatingSlider({ label, value, onChange, disabled }: {
  label: string; value: number | undefined; onChange: (v: number) => void; disabled?: boolean;
}) {
  const { t } = useTranslation('assessments');
  const ratingLabels = [
    t('ratingVeryLow', { defaultValue: 'Very Low' }),
    t('ratingLow', { defaultValue: 'Low' }),
    t('ratingAverage', { defaultValue: 'Average' }),
    t('ratingGood', { defaultValue: 'Good' }),
    t('ratingExcellent', { defaultValue: 'Excellent' })
  ];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs text-muted-foreground font-medium">
          {value ? `${value}/5 — ${ratingLabels[value - 1]}` : t('notRated', { defaultValue: 'Not rated' })}
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
  const { t } = useTranslation(['assessments', 'iep']);

  const EMOTIONAL_OPTIONS = [
    { value: 'Calm', label: t('emotionCalm', { defaultValue: 'Calm' }) },
    { value: 'Avoidant', label: t('emotionAvoidant', { defaultValue: 'Avoidant' }) },
    { value: 'Anxious', label: t('emotionAnxious', { defaultValue: 'Anxious' }) }
  ];

  const MOTIVATION_OPTIONS = [
    { value: 'Intrinsic', label: t('motivationIntrinsic', { defaultValue: 'Intrinsic' }) },
    { value: 'Prompted', label: t('motivationPrompted', { defaultValue: 'Prompted' }) },
    { value: 'Resistant', label: t('motivationResistant', { defaultValue: 'Resistant' }) }
  ];

  const SELF_CORRECTION_OPTIONS = [
    { value: 'Independent', label: t('selfCorrectionIndependent', { defaultValue: 'Independent' }) },
    { value: 'Prompted', label: t('selfCorrectionPrompted', { defaultValue: 'Prompted' }) },
    { value: 'None', label: t('selfCorrectionNone', { defaultValue: 'None' }) }
  ];

  const PROMPT_DEPENDENCY_OPTIONS = [
    { value: 'Independent', label: t('promptDepIndependent', { defaultValue: 'Independent' }) },
    { value: 'Needs cues', label: t('promptDepNeedsCues', { defaultValue: 'Needs cues' }) },
    { value: 'Fully assisted', label: t('promptDepFullyAssisted', { defaultValue: 'Fully assisted' }) }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('ratingScaleTitle', { defaultValue: 'Rating Scale (1–5) + Observations' })}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Scales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RatingSlider label={t('interestInReading', { defaultValue: 'Interest in Reading' })} value={data.interestInReading}
            onChange={(v) => onChange({ interestInReading: v })} disabled={disabled} />
          <RatingSlider label={t('readingStamina', { defaultValue: 'Reading Stamina' })} value={data.readingStamina}
            onChange={(v) => onChange({ readingStamina: v })} disabled={disabled} />
          <RatingSlider label={t('frustrationTolerance', { defaultValue: 'Frustration Tolerance' })} value={data.frustrationTolerance}
            onChange={(v) => onChange({ frustrationTolerance: v })} disabled={disabled} />
          <RatingSlider label={t('confidenceLevel', { defaultValue: 'Confidence Level' })} value={data.confidenceLevel}
            onChange={(v) => onChange({ confidenceLevel: v })} disabled={disabled} />
        </div>

        {/* Attention Span */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('attentionSpanMinutes', { defaultValue: 'Attention Span (minutes)' })}</Label>
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
            <Label>{t('taskAvoidance', { defaultValue: 'Task Avoidance' })}</Label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.taskAvoidance === true}
                  onChange={() => onChange({ taskAvoidance: true })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">{t('yes', { ns: 'assessments' })}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={data.taskAvoidance === false}
                  onChange={() => onChange({ taskAvoidance: false })} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">{t('no', { ns: 'assessments' })}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>{t('emotionalResponse', { defaultValue: 'Emotional Response' })}</Label>
            <Select value={data.emotionalResponse || ''} onValueChange={(v) => onChange({ emotionalResponse: v })} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
              <SelectContent>
                {EMOTIONAL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('motivation', { defaultValue: 'Motivation' })}</Label>
            <Select value={data.motivation || ''} onValueChange={(v) => onChange({ motivation: v })} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
              <SelectContent>
                {MOTIVATION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('selfCorrectionAbility', { defaultValue: 'Self-Correction Ability' })}</Label>
            <Select value={data.selfCorrectionAbility || ''} onValueChange={(v) => onChange({ selfCorrectionAbility: v })} disabled={disabled}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
              <SelectContent>
                {SELF_CORRECTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>{t('promptDependency', { defaultValue: 'Prompt Dependency' })}</Label>
          <Select value={data.promptDependency || ''} onValueChange={(v) => onChange({ promptDependency: v })} disabled={disabled}>
            <SelectTrigger className="mt-1 max-w-sm"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
            <SelectContent>
              {PROMPT_DEPENDENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('observations', { defaultValue: 'Observations' })}</Label>
          <Textarea
            value={data.behaviorObservations || ''}
            onChange={(e) => onChange({ behaviorObservations: e.target.value })}
            placeholder={t('behaviorObservationsPlaceholder', { defaultValue: 'Additional behavior observations...' })}
            disabled={disabled}
            className="mt-1"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
