import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface GradeLevelMapping {
  gradeLevel: string;
  independent: string;
  instructional: string;
  frustration: string;
  summaryNote?: string;
}

interface GradeLevelMappingProps {
  mappings: GradeLevelMapping[];
  onChange: (mappings: GradeLevelMapping[]) => void;
  maxMappings?: number;
  disabled?: boolean;
  title?: string;
  showSummaryNote?: boolean;
}

export const GradeLevelMappingComponent: React.FC<GradeLevelMappingProps> = ({
  mappings,
  onChange,
  maxMappings = 4,
  disabled = false,
  title,
  showSummaryNote = false,
}) => {
  const { t } = useTranslation('assessments');
  const displayTitle = title || t('gradeLevelMapping', { defaultValue: 'Grade Level Mapping' });

  const addMapping = () => {
    if (mappings.length < maxMappings) {
      onChange([
        ...mappings,
        {
          gradeLevel: '',
          independent: '',
          instructional: '',
          frustration: '',
          summaryNote: '',
        },
      ]);
    }
  };

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index: number, field: keyof GradeLevelMapping, value: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{displayTitle}</CardTitle>
          {!disabled && mappings.length < maxMappings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMapping}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('addGradeLevel', { defaultValue: 'Add Grade Level' })} (Max {maxMappings})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mappings.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noGradeLevelsYet', { defaultValue: 'No grade levels added yet. Click "Add Grade Level" to begin.' })}
          </p>
        )}

        {mappings.map((mapping, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">
                  {t('gradeLevelOrdinal', { defaultValue: 'Grade Level {{count}}', count: index + 1 })}
                </h4>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMapping(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor={`gradeLevel-${index}`}>{t('gradeLevelLabelRequired', { defaultValue: 'Grade Level *' })}</Label>
                  <Input
                    id={`gradeLevel-${index}`}
                    value={mapping.gradeLevel}
                    onChange={(e) => updateMapping(index, 'gradeLevel', e.target.value)}
                    placeholder={t('gradeLevelPlaceholder', { defaultValue: 'e.g., Grade 2' })}
                    disabled={disabled}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">{t('performanceLevelsLabel', { defaultValue: 'Performance Levels (Select all that apply)' })}</Label>

                  <div className="space-y-2 border rounded-md p-3 bg-muted/40">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapping.independent === 'Yes'}
                        onChange={(e) => updateMapping(index, 'independent', e.target.checked ? 'Yes' : '')}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">{t('independentLevel', { defaultValue: 'Independent Level' })}</span>
                    </label>
                  </div>

                  <div className="space-y-2 border rounded-md p-3 bg-muted/40">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapping.instructional === 'Yes'}
                        onChange={(e) => updateMapping(index, 'instructional', e.target.checked ? 'Yes' : '')}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">{t('instructionalLevel', { defaultValue: 'Instructional Level' })}</span>
                    </label>
                  </div>

                  <div className="space-y-2 border rounded-md p-3 bg-muted/40">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapping.frustration === 'Yes'}
                        onChange={(e) => updateMapping(index, 'frustration', e.target.checked ? 'Yes' : '')}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">{t('frustrationLevel', { defaultValue: 'Frustration Level' })}</span>
                    </label>
                  </div>
                </div>

                {showSummaryNote && (
                  <div>
                    <Label htmlFor={`summaryNote-${index}`}>{t('summaryNoteOptional', { defaultValue: 'Summary Note (Optional)' })}</Label>
                    <Textarea
                      id={`summaryNote-${index}`}
                      value={mapping.summaryNote || ''}
                      onChange={(e) => updateMapping(index, 'summaryNote', e.target.value)}
                      placeholder={t('summaryNotePlaceholder', { defaultValue: 'Additional observations for this grade level...' })}
                      disabled={disabled}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
