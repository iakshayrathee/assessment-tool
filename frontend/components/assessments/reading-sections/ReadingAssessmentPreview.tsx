'use client';

import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  savedAssessment: any;
  studentDetails: any;
  educatorDetails: any;
}

const STRENGTH_LABELS: Record<string, string> = {
  strongPhonics: 'Strong Phonics', goodMemory: 'Good Memory', goodComprehension: 'Good Comprehension',
  expressiveReading: 'Expressive Reading', visualLearner: 'Visual Learner', auditoryLearner: 'Auditory Learner',
  goodVocabulary: 'Good Vocabulary', strongOralLanguage: 'Strong Oral Language',
  motivatedReader: 'Motivated Reader', goodAttentionSpan: 'Good Attention Span',
};

function classifyLevel(accuracy: number | undefined | null): string | null {
  if (accuracy === undefined || accuracy === null) return null;
  if (accuracy >= 90) return 'Independent';
  if (accuracy >= 75) return 'Instructional';
  return 'Frustration';
}

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
      <span>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</span>
    </div>
  );
}

export function ReadingAssessmentPreview({ data, savedAssessment, studentDetails, educatorDetails }: Props) {
  const comp = data.comprehension || {};
  const errors = data.errorAnalysis || {};
  const strengths = data.strengths || {};
  const redFlags = data.redFlags || {};
  const insights = data.aiInsights || {};
  const progress = data.progressTracking || {};
  const resources = data.readingResources || {};

  return (
    <div className="p-6 bg-background">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Reading Skill Assessment Report</h2>
        <p className="text-muted-foreground">Assessment Date: {data.assessmentDate || new Date().toLocaleDateString()}</p>
      </div>

      {/* Student & Educator Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded text-sm">
          <h4 className="font-semibold text-primary mb-1">Student</h4>
          <p>Name: {studentDetails?.fullName || 'N/A'}</p>
          <p>Grade: {studentDetails?.grade || 'N/A'}</p>
          {studentDetails?.age && <p>Age: {studentDetails.age}</p>}
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded text-sm">
          <h4 className="font-semibold mb-1">Educator</h4>
          <p>Name: {educatorDetails?.fullName || 'N/A'}</p>
          <p>Date: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Computed Scores Summary */}
      {savedAssessment?.overallReadingScore !== undefined && (
        <div className="mb-6 p-4 bg-primary/5 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Score Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              { label: 'Decoding', value: savedAssessment.decodingScore },
              { label: 'Fluency', value: savedAssessment.fluencyScore },
              { label: 'Comprehension', value: savedAssessment.comprehensionScore },
              { label: 'Behavior', value: savedAssessment.behaviorScore },
              { label: 'Overall', value: savedAssessment.overallReadingScore },
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
              <span className="font-medium">Tier:</span> {savedAssessment.tier} |{' '}
              <span className="font-medium">Level:</span> {savedAssessment.finalReadingLevel || 'N/A'}
              {savedAssessment.ldRiskFlag && (
                <span className="text-red-600 ml-2">⚠ LD Risk: {savedAssessment.ldRiskDetails}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <Section title="1. Basic Info">
        <Field label="Medium of Instruction" value={data.mediumOfInstruction} />
        <Field label="First Language" value={data.firstLanguage} />
        <Field label="Parent Concern" value={data.parentConcern} />
      </Section>

      {/* Section 2: Reading Context */}
      <Section title="2. Reading Context">
        <Field label="Reading Exposure at Home" value={data.readingExposureAtHome} />
        <Field label="Reading Support at Home" value={data.readingSupportAtHome} />
        {data.readingSupportDetails && <Field label="Support Details" value={data.readingSupportDetails} />}
        <Field label="Type of Schooling" value={data.typeOfSchooling} />
        <Field label="Language Mismatch" value={data.languageMismatch} />
        <Field label="Previous Intervention" value={data.previousIntervention} />
        {data.previousInterventionType && <Field label="Intervention Type" value={data.previousInterventionType} />}
      </Section>

      {/* Section 3: Resources */}
      {Object.keys(resources).length > 0 && (
        <Section title="3. Reading Resources">
          {resources.knownText?.accuracyPercent !== undefined && (
            <Field label="Known Text Accuracy" value={`${resources.knownText.accuracyPercent}%`} />
          )}
          {resources.unknownText?.accuracyPercent !== undefined && (
            <Field label="Unknown Text Accuracy" value={`${resources.unknownText.accuracyPercent}%`} />
          )}
          {resources.schoolText?.difficulty && (
            <Field label="School Text Difficulty" value={resources.schoolText.difficulty} />
          )}
        </Section>
      )}

      {/* Section 4: Behavior */}
      <Section title="4. Reading Behavior">
        <Field label="Interest in Reading" value={data.interestInReading ? `${data.interestInReading}/5` : undefined} />
        <Field label="Attention Span" value={data.attentionSpanMinutes ? `${data.attentionSpanMinutes} min` : undefined} />
        <Field label="Reading Stamina" value={data.readingStamina ? `${data.readingStamina}/5` : undefined} />
        <Field label="Frustration Tolerance" value={data.frustrationTolerance ? `${data.frustrationTolerance}/5` : undefined} />
        <Field label="Confidence Level" value={data.confidenceLevel ? `${data.confidenceLevel}/5` : undefined} />
        <Field label="Emotional Response" value={data.emotionalResponse} />
        <Field label="Motivation" value={data.motivation} />
        <Field label="Task Avoidance" value={data.taskAvoidance} />
        <Field label="Self-Correction" value={data.selfCorrectionAbility} />
        <Field label="Prompt Dependency" value={data.promptDependency} />
      </Section>

      {/* Section 5: Core Skills */}
      <Section title="5. Core Reading Skills">
        <Field label="Words Per Minute" value={data.wordsPerMinute} />
        <Field label="Fluency Accuracy" value={data.fluencyAccuracy ? `${data.fluencyAccuracy}%` : undefined} />
        <Field label="Sight Words" value={data.sightWordsPercent ? `${data.sightWordsPercent}%` : undefined} />
        <Field label="Expression" value={data.readingExpression} />
        <Field label="Pausing" value={data.pausingCorrectness} />
      </Section>

      {/* Section 6: Comprehension */}
      {Object.keys(comp).length > 0 && (
        <Section title="6. Comprehension">
          {comp.literal?.recallFacts !== undefined && <Field label="Recall Facts" value={`${comp.literal.recallFacts}/5`} />}
          {comp.inferential?.prediction !== undefined && <Field label="Prediction" value={`${comp.inferential.prediction}/5`} />}
          {comp.critical?.opinionFormation !== undefined && <Field label="Opinion Formation" value={`${comp.critical.opinionFormation}/5`} />}
          {comp.retelling?.sequencing && <Field label="Sequencing" value={comp.retelling.sequencing} />}
        </Section>
      )}

      {/* Section 7: Error Analysis */}
      {errors.dominantErrorType && (
        <Section title="7. Error Analysis">
          <Field label="Dominant Error" value={errors.dominantErrorType} />
          <Field label="Average Frequency" value={errors.errorFrequencyPercent ? `${errors.errorFrequencyPercent}%` : undefined} />
        </Section>
      )}

      {/* Section 8: Strengths */}
      {strengths.selected?.length > 0 && (
        <Section title="8. Strengths">
          <div className="flex flex-wrap gap-2">
            {strengths.selected.map((s: string) => (
              <span key={s} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                {STRENGTH_LABELS[s] || s}
              </span>
            ))}
          </div>
          {strengths.educatorNotes && <p className="mt-2 italic">{strengths.educatorNotes}</p>}
        </Section>
      )}

      {/* Section 9: Challenges */}
      {data.primaryChallenge && (
        <Section title="9. Challenges">
          <Field label="Primary" value={data.primaryChallenge} />
          <Field label="Secondary" value={data.secondaryChallenge} />
          <Field label="Severity" value={data.challengeSeverity} />
        </Section>
      )}

      {/* Section 10: Red Flags */}
      {(redFlags.attentionIssues || redFlags.languageProcessingIssues || redFlags.avoidanceBehavior || redFlags.custom?.length > 0) && (
        <Section title="10. Red Flags">
          {redFlags.attentionIssues && <p className="text-red-600">⚠ Attention Issues</p>}
          {redFlags.languageProcessingIssues && <p className="text-red-600">⚠ Language Processing Issues</p>}
          {redFlags.avoidanceBehavior && <p className="text-red-600">⚠ Avoidance Behavior</p>}
          {redFlags.custom?.map((f: string, i: number) => <p key={i} className="text-red-600">⚠ {f}</p>)}
        </Section>
      )}

      {/* Section 11-12: Level & Grade */}
      <Section title="11-12. Level Classification & Grade Mapping">
        <Field label="Known Text Level" value={classifyLevel(data.knownTextAccuracy)} />
        <Field label="Unknown Text Level" value={classifyLevel(data.unknownTextAccuracy)} />
        <Field label="Final Reading Level" value={classifyLevel(data.unknownTextAccuracy) || classifyLevel(data.knownTextAccuracy)} />
        <Field label="Current Grade" value={data.currentGrade} />
        <Field label="Reading Grade Level" value={data.readingGradeLevel} />
        <Field label="Gap" value={data.gradeGap} />
      </Section>

      {/* Section 13: AI Insights */}
      {insights.diagnosisSummary && (
        <Section title="13. AI Insights & Plan">
          <Field label="Diagnosis" value={insights.diagnosisSummary} />
          <Field label="Recommendations" value={insights.recommendations} />
          <Field label="Strategies" value={insights.instructionalStrategies} />
          {insights.interventions?.programType && <Field label="Program" value={insights.interventions.programType} />}
          {insights.interventions?.frequency && <Field label="Frequency" value={insights.interventions.frequency} />}
        </Section>
      )}

      {/* Section 14: Progress */}
      {(progress.baselineScore !== undefined || progress.currentScore !== undefined) && (
        <Section title="14. Progress Tracking">
          <Field label="Baseline Score" value={progress.baselineScore} />
          <Field label="Current Score" value={progress.currentScore} />
          <Field label="Improvement" value={progress.improvementPercent !== undefined ? `${progress.improvementPercent}%` : undefined} />
          <Field label="Sessions Completed" value={progress.sessionsCompleted} />
          <Field label="Reassessment Date" value={progress.reassessmentDate} />
        </Section>
      )}
    </div>
  );
}
