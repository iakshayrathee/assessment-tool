'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

function ScoreSlider({ label, value, onChange, disabled, max = 5 }: {
  label: string; value: number | undefined; onChange: (v: number) => void; disabled?: boolean; max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs font-medium text-primary">{value !== undefined ? `${value}/${max}` : '—'}</span>
      </div>
      <Slider
        min={0} max={max} step={1}
        value={value !== undefined ? [value] : [0]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
    </div>
  );
}

export function CoreReadingSkillsSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation(['assessments', 'iep']);
  const phon = data.phonologicalAwareness || {};
  const dec = data.decodingSkills || {};

  const EXPRESSION_OPTIONS = [
    { value: 'Flat', label: t('expressionFlat', { defaultValue: 'Flat' }) },
    { value: 'Moderate', label: t('expressionModerate', { defaultValue: 'Moderate' }) },
    { value: 'Good', label: t('expressionGood', { defaultValue: 'Good' }) }
  ];

  const PAUSING_OPTIONS = [
    { value: 'Correct', label: t('pausingCorrect', { defaultValue: 'Correct' }) },
    { value: 'Incorrect', label: t('pausingIncorrect', { defaultValue: 'Incorrect' }) }
  ];

  const updatePhon = (field: string, value: any) => {
    onChange({ phonologicalAwareness: { ...phon, [field]: value } });
  };

  const updateDec = (field: string, value: any) => {
    onChange({ decodingSkills: { ...dec, [field]: value } });
  };

  return (
    <div className="space-y-4">
      {/* A. Phonological Awareness */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('phonologicalAwarenessTitle', { defaultValue: 'A. Phonological Awareness' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('rhyming', { defaultValue: 'Rhyming' })}</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={phon.rhyming === true}
                  onChange={() => updatePhon('rhyming', true)} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">{t('yes', { ns: 'assessments' })}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={phon.rhyming === false}
                  onChange={() => updatePhon('rhyming', false)} disabled={disabled} className="h-4 w-4" />
                <span className="text-sm">{t('no', { ns: 'assessments' })}</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreSlider label={t('blending', { defaultValue: 'Blending' })} value={phon.blending} onChange={(v) => updatePhon('blending', v)} disabled={disabled} />
            <ScoreSlider label={t('segmenting', { defaultValue: 'Segmenting' })} value={phon.segmenting} onChange={(v) => updatePhon('segmenting', v)} disabled={disabled} />
            <ScoreSlider label={t('soundIdentification', { defaultValue: 'Sound Identification' })} value={phon.soundIdentification} onChange={(v) => updatePhon('soundIdentification', v)} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* B. Decoding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('decodingTitle', { defaultValue: 'B. Decoding' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreSlider label={t('letterSoundKnowledge', { defaultValue: 'Letter-Sound Knowledge' })} value={dec.letterSoundKnowledge} onChange={(v) => updateDec('letterSoundKnowledge', v)} disabled={disabled} />
            <ScoreSlider label={t('cvcWords', { defaultValue: 'CVC Words' })} value={dec.cvcWords} onChange={(v) => updateDec('cvcWords', v)} disabled={disabled} />
            <ScoreSlider label={t('blendsDigraphs', { defaultValue: 'Blends/Digraphs' })} value={dec.blendsDigraphs} onChange={(v) => updateDec('blendsDigraphs', v)} disabled={disabled} />
            <ScoreSlider label={t('multisyllabicDecoding', { defaultValue: 'Multisyllabic Decoding' })} value={dec.multisyllabicDecoding} onChange={(v) => updateDec('multisyllabicDecoding', v)} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* C. Fluency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('fluencyTitle', { defaultValue: 'C. Fluency' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>{t('wordsPerMinute', { defaultValue: 'Words Per Minute (WPM)' })}</Label>
              <Input type="number" min={0}
                value={data.wordsPerMinute ?? ''} onChange={(e) => onChange({ wordsPerMinute: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="e.g., 60" disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>{t('fluencyAccuracyPercent', { defaultValue: 'Accuracy %' })}</Label>
              <Input type="number" min={0} max={100} step={0.1}
                value={data.fluencyAccuracy ?? ''} onChange={(e) => onChange({ fluencyAccuracy: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0-100" disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>{t('errorRate', { defaultValue: 'Error Rate' })}</Label>
              <Input type="number" min={0} step={0.1}
                value={data.fluencyErrorRate ?? ''} onChange={(e) => onChange({ fluencyErrorRate: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="errors/100 words" disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>{t('hesitationsCount', { defaultValue: 'Hesitations (Count)' })}</Label>
              <Input type="number" min={0}
                value={data.hesitationCount ?? ''} onChange={(e) => onChange({ hesitationCount: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0" disabled={disabled} className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D. Sight Words */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('sightWordsTitle', { defaultValue: 'D. Sight Words' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label>{t('correctFromGradeListPercent', { defaultValue: '% Correct from Grade List' })}</Label>
            <Input type="number" min={0} max={100} step={0.1}
              value={data.sightWordsPercent ?? ''} onChange={(e) => onChange({ sightWordsPercent: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="0-100" disabled={disabled} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* E. Mechanics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('mechanicsTitle', { defaultValue: 'E. Mechanics' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('punctuationAwareness', { defaultValue: 'Punctuation Awareness' })}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={data.punctuationAwareness === true}
                    onChange={() => onChange({ punctuationAwareness: true })} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">{t('yes', { ns: 'assessments' })}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={data.punctuationAwareness === false}
                    onChange={() => onChange({ punctuationAwareness: false })} disabled={disabled} className="h-4 w-4" />
                  <span className="text-sm">{t('no', { ns: 'assessments' })}</span>
                </label>
              </div>
            </div>
            <div>
              <Label>{t('expression', { defaultValue: 'Expression' })}</Label>
              <Select value={data.readingExpression || ''} onValueChange={(v) => onChange({ readingExpression: v })} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
                <SelectContent>{EXPRESSION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('pausing', { defaultValue: 'Pausing' })}</Label>
              <Select value={data.pausingCorrectness || ''} onValueChange={(v) => onChange({ pausingCorrectness: v })} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
                <SelectContent>{PAUSING_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* F. Visual Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('visualTrackingTitle', { defaultValue: 'F. Visual Tracking' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'skipsLinesVisual' as const, label: t('skipsLines', { defaultValue: 'Skips Lines' }) },
              { key: 'usesFinger' as const, label: t('usesFinger', { defaultValue: 'Uses Finger' }) },
              { key: 'losesPlace' as const, label: t('losesPlace', { defaultValue: 'Loses Place' }) },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={data[key] === true}
                      onChange={() => onChange({ [key]: true })} disabled={disabled} className="h-4 w-4" />
                    <span className="text-sm">{t('yes', { ns: 'assessments' })}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={data[key] === false}
                      onChange={() => onChange({ [key]: false })} disabled={disabled} className="h-4 w-4" />
                    <span className="text-sm">{t('no', { ns: 'assessments' })}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
