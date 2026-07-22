'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionScoreCard } from '@/components/assessments/shared/SectionScoreCard';
import { RubricSelect, QUALITY_OPTIONS, FLUENCY_OPTIONS, ERROR_OPTIONS, DIFFICULTY_OPTIONS } from '@/components/assessments/shared/RubricSelect';
import { useTranslation } from 'react-i18next';

export interface TextSectionData {
  // School Text
  gradeLevelUsed?: string;
  subjectBook?: string;
  chapter?: string;
  passage?: string;
  // Known Text
  source?: string;
  passageName?: string;
  familiarity?: string;
  // Unknown Text
  readingLevel?: string;
  // Shared
  difficulty?: string;
  accuracy?: string;
  fluency?: string;
  errors?: string;
  comprehension?: string;
  observation?: string;
  sectionScore?: number;
}

interface TextSectionProps {
  prefix: string; // 'A', 'B', 'C'
  title: string;
  data: TextSectionData;
  onChange: (d: TextSectionData) => void;
  disabled?: boolean;
}

const GRADE_OPTIONS = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'];
const FAMILIARITY_OPTIONS = ['Highly familiar','Somewhat familiar','Memorized'];
const SOURCE_OPTIONS = ['Textbook (new lesson)','Storybook (unseen)','Teacher-created','External material'];

function rubricToScore(quality?: string, fluency?: string, errors?: string, difficulty?: string): number {
  const q = QUALITY_OPTIONS.find((o) => o.value === quality)?.score ?? 0;
  const f = FLUENCY_OPTIONS.find((o) => o.value === fluency)?.score ?? 0;
  const e = ERROR_OPTIONS.find((o) => o.value === errors)?.penalty ?? 0;
  const d = DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.adjustment ?? 0;
  return Math.max(0, (q * 0.5) + (f * 0.3) + e + d);
}

export function GradeTextSection({ prefix, title, data, onChange, disabled }: TextSectionProps) {
  const { t } = useTranslation('assessments');

  const update = (field: keyof TextSectionData, value: string) => {
    const next = { ...data, [field]: value };
    next.sectionScore = rubricToScore(next.accuracy, next.fluency, next.errors, next.difficulty);
    onChange(next);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{prefix}. {title}</CardTitle>
          {data.sectionScore !== undefined && (
            <SectionScoreCard label={t('sectionScore', { defaultValue: 'Section Score' })} score={data.sectionScore} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* School Text specific fields */}
        {prefix === 'A' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('gradeLevelTextUsed', { defaultValue: 'Grade Level Text Used' })}</Label>
              <Select value={data.gradeLevelUsed || ''} onValueChange={(v) => update('gradeLevelUsed', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectGradeLevel', { defaultValue: 'Select grade level' })} /></SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('subjectBook', { defaultValue: 'Subject / Book' })}</Label>
              <Input value={data.subjectBook || ''} onChange={(e) => update('subjectBook', e.target.value)} disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>{t('chapter', { defaultValue: 'Chapter' })}</Label>
              <Input value={data.chapter || ''} onChange={(e) => update('chapter', e.target.value)} disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>{t('passage', { defaultValue: 'Passage / Title' })}</Label>
              <Input value={data.passage || ''} onChange={(e) => update('passage', e.target.value)} disabled={disabled} className="mt-1" />
            </div>
          </div>
        )}

        {/* Known Text specific fields */}
        {prefix === 'B' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('typeOfPassage', { defaultValue: 'Type of Passage' })}</Label>
              <Select value={data.source || ''} onValueChange={(v) => update('source', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectType', { defaultValue: 'Select type' })} /></SelectTrigger>
                <SelectContent>
                  {['Textbook','Storybook','Previously practiced','Teacher-provided','Other'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('passageName', { defaultValue: 'Passage Name' })}</Label>
              <Input value={data.passageName || ''} onChange={(e) => update('passageName', e.target.value)} disabled={disabled} className="mt-1" />
            </div>
            <div>
              <Label>{t('familiarityLevel', { defaultValue: 'Familiarity Level' })}</Label>
              <Select value={data.familiarity || ''} onValueChange={(v) => update('familiarity', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectFamiliarity', { defaultValue: 'Select familiarity' })} /></SelectTrigger>
                <SelectContent>
                  {FAMILIARITY_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Unknown Text specific fields */}
        {prefix === 'C' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('sourceOfPassage', { defaultValue: 'Source of Passage' })}</Label>
              <Select value={data.source || ''} onValueChange={(v) => update('source', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectSource', { defaultValue: 'Select source' })} /></SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('readingLevel', { defaultValue: 'Reading Level' })}</Label>
              <Select value={data.readingLevel || ''} onValueChange={(v) => update('readingLevel', v)} disabled={disabled}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectGradeLevel', { defaultValue: 'Select grade level' })} /></SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Shared rubric fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RubricSelect label={t('difficultyLevel', { defaultValue: 'Difficulty Level' })} type="difficulty" value={data.difficulty} onChange={(v) => update('difficulty', v)} disabled={disabled} />
          <RubricSelect label={t('readingQuality', { defaultValue: 'Reading Quality' })} type="quality" value={data.accuracy} onChange={(v) => update('accuracy', v)} disabled={disabled} />
          <RubricSelect label={t('readingFluencyLevel', { defaultValue: 'Reading Fluency' })} type="fluency" value={data.fluency} onChange={(v) => update('fluency', v)} disabled={disabled} />
          <RubricSelect label={t('errorLevel', { defaultValue: 'Error Level' })} type="errors" value={data.errors} onChange={(v) => update('errors', v)} disabled={disabled} />
        </div>

        <div>
          <Label>{t('observation', { defaultValue: 'Observation' })}</Label>
          <Textarea
            value={data.observation || ''}
            onChange={(e) => update('observation', e.target.value)}
            placeholder={t('detailedObservationsPlaceholder', { defaultValue: 'Detailed observations...' })}
            disabled={disabled}
            className="mt-1"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
