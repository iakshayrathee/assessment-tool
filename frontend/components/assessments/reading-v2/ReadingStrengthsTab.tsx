'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxGroup } from '@/components/assessments/shared/CheckboxGroup';
import { useTranslation } from 'react-i18next';

interface StrengthsData {
  groups?: {
    foundational?: string[];
    fluency?: string[];
    learningBehaviours?: string[];
    learningProfile?: string[];
  };
  notes?: {
    primary?: string;
    intervention?: string;
  };
}

interface Props {
  data: StrengthsData;
  onChange: (d: StrengthsData) => void;
  disabled?: boolean;
}

const GROUP_A = [
  { value: 'Strong Phonological Awareness', label: 'Strong Phonological Awareness' },
  { value: 'Good Letter-Sound Knowledge', label: 'Good Letter-Sound Knowledge' },
  { value: 'Strong Decoding Skills', label: 'Strong Decoding Skills' },
  { value: 'Good Sight Word Recognition', label: 'Good Sight Word Recognition' },
  { value: 'Strong Word Recognition', label: 'Strong Word Recognition' },
  { value: 'Good Vocabulary', label: 'Good Vocabulary' },
];

const GROUP_B = [
  { value: 'Reads Accurately', label: 'Reads Accurately' },
  { value: 'Good Reading Fluency', label: 'Good Reading Fluency' },
  { value: 'Appropriate Reading Speed', label: 'Appropriate Reading Speed' },
  { value: 'Expressive Reading', label: 'Expressive Reading' },
  { value: 'Good Punctuation Awareness', label: 'Good Punctuation Awareness' },
  { value: 'Self-Corrects While Reading', label: 'Self-Corrects While Reading' },
];

const GROUP_D = [
  { value: 'Interested in Reading', label: 'Interested in Reading' },
  { value: 'Sustains Attention', label: 'Sustains Attention' },
  { value: 'Good Reading Stamina', label: 'Good Reading Stamina' },
  { value: 'Confident Reader', label: 'Confident Reader' },
  { value: 'Works Independently', label: 'Works Independently' },
  { value: 'Responds Well to Feedback', label: 'Responds Well to Feedback' },
];

const GROUP_E = [
  { value: 'Visual Learner', label: 'Visual Learner' },
  { value: 'Auditory Learner', label: 'Auditory Learner' },
  { value: 'Good Memory', label: 'Good Memory' },
  { value: 'Strong Oral Language', label: 'Strong Oral Language' },
  { value: 'Good Listening Skills', label: 'Good Listening Skills' },
  { value: 'Learns Quickly with Demonstration', label: 'Learns Quickly with Demonstration' },
];

export function ReadingStrengthsTab({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const updateGroup = (key: keyof NonNullable<StrengthsData['groups']>, val: string[]) =>
    onChange({ ...data, groups: { ...data.groups, [key]: val } });

  const updateNote = (key: keyof NonNullable<StrengthsData['notes']>, val: string) =>
    onChange({ ...data, notes: { ...data.notes, [key]: val } });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">A. Foundational Reading Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            options={GROUP_A}
            value={data.groups?.foundational || []}
            onChange={(v) => updateGroup('foundational', v)}
            disabled={disabled}
            columns={2}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">B. Reading Fluency</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            options={GROUP_B}
            value={data.groups?.fluency || []}
            onChange={(v) => updateGroup('fluency', v)}
            disabled={disabled}
            columns={2}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">D. Learning Behaviours</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            options={GROUP_D}
            value={data.groups?.learningBehaviours || []}
            onChange={(v) => updateGroup('learningBehaviours', v)}
            disabled={disabled}
            columns={2}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">E. Learning Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            options={GROUP_E}
            value={data.groups?.learningProfile || []}
            onChange={(v) => updateGroup('learningProfile', v)}
            disabled={disabled}
            columns={2}
          />
        </CardContent>
      </Card>

      {/* F. Educator Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">F. Educator Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Reading Strengths</Label>
            <Textarea
              value={data.notes?.primary || ''}
              onChange={(e) => updateNote('primary', e.target.value)}
              placeholder="Describe the student's primary reading strengths..."
              disabled={disabled}
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label>How can these strengths be used during intervention?</Label>
            <Textarea
              value={data.notes?.intervention || ''}
              onChange={(e) => updateNote('intervention', e.target.value)}
              placeholder="Describe how these strengths can support intervention strategies..."
              disabled={disabled}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
