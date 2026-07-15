'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

export function StrengthsSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const STRENGTH_OPTIONS = [
    { key: 'strongPhonics', label: t('strongPhonics', { defaultValue: 'Strong Phonics' }) },
    { key: 'goodMemory', label: t('goodMemory', { defaultValue: 'Good Memory' }) },
    { key: 'goodComprehension', label: t('goodComprehension', { defaultValue: 'Good Comprehension' }) },
    { key: 'expressiveReading', label: t('expressiveReading', { defaultValue: 'Expressive Reading' }) },
    { key: 'visualLearner', label: t('visualLearner', { defaultValue: 'Visual Learner' }) },
    { key: 'auditoryLearner', label: t('auditoryLearner', { defaultValue: 'Auditory Learner' }) },
    { key: 'goodVocabulary', label: t('goodVocabulary', { defaultValue: 'Good Vocabulary' }) },
    { key: 'strongOralLanguage', label: t('strongOralLanguage', { defaultValue: 'Strong Oral Language' }) },
    { key: 'motivatedReader', label: t('motivatedReader', { defaultValue: 'Motivated Reader' }) },
    { key: 'goodAttentionSpan', label: t('goodAttentionSpan', { defaultValue: 'Good Attention Span' }) },
  ];

  const strengths = data.strengths || { selected: [], educatorNotes: '' };

  const toggleStrength = (key: string) => {
    const selected = strengths.selected || [];
    const updated = selected.includes(key)
      ? selected.filter((s: string) => s !== key)
      : [...selected, key];
    onChange({ strengths: { ...strengths, selected: updated } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('multiSelectNotes', { defaultValue: 'Multi-select + Notes' })}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('identifyStrengthsTitle', { defaultValue: "Identify the student's reading strengths." })}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STRENGTH_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={(strengths.selected || []).includes(key)}
                onChange={() => toggleStrength(key)}
                disabled={disabled}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <div>
          <Label>{t('educatorNotes', { defaultValue: 'Educator Notes' })}</Label>
          <Textarea
            value={strengths.educatorNotes || ''}
            onChange={(e) => onChange({ strengths: { ...strengths, educatorNotes: e.target.value } })}
            placeholder={t('strengthsPlaceholder', { defaultValue: "Additional observations about the student's strengths..." })}
            disabled={disabled}
            className="mt-1"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
