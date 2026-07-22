'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface GradeAttempt {
  grade: string;
  result: 'MASTERED' | 'NOT_MASTERED';
  totalScore: number;
  savedAt: string;
}

interface Props {
  attempts: GradeAttempt[];
  currentGrade?: string;
}

export function AttemptHistoryPanel({ attempts, currentGrade }: Props) {
  const { t } = useTranslation('assessments');

  if (attempts.length === 0 && !currentGrade) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t('readingAttempts', { defaultValue: 'Reading Attempts' })}
      </p>
      {attempts.map((a, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
        >
          <span className="font-medium">{a.grade}</span>
          {a.result === 'MASTERED' ? (
            <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t('mastered', { defaultValue: 'Mastered' })}
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1 text-amber-700 bg-amber-50 border-amber-300">
              <XCircle className="h-3 w-3" />
              {t('notMastered', { defaultValue: 'Not Mastered' })}
            </Badge>
          )}
        </div>
      ))}
      {currentGrade && (
        <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{currentGrade}</span>
          <Badge variant="outline" className="text-primary border-primary/40">
            {t('inProgress', { defaultValue: 'In Progress' })}
          </Badge>
        </div>
      )}
    </div>
  );
}
