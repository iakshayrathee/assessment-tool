'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

function ScoreSlider({ label, value, onChange, disabled }: {
  label: string; value: number | undefined; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs font-medium text-primary">{value !== undefined ? `${value}/5` : '—'}</span>
      </div>
      <Slider min={0} max={5} step={1} value={value !== undefined ? [value] : [0]}
        onValueChange={([v]) => onChange(v)} disabled={disabled} />
    </div>
  );
}

export function ComprehensionSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation(['assessments', 'iep']);
  const comp = data.comprehension || {};

  const update = (section: string, field: string, value: any) => {
    const updated = { ...comp };
    updated[section] = { ...(updated[section] || {}), [field]: value };
    onChange({ comprehension: updated });
  };

  return (
    <div className="space-y-4">
      {/* Literal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('literalComprehensionTitle', { defaultValue: 'Literal Comprehension' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreSlider label={t('recallFacts', { defaultValue: 'Recall Facts' })} value={comp.literal?.recallFacts}
              onChange={(v) => update('literal', 'recallFacts', v)} disabled={disabled} />
            <ScoreSlider label={t('identifyCharactersEvents', { defaultValue: 'Identify Characters/Events' })} value={comp.literal?.identifyCharacters}
              onChange={(v) => update('literal', 'identifyCharacters', v)} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Inferential */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('inferentialComprehensionTitle', { defaultValue: 'Inferential Comprehension' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreSlider label={t('predictionAbility', { defaultValue: 'Prediction Ability' })} value={comp.inferential?.prediction}
              onChange={(v) => update('inferential', 'prediction', v)} disabled={disabled} />
            <ScoreSlider label={t('meaningInference', { defaultValue: 'Meaning Inference' })} value={comp.inferential?.meaningInference}
              onChange={(v) => update('inferential', 'meaningInference', v)} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Critical */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('criticalComprehensionTitle', { defaultValue: 'Critical Comprehension' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreSlider label={t('opinionFormation', { defaultValue: 'Opinion Formation' })} value={comp.critical?.opinionFormation}
              onChange={(v) => update('critical', 'opinionFormation', v)} disabled={disabled} />
            <ScoreSlider label={t('realLifeConnection', { defaultValue: 'Real-Life Connection' })} value={comp.critical?.realLifeConnection}
              onChange={(v) => update('critical', 'realLifeConnection', v)} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Retelling */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('retellingTitle', { defaultValue: 'Retelling' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{t('sequencing', { defaultValue: 'Sequencing' })}</Label>
              <Select
                value={comp.retelling?.sequencing || ''}
                onValueChange={(v) => update('retelling', 'sequencing', v)}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('select', { ns: 'iep' })} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Correct">{t('sequencingCorrect', { defaultValue: 'Correct' })}</SelectItem>
                  <SelectItem value="Incorrect">{t('sequencingIncorrect', { defaultValue: 'Incorrect' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScoreSlider label={t('completeness', { defaultValue: 'Completeness' })} value={comp.retelling?.completeness}
              onChange={(v) => update('retelling', 'completeness', v)} disabled={disabled} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
