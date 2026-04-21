'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

const EXPOSURE_OPTIONS = [
  { value: 'Daily', label: 'Daily', score: 3 },
  { value: 'Few times a week', label: 'Few times a week', score: 2 },
  { value: 'Occasionally', label: 'Occasionally', score: 1 },
  { value: 'Rarely', label: 'Rarely', score: 0 },
  { value: 'Never', label: 'Never', score: 0 }
];

const SUPPORT_OPTIONS = [
  { value: 'Regular support (daily/weekly)', label: 'Regular support (daily/weekly)', score: 2 },
  { value: 'Occasional support', label: 'Occasional support', score: 1 },
  { value: 'No support', label: 'No support', score: 0 }
];

const INTERVENTION_OPTIONS = [
  { value: 'None', label: 'None', score: 0 },
  { value: 'School-based support', label: 'School-based support', score: 1 },
  { value: 'Private tutoring', label: 'Private tutoring', score: 1 },
  { value: 'Therapy (speech / special education)', label: 'Therapy (speech / special education)', score: 2 },
  { value: 'Not sure', label: 'Not sure', score: 0 }
];

const LANGUAGE_OPTIONS = [
  { value: 'No', label: 'No', score: 0 },
  { value: 'Yes - minor difference', label: 'Yes - minor difference', score: 1 },
  { value: 'Yes - major difference', label: 'Yes - major difference', score: 2 }
];

const MATERIAL_ACCESS_OPTIONS = [
  { value: 'Books available', label: 'Books available', score: 2 },
  { value: 'Digital content (videos/apps)', label: 'Digital content (videos/apps)', score: 1 },
  { value: 'Very limited access', label: 'Very limited access', score: 0 },
  { value: 'No access', label: 'No access', score: 0 }
];

const SCHOOLING_OPTIONS = ['CBSE', 'ICSE', 'State', 'IB', 'Other'];

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

const computeEnvironmentScore = (data: ReadingAssessmentFormData): number => {
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
  if (es <= 2) return 'Poor environment';
  if (es <= 5) return 'Moderate';
  return 'Strong environment';
};

export function ReadingContextSection({ data, onChange, disabled }: Props) {
  const environmentScore = computeEnvironmentScore(data);
  const environmentBuffer = getEnvironmentBuffer(environmentScore);
  const environmentInterpretation = getEnvironmentInterpretation(environmentScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Learning Context - Environment Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Understanding environmental factors to distinguish LD vs lack of exposure.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1. Exposure to Reading at Home */}
        <div className="space-y-2">
          <Label>1. Exposure to Reading at Home</Label>
          <Select
            value={data.readingExposureAtHome || ''}
            onValueChange={(v) => onChange({ readingExposureAtHome: v, exposureScore: getExposureScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select frequency" />
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
            placeholder="Details about reading exposure..."
            value={data.exposureDetails || ''}
            onChange={(e) => onChange({ exposureDetails: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        {/* 2. Reading Support at Home */}
        <div className="space-y-2">
          <Label>2. Reading Support at Home</Label>
          <Select
            value={data.readingSupportAtHome || ''}
            onValueChange={(v) => onChange({ readingSupportAtHome: v, supportScore: getSupportScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select support level" />
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
            placeholder="Details about support..."
            value={data.supportDetails || ''}
            onChange={(e) => onChange({ supportDetails: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        {/* 3. Previous Intervention */}
        <div className="space-y-2">
          <Label>3. Previous Intervention</Label>
          <Select
            value={data.previousIntervention || ''}
            onValueChange={(v) => onChange({ previousIntervention: v, interventionScore: getInterventionScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select intervention type" />
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
            placeholder="Details about intervention..."
            value={data.interventionDetails || ''}
            onChange={(e) => onChange({ interventionDetails: e.target.value })}
            disabled={disabled}
            className="mt-1"
          />
        </div>

        {/* 4. Language Mismatch */}
        <div className="space-y-2">
          <Label>4. Is the home language different from the school language?</Label>
          <Select
            value={data.languageMismatch || ''}
            onValueChange={(v) => onChange({ languageMismatch: v, languageRiskScore: getLanguageRiskScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select language situation" />
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
          <Label>5. Access to Reading Materials at Home</Label>
          <Select
            value={data.readingMaterialAccess || ''}
            onValueChange={(v) => onChange({ readingMaterialAccess: v, materialAccessScore: getMaterialAccessScore(v) })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select access level" />
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
          <Label>Type of Schooling</Label>
          <Select
            value={data.typeOfSchooling || ''}
            onValueChange={(v) => onChange({ typeOfSchooling: v })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select type" />
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
          <h4 className="font-semibold text-blue-900 mb-3">Environment Score Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-blue-700 font-medium">ES = Exposure + Support + Material Access</p>
              <div className="text-xs text-blue-600 mt-1">
                <div>Exposure: {getExposureScore(data.readingExposureAtHome)}</div>
                <div>Support: {getSupportScore(data.readingSupportAtHome)}</div>
                <div>Materials: {getMaterialAccessScore(data.readingMaterialAccess)}</div>
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Environment Interpretation</p>
              <div className="text-lg font-bold text-blue-900 mt-1">
                ES: {environmentScore} ({environmentInterpretation})
              </div>
              <div className="text-xs text-blue-600">
                Buffer: {environmentBuffer} points
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
            <strong>Logic:</strong> Low score + Poor environment may indicate lack of exposure rather than LD.
            High score + Good environment suggests stronger LD likelihood.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
