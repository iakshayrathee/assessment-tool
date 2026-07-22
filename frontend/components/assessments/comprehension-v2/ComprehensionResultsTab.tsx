'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Rating = 'Yes' | 'Partial' | 'No' | '';

const RATING_SCORE: Record<string, number> = { Yes: 1, Partial: 0.5, No: 0 };

const LITERAL_KEYS = ['identifiesCharacters','identifiesSetting','recallsFacts','answersWHQuestions','sequencesEvents'];
const INFERENTIAL_KEYS = ['predictsOutcomes','infersMeaning','drawsConclusions','understandsImplied'];
const VOCABULARY_KEYS = ['understandsNewWords','usesContextClues','understandsMultipleMeaning'];
const CRITICAL_KEYS = ['mainIdea','supportingDetails','causeAndEffect','compareContrast','factVsOpinion','authorsPurpose','theme','pointOfView'];

function scoreGroup(skills: Record<string, Rating>, keys: string[]): number {
  const presentKeys = keys.filter((k) => skills[k] !== undefined && skills[k] !== '');
  if (presentKeys.length === 0) return 0;
  const total = presentKeys.reduce((sum, k) => sum + (RATING_SCORE[skills[k]] ?? 0), 0);
  return Math.round((total / presentKeys.length) * 100);
}

function overallScore(scores: Record<string, number>): number {
  const weights: Record<string, number> = { literal: 0.25, inferential: 0.3, vocabulary: 0.2, critical: 0.25 };
  let weighted = 0;
  for (const [k, w] of Object.entries(weights)) {
    weighted += (scores[k] ?? 0) * w;
  }
  return Math.round(weighted);
}

function functionalLevel(score: number): string {
  if (score >= 80) return 'Advanced';
  if (score >= 65) return 'Proficient';
  if (score >= 50) return 'Developing';
  if (score >= 35) return 'Emerging';
  return 'Needs Support';
}

function levelColor(level: string): string {
  switch (level) {
    case 'Advanced': return 'bg-green-100 text-green-800 border-green-300';
    case 'Proficient': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Developing': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Emerging': return 'bg-orange-100 text-orange-800 border-orange-300';
    default: return 'bg-red-100 text-red-800 border-red-300';
  }
}

interface Props {
  skills: Record<string, Rating>;
  onResultsChange?: (r: any) => void;
}

export function ComprehensionResultsTab({ skills, onResultsChange }: Props) {
  const scores = useMemo(() => {
    const literal = scoreGroup(skills, LITERAL_KEYS);
    const inferential = scoreGroup(skills, INFERENTIAL_KEYS);
    const vocabulary = scoreGroup(skills, VOCABULARY_KEYS);
    const critical = scoreGroup(skills, CRITICAL_KEYS);
    const overall = overallScore({ literal, inferential, vocabulary, critical });
    const level = functionalLevel(overall);
    const results = { literal, inferential, vocabulary, critical, overall, functionalLevel: level };
    onResultsChange?.(results);
    return results;
  }, [skills]);

  const rows = [
    { label: 'Literal Comprehension', score: scores.literal },
    { label: 'Inferential Comprehension', score: scores.inferential },
    { label: 'Vocabulary in Context', score: scores.vocabulary },
    { label: 'Critical Thinking', score: scores.critical },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comprehension Results (Auto-Computed)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Derived from Tab 3 ratings. Scores reflect percentage of items rated Yes/Partial.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rows.map(({ label, score }) => (
              <div key={label} className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${
                  score >= 65 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
                }`}>{score}%</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Overall Comprehension Score</p>
              <p className="text-5xl font-bold text-primary">{scores.overall}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Functional Comprehension Level</p>
              <Badge className={`text-base px-4 py-1.5 ${levelColor(scores.functionalLevel)}`}>
                {scores.functionalLevel}
              </Badge>
            </div>
          </div>

          {/* Level bands guide */}
          <div className="grid grid-cols-5 gap-2 text-xs text-center">
            {['Advanced (≥80%)', 'Proficient (65–79%)', 'Developing (50–64%)', 'Emerging (35–49%)', 'Needs Support (<35%)'].map((b) => (
              <div key={b} className="rounded border p-1.5 text-muted-foreground">{b}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
