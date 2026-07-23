'use client';

import { GradeBasedFlow } from './GradeBasedFlow';
import type { TextSectionData } from './GradeTextSections';
import type { GradeAttempt } from '@/components/assessments/shared/AttemptHistoryPanel';

interface Props {
  studentGrade?: string;
  attempts: GradeAttempt[];
  onAttemptsChange: (a: GradeAttempt[]) => void;
  functionalGradeLevel?: string;
  onFunctionalGradeChange: (g: string) => void;
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

export function ReadingSkillTab({
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
  return (
    <GradeBasedFlow
      studentGrade={studentGrade}
      attempts={attempts}
      onAttemptsChange={onAttemptsChange}
      functionalGradeLevel={functionalGradeLevel}
      onFunctionalGradeChange={onFunctionalGradeChange}
      schoolText={schoolText}
      knownText={knownText}
      unknownText={unknownText}
      onSchoolTextChange={onSchoolTextChange}
      onKnownTextChange={onKnownTextChange}
      onUnknownTextChange={onUnknownTextChange}
      onSave={onSave}
      onFinish={onFinish}
      disabled={disabled}
      isSaving={isSaving}
    />
  );
}
