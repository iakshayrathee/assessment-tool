'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
  studentGrade?: string;
}

export function BasicInfoSection({ data, onChange, disabled, studentGrade }: Props) {
  const { t } = useTranslation(['assessments', 'educator']);

  const MEDIUM_OPTIONS = [
    { value: 'English', label: t('mediumEnglish', { defaultValue: 'English' }) },
    { value: 'Hindi', label: t('mediumHindi', { defaultValue: 'Hindi' }) },
    { value: 'Regional', label: t('mediumRegional', { defaultValue: 'Regional' }) }
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'English', label: t('langEnglish', { defaultValue: 'English' }) },
    { value: 'Hindi', label: t('langHindi', { defaultValue: 'Hindi' }) },
    { value: 'Tamil', label: t('langTamil', { defaultValue: 'Tamil' }) },
    { value: 'Telugu', label: t('langTelugu', { defaultValue: 'Telugu' }) },
    { value: 'Kannada', label: t('langKannada', { defaultValue: 'Kannada' }) },
    { value: 'Malayalam', label: t('langMalayalam', { defaultValue: 'Malayalam' }) },
    { value: 'Bengali', label: t('langBengali', { defaultValue: 'Bengali' }) },
    { value: 'Marathi', label: t('langMarathi', { defaultValue: 'Marathi' }) },
    { value: 'Gujarati', label: t('langGujarati', { defaultValue: 'Gujarati' }) },
    { value: 'Punjabi', label: t('langPunjabi', { defaultValue: 'Punjabi' }) },
    { value: 'Urdu', label: t('langUrdu', { defaultValue: 'Urdu' }) },
    { value: 'Other', label: t('langOther', { defaultValue: 'Other' }) }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('contextDemographicsTitle', { defaultValue: 'Context & Demographic Normalization' })}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('studentAutoLinkedDesc', { defaultValue: 'Student name, age, grade, school, and center are auto-linked from the student profile.' })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assessmentDate">{t('dateOfAssessment', { defaultValue: 'Date of Assessment' })}</Label>
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
              <Label>{t('studentGradeFromProfile', { defaultValue: 'Student Grade (from profile)' })}</Label>
              <Input value={studentGrade} disabled className="mt-1 bg-muted" />
            </div>
          )}

          <div>
            <Label htmlFor="mediumOfInstruction">{t('mediumOfInstruction', { defaultValue: 'Medium of Instruction' })}</Label>
            <Select
              value={data.mediumOfInstruction || ''}
              onValueChange={(v) => onChange({ mediumOfInstruction: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectMedium', { defaultValue: 'Select medium' })} /></SelectTrigger>
              <SelectContent>
                {MEDIUM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="firstLanguage">{t('firstLanguage', { defaultValue: 'First Language' })}</Label>
            <Select
              value={data.firstLanguage || ''}
              onValueChange={(v) => onChange({ firstLanguage: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1"><SelectValue placeholder={t('selectLanguagePlaceholder', { defaultValue: 'Select language' })} /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="parentConcern">{t('parentConcern', { defaultValue: 'Parent Concern' })}</Label>
          <Textarea
            id="parentConcern"
            value={data.parentConcern || ''}
            onChange={(e) => onChange({ parentConcern: e.target.value })}
            placeholder={t('describeParentConcernPlaceholder', { defaultValue: 'Describe any concerns raised by the parent...' })}
            disabled={disabled}
            className="mt-1"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
