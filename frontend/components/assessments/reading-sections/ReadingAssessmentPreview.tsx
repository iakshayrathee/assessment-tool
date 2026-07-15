'use client';

import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  savedAssessment: any;
  studentDetails: any;
  educatorDetails: any;
}

export function ReadingAssessmentPreview({ data, savedAssessment, studentDetails, educatorDetails }: Props) {
  const { t } = useTranslation(['assessments', 'iep', 'educator']);
  const comp = data.comprehension || {};
  const errors = data.errorAnalysis || {};
  const strengths = data.strengths || {};
  const redFlags = data.redFlags || {};
  const insights = data.aiInsights || {};
  const progress = data.progressTracking || {};
  const resources = data.readingResources || {};

  const getStrengthLabel = (key: string) => {
    const map: Record<string, string> = {
      strongPhonics: t('strongPhonics', { defaultValue: 'Strong Phonics' }),
      goodMemory: t('goodMemory', { defaultValue: 'Good Memory' }),
      goodComprehension: t('goodComprehension', { defaultValue: 'Good Comprehension' }),
      expressiveReading: t('expressiveReading', { defaultValue: 'Expressive Reading' }),
      visualLearner: t('visualLearner', { defaultValue: 'Visual Learner' }),
      auditoryLearner: t('auditoryLearner', { defaultValue: 'Auditory Learner' }),
      goodVocabulary: t('goodVocabulary', { defaultValue: 'Good Vocabulary' }),
      strongOralLanguage: t('strongOralLanguage', { defaultValue: 'Strong Oral Language' }),
      motivatedReader: t('motivatedReader', { defaultValue: 'Motivated Reader' }),
      goodAttentionSpan: t('goodAttentionSpan', { defaultValue: 'Good Attention Span' }),
    };
    return map[key] || key;
  };

  const classifyLevel = (accuracy: number | undefined | null): string | null => {
    if (accuracy === undefined || accuracy === null) return null;
    if (accuracy >= 90) return 'Independent';
    if (accuracy >= 75) return 'Instructional';
    return 'Frustration';
  };

  const getLevelDisplayLabel = (level: string | null) => {
    if (!level) return '';
    const map: Record<string, string> = {
      'Independent': t('levelIndependent', { defaultValue: 'Independent' }),
      'Instructional': t('levelInstructional', { defaultValue: 'Instructional' }),
      'Frustration': t('levelFrustration', { defaultValue: 'Frustration' })
    };
    return map[level] || level;
  };

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-primary border-b pb-1">{title}</h3>
        <div className="text-sm space-y-1">{children}</div>
      </div>
    );
  }

  function Field({ label, value }: { label: string; value: any }) {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="flex gap-2">
        <span className="font-medium min-w-[160px]">{label}:</span>
        <span>{typeof value === 'boolean' ? (value ? t('yes', { defaultValue: 'Yes' }) : t('no', { defaultValue: 'No' })) : String(value)}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary">{t('readingSkillReportTitle', { defaultValue: 'Reading Skill Assessment Report' })}</h2>
        <p className="text-muted-foreground">{t('assessmentDatePreview', { defaultValue: 'Assessment Date: {{date}}', date: data.assessmentDate || new Date().toLocaleDateString() })}</p>
      </div>

      {/* Student & Educator Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded text-sm">
          <h4 className="font-semibold text-primary mb-1">{t('student', { ns: 'educator' })}</h4>
          <p>{t('fullNameLabel', { defaultValue: 'Name' })}: {studentDetails?.fullName || 'N/A'}</p>
          <p>{t('gradeLabel', { defaultValue: 'Grade' })}: {studentDetails?.grade || 'N/A'}</p>
          {studentDetails?.age && <p>{t('ageLabel', { defaultValue: 'Age' })}: {studentDetails.age}</p>}
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded text-sm">
          <h4 className="font-semibold mb-1">{t('educator', { ns: 'educator' })}</h4>
          <p>{t('fullNameLabel', { defaultValue: 'Name' })}: {educatorDetails?.fullName || 'N/A'}</p>
          <p>{t('dateLabel', { defaultValue: 'Date' })}: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Computed Scores Summary */}
      {savedAssessment?.overallReadingScore !== undefined && (
        <div className="mb-6 p-4 bg-primary/5 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">{t('scoreSummary', { defaultValue: 'Score Summary' })}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              { label: t('decoding', { defaultValue: 'Decoding' }), value: savedAssessment.decodingScore },
              { label: t('fluency', { defaultValue: 'Fluency' }), value: savedAssessment.fluencyScore },
              { label: t('comprehension', { defaultValue: 'Comprehension' }), value: savedAssessment.comprehensionScore },
              { label: t('behavior', { defaultValue: 'Behavior' }), value: savedAssessment.behaviorScore },
              { label: t('overall', { defaultValue: 'Overall' }), value: savedAssessment.overallReadingScore },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 bg-background rounded border">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-xl font-bold ${
                  value >= 75 ? 'text-green-600' : value >= 50 ? 'text-orange-600' : 'text-red-600'
                }`}>{value ?? '—'}</p>
              </div>
            ))}
          </div>
          {savedAssessment.tier && (
            <p className="text-sm mt-2 text-center">
              <span className="font-medium">{t('tier', { defaultValue: 'Tier' })}:</span> {savedAssessment.tier} |{' '}
              <span className="font-medium">{t('level', { defaultValue: 'Level' })}:</span> {getLevelDisplayLabel(savedAssessment.finalReadingLevel) || 'N/A'}
              {savedAssessment.ldRiskFlag && (
                <span className="text-red-600 ml-2">⚠ {t('ldRisk', { defaultValue: 'LD Risk' })}: {savedAssessment.ldRiskDetails}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <Section title={t('previewSection1Title', { defaultValue: '1. Basic Info' })}>
        <Field label={t('mediumOfInstruction', { defaultValue: 'Medium of Instruction' })} value={data.mediumOfInstruction} />
        <Field label={t('firstLanguage', { defaultValue: 'First Language' })} value={data.firstLanguage} />
        <Field label={t('parentConcern', { defaultValue: 'Reading Observations (from Parent)' })} value={data.parentConcern} />
      </Section>

      {/* Section 2: Reading Context */}
      <Section title={t('previewSection2Title', { defaultValue: '2. Reading Context' })}>
        <Field label={t('readingExposureAtHome', { defaultValue: 'Reading Exposure at Home' })} value={data.readingExposureAtHome} />
        <Field label={t('readingSupportAtHome', { defaultValue: 'Reading Support at Home' })} value={data.readingSupportAtHome} />
        {data.readingSupportDetails && <Field label={t('supportDetails', { defaultValue: 'Support Details' })} value={data.readingSupportDetails} />}
        <Field label={t('typeOfSchooling', { defaultValue: 'Type of Schooling' })} value={data.typeOfSchooling} />
        <Field label={t('languageMismatch', { defaultValue: 'Language Mismatch' })} value={data.languageMismatch} />
        <Field label={t('previousIntervention', { defaultValue: 'Previous Intervention' })} value={data.previousIntervention} />
        {data.previousInterventionType && <Field label={t('interventionType', { defaultValue: 'Intervention Type' })} value={data.previousInterventionType} />}
      </Section>

      {/* Section 3: Resources */}
      {Object.keys(resources).length > 0 && (
        <Section title={t('previewSection3Title', { defaultValue: '3. Reading Resources' })}>
          {resources.knownText?.accuracyPercent !== undefined && (
            <Field label={t('knownTextAccuracyLabel', { defaultValue: 'Known Text Accuracy' })} value={`${resources.knownText.accuracyPercent}%`} />
          )}
          {resources.unknownText?.accuracyPercent !== undefined && (
            <Field label={t('unknownTextAccuracyLabel', { defaultValue: 'Unknown Text Accuracy' })} value={`${resources.unknownText.accuracyPercent}%`} />
          )}
          {resources.schoolText?.difficulty && (
            <Field label={t('schoolTextDifficultyLabel', { defaultValue: 'School Text Difficulty' })} value={resources.schoolText.difficulty} />
          )}
        </Section>
      )}

      {/* Section 4: Behavior */}
      <Section title={t('previewSection4Title', { defaultValue: '4. Reading Behavior' })}>
        <Field label={t('interestInReading', { defaultValue: 'Interest in Reading' })} value={data.interestInReading ? `${data.interestInReading}/5` : undefined} />
        <Field label={t('attentionSpan', { defaultValue: 'Attention Span' })} value={data.attentionSpanMinutes ? `${data.attentionSpanMinutes} min` : undefined} />
        <Field label={t('readingStamina', { defaultValue: 'Reading Stamina' })} value={data.readingStamina ? `${data.readingStamina}/5` : undefined} />
        <Field label={t('frustrationTolerance', { defaultValue: 'Frustration Tolerance' })} value={data.frustrationTolerance ? `${data.frustrationTolerance}/5` : undefined} />
        <Field label={t('confidenceLevel', { defaultValue: 'Confidence Level' })} value={data.confidenceLevel ? `${data.confidenceLevel}/5` : undefined} />
        <Field label={t('emotionalResponse', { defaultValue: 'Emotional Response' })} value={data.emotionalResponse} />
        <Field label={t('motivation', { defaultValue: 'Motivation' })} value={data.motivation} />
        <Field label={t('taskAvoidance', { defaultValue: 'Task Avoidance' })} value={data.taskAvoidance} />
        <Field label={t('selfCorrectionAbility', { defaultValue: 'Self-Correction' })} value={data.selfCorrectionAbility} />
        <Field label={t('promptDependency', { defaultValue: 'Prompt Dependency' })} value={data.promptDependency} />
      </Section>

      {/* Section 5: Core Skills */}
      <Section title={t('previewSection5Title', { defaultValue: '5. Core Reading Skills' })}>
        <Field label={t('wordsPerMinute', { defaultValue: 'Words Per Minute' })} value={data.wordsPerMinute} />
        <Field label={t('fluencyAccuracy', { defaultValue: 'Fluency Accuracy' })} value={data.fluencyAccuracy ? `${data.fluencyAccuracy}%` : undefined} />
        <Field label={t('sightWords', { defaultValue: 'Sight Words' })} value={data.sightWordsPercent ? `${data.sightWordsPercent}%` : undefined} />
        <Field label={t('expression', { defaultValue: 'Expression' })} value={data.readingExpression} />
        <Field label={t('pausing', { defaultValue: 'Pausing' })} value={data.pausingCorrectness} />
      </Section>

      {/* Section 6: Comprehension */}
      {Object.keys(comp).length > 0 && (
        <Section title={t('previewSection6Title', { defaultValue: '6. Comprehension' })}>
          {comp.literal?.recallFacts !== undefined && <Field label={t('recallFacts', { defaultValue: 'Recall Facts' })} value={`${comp.literal.recallFacts}/5`} />}
          {comp.inferential?.prediction !== undefined && <Field label={t('prediction', { defaultValue: 'Prediction' })} value={`${comp.inferential.prediction}/5`} />}
          {comp.critical?.opinionFormation !== undefined && <Field label={t('opinionFormation', { defaultValue: 'Opinion Formation' })} value={`${comp.critical.opinionFormation}/5`} />}
          {comp.retelling?.sequencing && <Field label={t('sequencing', { defaultValue: 'Sequencing' })} value={comp.retelling.sequencing} />}
        </Section>
      )}

      {/* Section 7: Error Analysis */}
      {errors.dominantErrorType && (
        <Section title={t('previewSection7Title', { defaultValue: '7. Error Analysis' })}>
          <Field label={t('dominantError', { defaultValue: 'Dominant Error' })} value={errors.dominantErrorType} />
          <Field label={t('averageFrequency', { defaultValue: 'Average Frequency' })} value={errors.errorFrequencyPercent ? `${errors.errorFrequencyPercent}%` : undefined} />
        </Section>
      )}

      {/* Section 8: Strengths */}
      {strengths.selected?.length > 0 && (
        <Section title={t('previewSection8Title', { defaultValue: '8. Strengths' })}>
          <div className="flex flex-wrap gap-2">
            {strengths.selected.map((s: string) => (
              <span key={s} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                {getStrengthLabel(s)}
              </span>
            ))}
          </div>
          {strengths.educatorNotes && <p className="mt-2 italic">{strengths.educatorNotes}</p>}
        </Section>
      )}

      {/* Section 9: Challenges */}
      {data.primaryChallenge && (
        <Section title={t('previewSection9Title', { defaultValue: '9. Challenges' })}>
          <Field label={t('primary', { defaultValue: 'Primary' })} value={data.primaryChallenge} />
          <Field label={t('secondary', { defaultValue: 'Secondary' })} value={data.secondaryChallenge} />
          <Field label={t('severity', { defaultValue: 'Severity' })} value={data.challengeSeverity} />
        </Section>
      )}

      {/* Section 10: Red Flags */}
      {(redFlags.attentionIssues || redFlags.languageProcessingIssues || redFlags.avoidanceBehavior || redFlags.custom?.length > 0) && (
        <Section title={t('previewSection10Title', { defaultValue: '10. Red Flags' })}>
          {redFlags.attentionIssues && <p className="text-red-600">⚠ {t('attentionIssuesLabel', { defaultValue: 'Attention Issues' })}</p>}
          {redFlags.languageProcessingIssues && <p className="text-red-600">⚠ {t('langProcessingIssuesLabel', { defaultValue: 'Language Processing Issues' })}</p>}
          {redFlags.avoidanceBehavior && <p className="text-red-600">⚠ {t('avoidanceBehaviorLabel', { defaultValue: 'Avoidance Behavior' })}</p>}
          {redFlags.custom?.map((f: string, i: number) => <p key={i} className="text-red-600">⚠ {f}</p>)}
        </Section>
      )}

      {/* Section 11-12: Level & Grade */}
      <Section title={t('previewSection11_12Title', { defaultValue: '11-12. Level Classification & Grade Mapping' })}>
        <Field label={t('knownTextLevelLabel', { defaultValue: 'Known Text Level' })} value={getLevelDisplayLabel(classifyLevel(data.knownTextAccuracy))} />
        <Field label={t('unknownTextLevelLabel', { defaultValue: 'Unknown Text Level' })} value={getLevelDisplayLabel(classifyLevel(data.unknownTextAccuracy))} />
        <Field label={t('finalReadingLevelLabel', { defaultValue: 'Final Reading Level' })} value={getLevelDisplayLabel(classifyLevel(data.unknownTextAccuracy) || classifyLevel(data.knownTextAccuracy))} />
        <Field label={t('currentGradeLabel', { defaultValue: 'Current Grade' })} value={data.currentGrade} />
        <Field label={t('readingGradeLevelLabel', { defaultValue: 'Reading Grade Level' })} value={data.readingGradeLevel} />
        <Field label={t('gapLabel', { defaultValue: 'Gap' })} value={data.gradeGap} />
      </Section>

      {/* Section 13: AI Insights */}
      {insights.diagnosisSummary && (
        <Section title={t('previewSection13Title', { defaultValue: '13. AI Insights & Plan' })}>
          <Field label={t('diagnosisLabel', { defaultValue: 'Diagnosis' })} value={insights.diagnosisSummary} />
          <Field label={t('recommendationsLabel', { defaultValue: 'Recommendations' })} value={insights.recommendations} />
          <Field label={t('strategiesLabel', { defaultValue: 'Strategies' })} value={insights.instructionalStrategies} />
          {insights.interventions?.programType && <Field label={t('programLabel', { defaultValue: 'Program' })} value={insights.interventions.programType} />}
          {insights.interventions?.frequency && <Field label={t('frequencyLabel', { defaultValue: 'Frequency' })} value={insights.interventions.frequency} />}
        </Section>
      )}

      {/* Section 14: Progress */}
      {(progress.baselineScore !== undefined || progress.currentScore !== undefined) && (
        <Section title={t('previewSection14Title', { defaultValue: '14. Progress Tracking' })}>
          <Field label={t('baselineScoreLabel', { defaultValue: 'Baseline Score' })} value={progress.baselineScore} />
          <Field label={t('currentScoreLabel', { defaultValue: 'Current Score' })} value={progress.currentScore} />
          <Field label={t('improvementLabel', { defaultValue: 'Improvement' })} value={progress.improvementPercent !== undefined ? `${progress.improvementPercent}%` : undefined} />
          <Field label={t('sessionsCompletedLabel', { defaultValue: 'Sessions Completed' })} value={progress.sessionsCompleted} />
          <Field label={t('reassessmentDateLabel', { defaultValue: 'Reassessment Date' })} value={progress.reassessmentDate} />
        </Section>
      )}
    </div>
  );
}
