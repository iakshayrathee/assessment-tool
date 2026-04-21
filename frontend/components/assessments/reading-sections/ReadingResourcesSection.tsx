'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
}

// Standardized scoring options
const QUALITY_OPTIONS = [
  { value: 'Excellent', label: 'Excellent', score: 90 },
  { value: 'Good', label: 'Good', score: 75 },
  { value: 'Developing', label: 'Developing', score: 60 },
  { value: 'Needs Support', label: 'Needs Support', score: 40 }
];

const FLUENCY_OPTIONS = [
  { value: 'Fast', label: 'Fast (above grade)', score: 90 },
  { value: 'On-level', label: 'On-level', score: 75 },
  { value: 'Slow', label: 'Slow', score: 60 },
  { value: 'Very slow', label: 'Very slow', score: 40 }
];

const ERROR_OPTIONS = [
  { value: 'Minimal', label: 'Minimal', penalty: 0 },
  { value: 'Moderate', label: 'Moderate', penalty: -10 },
  { value: 'Frequent', label: 'Frequent', penalty: -20 }
];

const DIFFICULTY_OPTIONS = [
  { value: 'Easy', label: 'Easy', adjustment: -5 },
  { value: 'Grade Level', label: 'Grade Level', adjustment: 0 },
  { value: 'Hard', label: 'Hard', adjustment: 5 }
];

// Scoring helper functions
const getQualityScore = (value?: string): number => {
  const option = QUALITY_OPTIONS.find(opt => opt.value === value);
  return option?.score || 0;
};

const getFluencyScore = (value?: string): number => {
  const option = FLUENCY_OPTIONS.find(opt => opt.value === value);
  return option?.score || 0;
};

const getErrorPenalty = (value?: string): number => {
  const option = ERROR_OPTIONS.find(opt => opt.value === value);
  return option?.penalty || 0;
};

const getDifficultyAdjustment = (value?: string): number => {
  const option = DIFFICULTY_OPTIONS.find(opt => opt.value === value);
  return option?.adjustment || 0;
};

const computeSectionScore = (quality?: string, fluency?: string, errors?: string, difficulty?: string): number => {
  const qualityScore = getQualityScore(quality);
  const fluencyScore = getFluencyScore(fluency);
  const errorPenalty = getErrorPenalty(errors);
  const difficultyAdjustment = getDifficultyAdjustment(difficulty);
  
  return (qualityScore * 0.5) + (fluencyScore * 0.3) + errorPenalty + difficultyAdjustment;
};

const computeFinalReadingScore = (schoolScore: number, knownScore: number, unknownScore: number): number => {
  let finalScore = (schoolScore * 0.2) + (knownScore * 0.3) + (unknownScore * 0.5);
  
  // Special Logic: Unknown Text penalty
  if (unknownScore < knownScore - 20) {
    finalScore -= 10;
  }
  
  return Math.max(0, Math.min(100, finalScore));
};

export function ReadingResourcesSection({ data, onChange, disabled }: Props) {
  const schoolScore = computeSectionScore(
    data.schoolTextQuality, 
    data.schoolTextFluency, 
    data.schoolTextErrors, 
    data.schoolTextDifficulty
  );
  
  const knownScore = computeSectionScore(
    data.knownTextQuality, 
    data.knownTextFluency, 
    data.knownTextErrors, 
    data.knownTextDifficulty
  );
  
  const unknownScore = computeSectionScore(
    data.unknownTextQuality, 
    data.unknownTextFluency, 
    data.unknownTextErrors, 
    data.unknownTextDifficulty
  );
  
  const finalReadingScore = computeFinalReadingScore(schoolScore, knownScore, unknownScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resources Assessment - A/B/C Text Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed evaluation across different text types with standardized scoring
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* A. School Text */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">A. School Text</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Grade Level Text Used</Label>
              <Select
                value={data.schoolTextGradeLevel || ''}
                onValueChange={(v) => onChange({ schoolTextGradeLevel: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grade 1">Grade 1</SelectItem>
                  <SelectItem value="Grade 2">Grade 2</SelectItem>
                  <SelectItem value="Grade 3">Grade 3</SelectItem>
                  <SelectItem value="Grade 4">Grade 4</SelectItem>
                  <SelectItem value="Grade 5">Grade 5</SelectItem>
                  <SelectItem value="Grade 6">Grade 6</SelectItem>
                  <SelectItem value="Grade 7">Grade 7</SelectItem>
                  <SelectItem value="Grade 8">Grade 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty Level</Label>
              <Select
                value={data.schoolTextDifficulty || ''}
                onValueChange={(v) => onChange({ schoolTextDifficulty: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.adjustment > 0 ? '+' : ''}{option.adjustment})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reading Quality</Label>
              <Select
                value={data.schoolTextQuality || ''}
                onValueChange={(v) => onChange({ schoolTextQuality: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Error Level</Label>
              <Select
                value={data.schoolTextErrors || ''}
                onValueChange={(v) => onChange({ schoolTextErrors: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select error level" />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.penalty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reading Fluency Level</Label>
              <Select
                value={data.schoolTextFluency || ''}
                onValueChange={(v) => onChange({ schoolTextFluency: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select fluency" />
                </SelectTrigger>
                <SelectContent>
                  {FLUENCY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Observation</Label>
            <Input
              placeholder="Detailed observations..."
              value={data.schoolTextObservation || ''}
              onChange={(e) => onChange({ schoolTextObservation: e.target.value })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <strong>Section Score: {schoolScore.toFixed(1)}</strong>
          </div>
        </div>

        {/* B. Known Text */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">B. Known Text</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Type of Passage</Label>
              <Select
                value={data.knownTextType || ''}
                onValueChange={(v) => onChange({ knownTextType: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Textbook">Textbook</SelectItem>
                  <SelectItem value="Storybook">Storybook</SelectItem>
                  <SelectItem value="Previously practiced">Previously practiced</SelectItem>
                  <SelectItem value="Teacher-provided">Teacher-provided</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Familiarity Level</Label>
              <Select
                value={data.knownTextFamiliarity || ''}
                onValueChange={(v) => onChange({ knownTextFamiliarity: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select familiarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Highly familiar">Highly familiar</SelectItem>
                  <SelectItem value="Somewhat familiar">Somewhat familiar</SelectItem>
                  <SelectItem value="Memorized">Memorized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Difficulty</Label>
              <Select
                value={data.knownTextDifficulty || ''}
                onValueChange={(v) => onChange({ knownTextDifficulty: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.adjustment > 0 ? '+' : ''}{option.adjustment})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reading Quality</Label>
              <Select
                value={data.knownTextQuality || ''}
                onValueChange={(v) => onChange({ knownTextQuality: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Error Level</Label>
              <Select
                value={data.knownTextErrors || ''}
                onValueChange={(v) => onChange({ knownTextErrors: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select error level" />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.penalty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reading Fluency Level</Label>
              <Select
                value={data.knownTextFluency || ''}
                onValueChange={(v) => onChange({ knownTextFluency: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select fluency" />
                </SelectTrigger>
                <SelectContent>
                  {FLUENCY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Observation</Label>
            <Input
              placeholder="Detailed observations..."
              value={data.knownTextObservation || ''}
              onChange={(e) => onChange({ knownTextObservation: e.target.value })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <strong>Section Score: {knownScore.toFixed(1)}</strong>
          </div>
        </div>

        {/* C. Unknown Text */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">C. Unknown Text</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Source of Passage</Label>
              <Select
                value={data.unknownTextSource || ''}
                onValueChange={(v) => onChange({ unknownTextSource: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Textbook (new lesson)">Textbook (new lesson)</SelectItem>
                  <SelectItem value="Storybook (unseen)">Storybook (unseen)</SelectItem>
                  <SelectItem value="Teacher-created">Teacher-created</SelectItem>
                  <SelectItem value="External material">External material</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty Level</Label>
              <Select
                value={data.unknownTextDifficulty || ''}
                onValueChange={(v) => onChange({ unknownTextDifficulty: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.adjustment > 0 ? '+' : ''}{option.adjustment})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reading Quality</Label>
              <Select
                value={data.unknownTextQuality || ''}
                onValueChange={(v) => onChange({ unknownTextQuality: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Error Level</Label>
              <Select
                value={data.unknownTextErrors || ''}
                onValueChange={(v) => onChange({ unknownTextErrors: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select error level" />
                </SelectTrigger>
                <SelectContent>
                  {ERROR_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.penalty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reading Fluency Level</Label>
              <Select
                value={data.unknownTextFluency || ''}
                onValueChange={(v) => onChange({ unknownTextFluency: v })}
                disabled={disabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select fluency" />
                </SelectTrigger>
                <SelectContent>
                  {FLUENCY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Observation</Label>
            <Input
              placeholder="Detailed observations..."
              value={data.unknownTextObservation || ''}
              onChange={(e) => onChange({ unknownTextObservation: e.target.value })}
              disabled={disabled}
              className="mt-1"
            />
          </div>
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <strong>Section Score: {unknownScore.toFixed(1)}</strong>
            {unknownScore < knownScore - 20 && (
              <div className="text-xs text-orange-600 mt-1">
                *Special Logic: Unknown Text penalty applied (-10)
              </div>
            )}
          </div>
        </div>

        {/* D. Resource Context */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-3">D. Resource Context</h4>
          
          {/* Type of Material (Multi-select) */}
          <div className="mb-4">
            <Label>Type of Material (Multi-select)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {['Storybooks', 'School textbooks', 'Worksheets', 'Digital content', 'Knowledge Material'].map(material => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox
                    id={material}
                    checked={data.materialTypes?.includes(material) || false}
                    onCheckedChange={(checked) => {
                      const current = data.materialTypes || [];
                      const updated = checked 
                        ? [...current, material]
                        : current.filter(m => m !== material);
                      onChange({ materialTypes: updated });
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={material} className="text-sm">{material}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Reading Level of Material */}
          <div className="mb-4">
            <Label>Reading Level of Material</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Select level for each material type chosen above
            </div>
            <div className="space-y-2">
              {data.materialTypes?.map(material => (
                <div key={material} className="flex items-center gap-2">
                  <span className="text-sm w-32">{material}:</span>
                  <Select
                    value={data.materialLevels?.[data.materialTypes.indexOf(material)] || ''}
                    onValueChange={(v) => {
                      const current = data.materialLevels || [];
                      const index = data.materialTypes?.indexOf(material) || 0;
                      const updated = [...current];
                      updated[index] = v;
                      onChange({ materialLevels: updated });
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Below grade level">Below grade level (+1)</SelectItem>
                      <SelectItem value="At grade level">At grade level (+2)</SelectItem>
                      <SelectItem value="Above grade level">Above grade level (+2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Reading Independence */}
          <div>
            <Label>Reading Independence</Label>
            <Select
              value={data.readingIndependence || ''}
              onValueChange={(v) => onChange({ readingIndependence: v })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select independence level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reads independently">Reads independently (+2)</SelectItem>
                <SelectItem value="Needs support">Needs support (+1)</SelectItem>
                <SelectItem value="Avoids reading">Avoids reading (0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Final Reading Score Preview */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-900 mb-3">Final Reading Score (RS)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-green-700 font-medium">RS = (School × 0.2) + (Known × 0.3) + (Unknown × 0.5)</p>
              <div className="text-xs text-green-600 mt-1">
                <div>School: {schoolScore.toFixed(1)} × 0.2 = {(schoolScore * 0.2).toFixed(1)}</div>
                <div>Known: {knownScore.toFixed(1)} × 0.3 = {(knownScore * 0.3).toFixed(1)}</div>
                <div>Unknown: {unknownScore.toFixed(1)} × 0.5 = {(unknownScore * 0.5).toFixed(1)}</div>
              </div>
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Final Reading Score</p>
              <div className="text-2xl font-bold text-green-900 mt-1">
                RS: {finalReadingScore.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
            <strong>Special Logic:</strong> Unknown Text represents TRUE ABILITY. 
            {unknownScore < knownScore - 20 && ' Penalty applied due to significant gap between known and unknown text performance.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
