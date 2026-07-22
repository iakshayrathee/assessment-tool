'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AttemptHistoryPanel, GradeAttempt } from '@/components/assessments/shared/AttemptHistoryPanel';
import { GradeTextSection, TextSectionData } from './GradeTextSections';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Scoring weights: School 20%, Known 30%, Unknown 50%
const MASTERY_THRESHOLD = 60; // percent

function computeTotalScore(school: TextSectionData, known: TextSectionData, unknown: TextSectionData): number {
  const s = school.sectionScore ?? 0;
  const k = known.sectionScore ?? 0;
  const u = unknown.sectionScore ?? 0;
  let score = s * 0.2 + k * 0.3 + u * 0.5;
  // Penalty if unknown << known
  if (u < k - 20) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function gradeToNumber(grade: string): number {
  const m = grade.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}

function numberToGrade(n: number): string {
  if (n <= 0) return 'Pre-K';
  return `Grade ${n}`;
}

interface Props {
  studentGrade?: string;
  attempts: GradeAttempt[];
  onAttemptsChange: (attempts: GradeAttempt[]) => void;
  functionalGradeLevel?: string;
  onFunctionalGradeChange: (grade: string) => void;
  schoolText: TextSectionData;
  knownText: TextSectionData;
  unknownText: TextSectionData;
  onSchoolTextChange: (d: TextSectionData) => void;
  onKnownTextChange: (d: TextSectionData) => void;
  onUnknownTextChange: (d: TextSectionData) => void;
  onSave: () => Promise<void>;
  onFinish: () => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
}

export function GradeBasedFlow({
  studentGrade,
  attempts,
  onAttemptsChange,
  functionalGradeLevel,
  onFunctionalGradeChange,
  schoolText,
  knownText,
  unknownText,
  onSchoolTextChange,
  onKnownTextChange,
  onUnknownTextChange,
  onSave,
  onFinish,
  disabled,
  isSaving,
}: Props) {
  const { t } = useTranslation('assessments');

  const startGradeNum = gradeToNumber(studentGrade || 'Grade 3');
  const [currentGradeNum, setCurrentGradeNum] = useState<number>(() => {
    // Resume from last non-mastered attempt
    if (attempts.length > 0) {
      const last = attempts[attempts.length - 1];
      if (last.result === 'NOT_MASTERED') {
        return Math.max(1, gradeToNumber(last.grade) - 1);
      }
      return gradeToNumber(last.grade);
    }
    return startGradeNum;
  });

  const [lastResult, setLastResult] = useState<'MASTERED' | 'NOT_MASTERED' | null>(() => {
    if (attempts.length > 0) return attempts[attempts.length - 1].result;
    return null;
  });

  const totalScore = computeTotalScore(schoolText, knownText, unknownText);
  const currentGradeLabel = numberToGrade(currentGradeNum);

  const handleSaveAndEvaluate = async () => {
    await onSave();

    const result: 'MASTERED' | 'NOT_MASTERED' = totalScore >= MASTERY_THRESHOLD ? 'MASTERED' : 'NOT_MASTERED';

    const attempt: GradeAttempt = {
      grade: currentGradeLabel,
      result,
      totalScore,
      savedAt: new Date().toISOString(),
    };

    onAttemptsChange([...attempts, attempt]);
    setLastResult(result);

    if (result === 'MASTERED') {
      onFunctionalGradeChange(currentGradeLabel);
    }
  };

  const handleAssessLower = () => {
    const next = Math.max(1, currentGradeNum - 1);
    setCurrentGradeNum(next);
    setLastResult(null);
    // Reset text sections for new grade
    onSchoolTextChange({});
    onKnownTextChange({});
    onUnknownTextChange({});
  };

  const mastered = lastResult === 'MASTERED';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: History Panel */}
      <div className="lg:col-span-1 space-y-4">
        <AttemptHistoryPanel
          attempts={attempts}
          currentGrade={lastResult === null ? currentGradeLabel : undefined}
        />

        {mastered && functionalGradeLevel && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-4 space-y-1">
              <p className="text-xs font-semibold text-green-700 uppercase">
                {t('functionalReadingLevel', { defaultValue: 'Functional Reading Level' })}
              </p>
              <p className="text-lg font-bold text-green-800">{functionalGradeLevel}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Assessment Form */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {t('currentAssessmentGrade', { defaultValue: 'Current Assessment: {{grade}}', grade: currentGradeLabel })}
            </CardTitle>
          </CardHeader>
        </Card>

        <GradeTextSection
          prefix="A"
          title={t('schoolTextTitle', { defaultValue: 'School Text (Curriculum-Based)' })}
          data={schoolText}
          onChange={onSchoolTextChange}
          disabled={disabled || !!lastResult}
        />
        <GradeTextSection
          prefix="B"
          title={t('knownTextTitle', { defaultValue: 'Known Text (Familiar Reading)' })}
          data={knownText}
          onChange={onKnownTextChange}
          disabled={disabled || !!lastResult}
        />
        <GradeTextSection
          prefix="C"
          title={t('unknownTextTitle', { defaultValue: 'Unknown Text (Unfamiliar Reading)' })}
          data={unknownText}
          onChange={onUnknownTextChange}
          disabled={disabled || !!lastResult}
        />

        {/* Overall Score Summary */}
        <Card className="border-muted">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-6 text-sm">
                <span><span className="text-muted-foreground">School: </span><strong>{schoolText.sectionScore?.toFixed(1) ?? '—'}</strong></span>
                <span><span className="text-muted-foreground">Known: </span><strong>{knownText.sectionScore?.toFixed(1) ?? '—'}</strong></span>
                <span><span className="text-muted-foreground">Unknown: </span><strong>{unknownText.sectionScore?.toFixed(1) ?? '—'}</strong></span>
                <span><span className="text-muted-foreground">Total: </span><strong className="text-primary">{totalScore.toFixed(1)}</strong></span>
              </div>

              {!lastResult && !disabled && (
                <Button onClick={handleSaveAndEvaluate} disabled={isSaving}>
                  {isSaving ? t('savingAssessment', { defaultValue: 'Saving...' }) : t('saveAssessmentGrade', { defaultValue: 'Save Assessment' })}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Result Banner */}
        {lastResult === 'NOT_MASTERED' && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-300 text-sm px-3 py-1">
                  {t('notMastered', { defaultValue: 'Not Mastered' })} — {currentGradeLabel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t('scoreWas', { defaultValue: 'Score: {{score}}%', score: totalScore.toFixed(1) })}
                </span>
              </div>
              {!disabled && currentGradeNum > 1 && (
                <Button variant="outline" onClick={handleAssessLower} className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4" />
                  {t('assessGradeLower', { defaultValue: 'Assess {{grade}}', grade: numberToGrade(currentGradeNum - 1) })}
                </Button>
              )}
              {currentGradeNum <= 1 && (
                <p className="text-sm text-amber-700">
                  {t('lowestGradeReached', { defaultValue: 'Lowest grade reached. Please use Skill-Based Assessment.' })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {mastered && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <Badge className="bg-green-100 text-green-700 border-green-300 text-sm px-3 py-1">
                  {t('mastered', { defaultValue: 'Mastered' })} — {currentGradeLabel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t('scoreWas', { defaultValue: 'Score: {{score}}%', score: totalScore.toFixed(1) })}
                </span>
              </div>
              <p className="text-sm font-medium text-green-800">
                {t('functionalReadingLevelIs', { defaultValue: 'Functional Reading Level: {{grade}}', grade: functionalGradeLevel })}
              </p>
              {!disabled && (
                <Button onClick={onFinish} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  {t('finishAssessment', { defaultValue: 'Finish Assessment' })}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
