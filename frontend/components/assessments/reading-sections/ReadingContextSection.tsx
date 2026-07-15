'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const SCHOOLING_OPTIONS = ['CBSE', 'ICSE', 'State', 'IB', 'Other'];

export function ReadingContextSection({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const EXPOSURE_OPTIONS = [
    { value: 'Daily', label: t('exposureDaily', { defaultValue: 'Daily' }), score: 3 },
    { value: 'Few times a week', label: t('exposureWeekly', { defaultValue: 'Few times a week' }), score: 2 },
    { value: 'Occasionally', label: t('exposureOccasionally', { defaultValue: 'Occasionally' }), score: 1 },
    { value: 'Rarely', label: t('exposureRarely', { defaultValue: 'Rarely' }), score: 0 },
    { value: 'Never', label: t('exposureNever', { defaultValue: 'Never' }), score: 0 }
  ];

  const SUPPORT_OPTIONS = [
    { value: 'Regular support (daily/weekly)', label: t('supportRegular', { defaultValue: 'Regular support (daily/weekly)' }), score: 2 },
    { value: 'Occasional support', label: t('supportOccasional', { defaultValue: 'Occasional support' }), score: 1 },
    { value: 'No support', label: t('supportNone', { defaultValue: 'No support' }), score: 0 }
  ];

  const INTERVENTION_OPTIONS = [
    { value: 'None', label: t('interventionNone', { defaultValue: 'None' }), score: 0 },
    { value: 'School-based support', label: t('interventionSchool', { defaultValue: 'School-based support' }), score: 1 },
    { value: 'Private tutoring', label: t('interventionTutoring', { defaultValue: 'Private tutoring' }), score: 1 },
    { value: 'Therapy (speech / special education)', label: t('interventionTherapy', { defaultValue: 'Therapy (speech / special education)' }), score: 2 },
    { value: 'Not sure', label: t('interventionNotSure', { defaultValue: 'Not sure' }), score: 0 }
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'No', label: t('langNo', { defaultValue: 'No' }), score: 0 },
    { value: 'Yes - minor difference', label: t('langMinorDiff', { defaultValue: 'Yes - minor difference' }), score: 1 },
    { value: 'Yes - major difference', label: t('langMajorDiff', { defaultValue: 'Yes - major difference' }), score: 2 }
  ];

  const MATERIAL_ACCESS_OPTIONS = [
    { value: 'Books available', label: t('materialBooks', { defaultValue: 'Books available' }), score: 2 },
    { value: 'Digital content (videos/apps)', label: t('materialDigital', { defaultValue: 'Digital content (videos/apps)' }), score: 1 },
    { value: 'Very limited access', label: t('materialLimited', { defaultValue: 'Very limited access' }), score: 0 },
    { value: 'No access', label: t('materialNone', { defaultValue: 'No access' }), score: 0 }
  ];

  // Helper functions for scoring
  const getExposureScore = (value?: string): number => {
    const option = EXPOSURE_OPTIONS.find(opt => opt.value === value);
    return option?.score || 0;
  };

  const getSupportScore = (value?: string): number => {
    const option = SUPPORT_OPTIONS.find(opt => opt.value === value);
    return option?.score || 0;
  };

  const getInterventionScore = (value?: string): number => {
    const option = INTERVENTION_OPTIONS.find(opt => opt.value === value);
    return option?.score || 0;
  };

  const getLanguageRiskScore = (value?: string): number => {
    const option = LANGUAGE_OPTIONS.find(opt => opt.value === value);
    return option?.score || 0;
  };

  const getMaterialAccessScore = (value?: string): number => {
    const option = MATERIAL_ACCESS_OPTIONS.find(opt => opt.value === value);
    return option?.score || 0;
  };

  const computeEnvironmentScore = (): number => {
    return getExposureScore(data.readingExposureAtHome) + 
           getSupportScore(data.readingSupportAtHome) + 
           getMaterialAccessScore(data.readingMaterialAccess);
  };

  const getEnvironmentBuffer = (es: number): number => {
    if (es <= 2) return 15;
    if (es <= 5) return 5;
    return 0;
  };

  const getEnvironmentInterpretation = (es: number): string => {
    if (es <= 2) return t('poorEnvironment', { defaultValue: 'Poor environment' });
    if (es <= 5) return t('moderate', { defaultValue: 'Moderate' });
    return t('strongEnvironment', { defaultValue: 'Strong environment' });
  };

  const environmentScore = computeEnvironmentScore();
  const environmentBuffer = getEnvironmentBuffer(environmentScore);
  const environmentInterpretation = getEnvironmentInterpretation(environmentScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('learningContextTitle', { defaultValue: 'Learning Context - Environment Analysis' })}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('learningContextDesc', { defaultValue: 'Understanding environmental factors to distinguish LD vs lack of exposure.' })}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1. Exposure to Reading at Home */}
        <div className="space-y-2">
          <Label>{t('labelExposureAtHome', { defaultValue: '1. Exposure to Reading at Home' })}</Label>
          <Select
            value={data.readingExposureAtHome || ''}
            onValueChange={(v) => onChange({ readingExposureAtHome: v, exposureScore: getExposureScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('selectFrequency', { defaultValue: 'Select frequency' })} />
            </SelectTrigger>
            <SelectContent>
              {EXPOSURE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} (Score: {option.score})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={t('detailsReadingExposure', { defaultValue: 'Details about reading exposure...' })}
            value={data.exposureDetails || ''}
            onChange={(e) => onChange({ exposureDetails: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        {/* 2. Reading Support at Home */}
        <div className="space-y-2">
          <Label>{t('labelSupportAtHome', { defaultValue: '2. Reading Support at Home' })}</Label>
          <Select
            value={data.readingSupportAtHome || ''}
            onValueChange={(v) => onChange({ readingSupportAtHome: v, supportScore: getSupportScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('selectSupportLevel', { defaultValue: 'Select support level' })} />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} (Score: {option.score})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={t('detailsSupport', { defaultValue: 'Details about support...' })}
            value={data.supportDetails || ''}
            onChange={(e) => onChange({ supportDetails: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        {/* 3. Previous Intervention */}
        <div className="space-y-2">
          <Label>{t('labelPreviousIntervention', { defaultValue: '3. Previous Intervention' })}</Label>
          <Select
            value={data.previousIntervention || ''}
            onValueChange={(v) => onChange({ previousIntervention: v, interventionScore: getInterventionScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('selectInterventionType', { defaultValue: 'Select intervention type' })} />
            </SelectTrigger>
            <SelectContent>
              {INTERVENTION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} (Score: {option.score})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={t('detailsIntervention', { defaultValue: 'Details about intervention...' })}
            value={data.interventionDetails || ''}
            onChange={(e) => onChange({ interventionDetails: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        {/* 4. Language Mismatch */}
        <div className="space-y-2">
          <Label>{t('labelLanguageMismatch', { defaultValue: '4. Is the home language different from the school language?' })}</Label>
          <Select
            value={data.languageMismatch || ''}
            onValueChange={(v) => onChange({ languageMismatch: v, languageRiskScore: getLanguageRiskScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('selectLanguageSituation', { defaultValue: 'Select language situation' })} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} (Risk: {option.score})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Access to Reading Materials at Home */}
        <div className="space-y-2">
          <Label>{t('labelMaterialAccess', { defaultValue: '5. Access to Reading Materials at Home' })}</Label>
          <Select
            value={data.readingMaterialAccess || ''}
            onValueChange={(v) => onChange({ readingMaterialAccess: v, materialAccessScore: getMaterialAccessScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('selectAccessLevel', { defaultValue: 'Select access level' })} />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_ACCESS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} (Score: {option.score})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type of Schooling */}
        <div className="space-y-2">
          <Label>{t('typeOfSchooling', { defaultValue: 'Type of Schooling' })}</Label>
          <Select
            value={data.typeOfSchooling || ''}
            onValueChange={(v) => onChange({ typeOfSchooling: v })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('selectType', { defaultValue: 'Select type' })} />
            </SelectTrigger>
            <SelectContent>
              {SCHOOLING_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Environment Score Preview */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">{t('envScoreAnalysisTitle', { defaultValue: 'Environment Score Analysis' })}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-blue-700 font-medium">{t('envScoreFormula', { defaultValue: 'ES = Exposure + Support + Material Access' })}</p>
              <div className="text-xs text-blue-600 mt-1">
                <div>{t('exposureLabel', { defaultValue: 'Exposure' })}: {getExposureScore(data.readingExposureAtHome)}</div>
                <div>{t('supportLabel', { defaultValue: 'Support' })}: {getSupportScore(data.readingSupportAtHome)}</div>
                <div>{t('materialsLabel', { defaultValue: 'Materials' })}: {getMaterialAccessScore(data.readingMaterialAccess)}</div>
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">{t('envInterpretationTitle', { defaultValue: 'Environment Interpretation' })}</p>
              <div className="text-lg font-bold text-blue-900 mt-1">
                ES: {environmentScore} ({environmentInterpretation})
              </div>
              <div className="text-xs text-blue-600">
                {t('bufferPoints', { defaultValue: 'Buffer: {{buffer}} points', buffer: environmentBuffer })}
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
            <strong>{t('logicLabel', { defaultValue: 'Logic:' })}</strong> {t('envScoreLogicDesc', { defaultValue: 'Low score + Poor environment may indicate lack of exposure rather than LD. High score + Good environment suggests stronger LD likelihood.' })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
