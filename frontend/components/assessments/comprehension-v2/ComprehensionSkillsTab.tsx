'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Rating = 'Yes' | 'Partial' | 'No' | '';

interface SkillItem {
  label: string;
  key: string;
  gradeMin?: number; // grade gating
}

interface Props {
  data: Record<string, Rating>;
  onChange: (d: Record<string, Rating>) => void;
  disabled?: boolean;
  studentGrade?: string; // e.g. "Grade 5"
}

const LITERAL_ITEMS: SkillItem[] = [
  { key: 'identifiesCharacters', label: 'Identifies characters' },
  { key: 'identifiesSetting', label: 'Identifies setting' },
  { key: 'recallsFacts', label: 'Recalls facts' },
  { key: 'answersWHQuestions', label: 'Answers WH questions' },
  { key: 'sequencesEvents', label: 'Sequences events' },
];

const INFERENTIAL_ITEMS: SkillItem[] = [
  { key: 'predictsOutcomes', label: 'Predicts outcomes' },
  { key: 'infersMeaning', label: 'Infers meaning' },
  { key: 'drawsConclusions', label: 'Draws conclusions' },
  { key: 'understandsImplied', label: 'Understands implied information' },
];

const VOCABULARY_ITEMS: SkillItem[] = [
  { key: 'understandsNewWords', label: 'Understands new words' },
  { key: 'usesContextClues', label: 'Uses context clues' },
  { key: 'understandsMultipleMeaning', label: 'Understands multiple-meaning words' },
];

const CRITICAL_ITEMS: SkillItem[] = [
  { key: 'mainIdea', label: 'Main idea' },
  { key: 'supportingDetails', label: 'Supporting details' },
  { key: 'causeAndEffect', label: 'Cause and effect' },
  { key: 'compareContrast', label: 'Compare and contrast' },
  { key: 'factVsOpinion', label: 'Fact vs Opinion' },
  { key: 'authorsPurpose', label: "Author's purpose", gradeMin: 4 },
  { key: 'theme', label: 'Theme', gradeMin: 4 },
  { key: 'pointOfView', label: 'Point of View', gradeMin: 5 },
];

const RATING_OPTIONS: Rating[] = ['Yes', 'Partial', 'No'];

function parseGrade(grade?: string): number {
  if (!grade) return 0;
  const m = grade.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

function SkillRow({ item, value, onChange, disabled }: {
  item: SkillItem;
  value: Rating;
  onChange: (v: Rating) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <Label className="text-sm flex-1">{item.label}</Label>
      <div className="flex gap-3">
        {RATING_OPTIONS.map((r) => (
          <label key={r} className="flex items-center gap-1 cursor-pointer text-sm">
            <input
              type="radio"
              checked={value === r}
              onChange={() => onChange(r)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            {r}
          </label>
        ))}
      </div>
    </div>
  );
}

function SkillSection({ title, items, data, onChange, disabled, gradeNum }: {
  title: string;
  items: SkillItem[];
  data: Record<string, Rating>;
  onChange: (d: Record<string, Rating>) => void;
  disabled?: boolean;
  gradeNum: number;
}) {
  const visible = items.filter((i) => !i.gradeMin || gradeNum >= i.gradeMin);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {visible.map((item) => (
          <SkillRow
            key={item.key}
            item={item}
            value={(data[item.key] as Rating) || ''}
            onChange={(v) => onChange({ ...data, [item.key]: v })}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export function ComprehensionSkillsTab({ data, onChange, disabled, studentGrade }: Props) {
  const gradeNum = parseGrade(studentGrade);

  return (
    <div className="space-y-4">
      <SkillSection title="A. Literal Comprehension" items={LITERAL_ITEMS} data={data} onChange={onChange} disabled={disabled} gradeNum={gradeNum} />
      <SkillSection title="B. Inferential Comprehension" items={INFERENTIAL_ITEMS} data={data} onChange={onChange} disabled={disabled} gradeNum={gradeNum} />
      <SkillSection title="C. Vocabulary in Context" items={VOCABULARY_ITEMS} data={data} onChange={onChange} disabled={disabled} gradeNum={gradeNum} />
      <SkillSection title="D. Critical Thinking" items={CRITICAL_ITEMS} data={data} onChange={onChange} disabled={disabled} gradeNum={gradeNum} />
    </div>
  );
}
