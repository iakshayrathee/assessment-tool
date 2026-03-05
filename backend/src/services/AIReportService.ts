import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { IEPRepository } from '../repositories/IepRepository';
import { SkillAssessmentRepository } from '../repositories/SkillAssessmentRepository';
import { WeeklyLessonPlanRepository } from '../repositories/WeeklyLessonPlanRepository';

const prisma = new PrismaClient();

// Human-readable symptom mappings
const READING_SYMPTOM_MAP: Record<string, string> = {
  missesLetters: 'Misses letters while reading',
  missesWords: 'Misses whole words',
  missesSentences: 'Misses entire sentences',
  substitution: 'Substitutes words',
  omissionBeginning: 'Omits beginning of words',
  omissionEnding: 'Omits endings of words',
  omissionWholeWord: 'Omits whole words',
  additionWordsOrSyllables: 'Adds extra words or syllables',
  guessingWords: 'Guesses at unfamiliar words',
  mispronunciation: 'Mispronounces words frequently',
  troubleBlendingSyllables: 'Has trouble blending syllables',
  difficultyDecodingUnfamiliar: 'Difficulty decoding unfamiliar words',
  poorWordRecognition: 'Poor word recognition',
  troubleRememberingSightWords: 'Trouble remembering sight words',
  troubleLearningLetterSound: 'Trouble learning letter-sound associations',
  shortLongVowelConfusion: 'Confuses short and long vowel sounds',
  poorSyllabication: 'Poor syllabication skills',
  poorFlowWhileReading: 'Poor flow while reading',
  choppyReading: 'Choppy, halting reading',
  lotsOfGaps: 'Many gaps/pauses while reading',
  wordByWordReading: 'Reads word by word',
  reReadingSameLine: 'Re-reads the same line',
  repetitionOfWords: 'Repeats words while reading',
  vocalizeDuringSilentReading: 'Vocalizes during silent reading',
  poorIntonations: 'Poor intonation and expression',
  poorPhrasing: 'Poor phrasing',
  slowEffortfulReading: 'Slow, effortful reading',
  movesHeadWhileReading: 'Moves head while reading instead of eyes',
  losesPlaceWhileReading: 'Loses place while reading',
  skipsLines: 'Skips lines',
  poorEyeTracking: 'Poor eye tracking',
  poorScanningSkills: 'Poor scanning skills',
  holdsBookTooClose: 'Holds book too close',
  difficultyLeftRightEyeMovement: 'Difficulty with left-right eye movement',
  difficultyRecognizingSimilarLetters: 'Difficulty recognizing similar letters',
  readsWithoutUnderstanding: 'Reads without understanding',
  forgetsWhatWasRead: 'Forgets what was read',
  difficultyAnsweringQuestions: 'Difficulty answering comprehension questions',
  notInterestedInReading: 'Not interested in reading',
  avoidsReadingAloud: 'Avoids reading aloud',
  avoidsReadingActivities: 'Avoids reading activities',
  yawningFrequently: 'Yawns frequently during reading',
  easilyFrustrated: 'Gets easily frustrated while reading',
  lowConfidence: 'Shows low confidence in reading',
  poorReadingStamina: 'Poor reading stamina',
  punctuationErrors: 'Makes punctuation errors while reading',
  doesNotPauseAtFullStop: 'Does not pause at full stops',
  extraPausesAtCommas: 'Extra pauses at commas',
  incorrectToneForQuestionExclamation: 'Incorrect tone for questions/exclamations',
};

const WRITING_SYMPTOM_MAP: Record<string, string> = {
  incorrectPencilGrip: 'Incorrect pencil grip',
  holdsPencilTooTightly: 'Holds pencil too tightly',
  holdsPencilTooLoosely: 'Holds pencil too loosely',
  writesExcessivePressure: 'Writes with excessive pressure',
  writesLightPressure: 'Writes with very light pressure',
  wristFingerPainComplaints: 'Complains of wrist/finger pain',
  slowFineMotorSpeed: 'Slow fine motor speed',
  fatigueAfterShortWriting: 'Fatigues after short writing periods',
  incorrectLetterFormation: 'Incorrect letter formation',
  reversals: 'Letter/number reversals',
  difficultiesFormingCurvesDiagonals: 'Difficulty forming curves and diagonals',
  lettersWrittenMirrorImage: 'Writes letters in mirror image',
  poorStrokeSequence: 'Poor stroke sequence',
  capitalsInsertedBetweenWords: 'Inserts capitals between words randomly',
  difficultyCopyingLetters: 'Difficulty copying letters',
  poorSpacingBetweenLetters: 'Poor spacing between letters',
  poorSpacingBetweenWords: 'Poor spacing between words',
  writesOutsideLine: 'Writes outside the line',
  difficultyMaintainingBaseline: 'Difficulty maintaining baseline',
  unevenLetterSize: 'Uneven letter sizes',
  inconsistentSpacingAcrossPage: 'Inconsistent spacing across page',
  crowdedWriting: 'Crowded, cramped writing',
  tooMuchSpaceBetweenLetters: 'Too much space between letters',
  floatingLettersAboveLine: 'Letters float above the line',
  verySlowWriting: 'Very slow writing speed',
  writesTooFastManyErrors: 'Writes too fast with many errors',
  poorHandwritingEndurance: 'Poor handwriting endurance',
  choppyWriting: 'Choppy, disconnected writing',
  inconsistentPace: 'Inconsistent writing pace',
  repeatedErasing: 'Repeated erasing',
  frequentCorrections: 'Frequent corrections',
  difficultyWritingDictatedLetters: 'Difficulty writing dictated letters',
  difficultyWritingDictatedWords: 'Difficulty writing dictated words',
  spellsPhonetically: 'Spells phonetically',
  omitsLettersInSpelling: 'Omits letters in spelling',
  addsExtraLetters: 'Adds extra letters when spelling',
  substitutesLettersOrSounds: 'Substitutes letters or sounds',
  confusesVowelSounds: 'Confuses vowel sounds in spelling',
  troubleEncodingCVC: 'Trouble encoding CVC words',
  troubleEncodingBlendsDigraphs: 'Trouble encoding blends and digraphs',
  cannotConstructSimpleSentences: 'Cannot construct simple sentences',
  writesOnlySingleWords: 'Writes only single words',
  strugglesExpandSentences: 'Struggles to expand sentences',
  poorGrammarUsage: 'Poor grammar usage',
  writesIncompleteSentences: 'Writes incomplete sentences',
  confusingSentenceOrder: 'Confusing sentence order',
  difficultyExpressingIdeas: 'Difficulty expressing ideas in writing',
  avoidsWrittenTasks: 'Avoids written tasks',
  needsVerbalPromptsToWrite: 'Needs verbal prompts to write',
  difficultyCopyingFromBoard: 'Difficulty copying from the board',
  difficultyCopyingFromBook: 'Difficulty copying from a book',
  slowCopying: 'Very slow copying speed',
  skipsWordsOrLettersWhenCopying: 'Skips words or letters when copying',
  copiesInaccurately: 'Copies inaccurately',
  looksAwayFrequentlyWhileCopying: 'Looks away frequently while copying',
  writingDisorganized: 'Writing is disorganized',
  thoughtsNotLogicallySequenced: 'Thoughts not logically sequenced',
  cannotPlanWriting: 'Cannot plan writing',
  beginsWritingRandomAreasOnPage: 'Begins writing in random areas on page',
  noConceptOfMargins: 'No concept of margins',
  paragraphingDifficulty: 'Difficulty with paragraphing',
  avoidsWritingActivities: 'Avoids writing activities',
  complainsWritingIsHard: 'Complains writing is hard',
  getsFrustratedQuickly: 'Gets frustrated quickly with writing',
  lowWritingStamina: 'Low writing stamina',
  givesUpInMiddleOfTask: 'Gives up in the middle of writing tasks',
  lowConfidenceWriting: 'Low confidence in writing',
  inconsistentPerformanceAcrossDays: 'Inconsistent performance across days',
  visualTrackingDifficulty: 'Visual tracking difficulty (board copying)',
  omissionSkippingFlag: 'Omits/skips content while copying',
};

const MATH_SYMPTOM_MAP: Record<string, string> = {
  difficultyIdentifyingNumbers1to10: 'Difficulty identifying numbers 1-10',
  difficultyIdentifyingNumbers1to20: 'Difficulty identifying numbers 1-20',
  difficultyIdentifyingNumbers1to100: 'Difficulty identifying numbers 1-100',
  reversesNumbers: 'Reverses numbers when writing',
  writesNumbersIncorrectly: 'Writes numbers incorrectly',
  difficultySequencingNumbers: 'Difficulty sequencing numbers',
  skipsNumbersWhileCounting: 'Skips numbers while counting',
  countsSlowlyOrWithEffort: 'Counts slowly or with effort',
  troubleWithForwardCounting: 'Trouble with forward counting',
  troubleWithBackwardCounting: 'Trouble with backward counting',
  difficultyWithSkipCounting: 'Difficulty with skip counting',
  doesNotUnderstandQuantity: 'Does not understand quantity/value',
  cannotMatchNumberToQuantity: 'Cannot match number to quantity',
  cannotCompareNumbers: 'Cannot compare numbers (greater/less)',
  difficultyIdentifyingPlaceValue: 'Difficulty identifying place value',
  strugglesSingleDigitAddition: 'Struggles with single-digit addition',
  strugglesSingleDigitSubtraction: 'Struggles with single-digit subtraction',
  cannotCarryOver: 'Cannot carry over in addition',
  cannotBorrow: 'Cannot borrow in subtraction',
  usesFingerCountingExcessively: 'Uses finger counting excessively',
  cannotPerformMentalMath: 'Cannot perform mental math',
  doesNotUnderstandPlusMinusSymbols: 'Does not understand +/- symbols',
  confusesAdditionSubtraction: 'Confuses addition and subtraction',
  difficultyWithWordProblems: 'Difficulty with word problems',
  cannotUnderstandRealWorldMath: 'Cannot apply math to real-world situations',
  difficultyUnderstandingPatterns: 'Difficulty understanding patterns',
  difficultyFinishingPatterns: 'Difficulty finishing patterns',
  troubleIdentifyingShapes: 'Trouble identifying shapes',
  troubleSortingObjects: 'Trouble sorting objects',
  difficultyInMatching: 'Difficulty in matching',
  difficultyWithSpatialConcepts: 'Difficulty with spatial concepts',
  difficultyUnderstandingMeasurement: 'Difficulty understanding measurement',
  difficultyWithTimeConcepts: 'Difficulty with time concepts',
  difficultyReadingClock: 'Difficulty reading a clock',
  verySlowInSolvingProblems: 'Very slow in solving problems',
  frequentCalculationMistakes: 'Makes frequent calculation mistakes',
  poorWorkingMemoryForMath: 'Poor working memory for math',
  troubleRememberingMathFacts: 'Trouble remembering math facts',
  difficultyRememberingSteps: 'Difficulty remembering multi-step procedures',
  needsRepeatedInstructions: 'Needs repeated instructions',
  getsConfusedDuringMultiStep: 'Gets confused during multi-step problems',
  misalignsNumbersInColumns: 'Misaligns numbers in columns',
  writesNumbersOutsideGrid: 'Writes numbers outside grid',
  poorSpatialOrganization: 'Poor spatial organization in math work',
  placesDigitsInWrongOrder: 'Places digits in wrong order',
  drawsShapesIncorrectly: 'Draws shapes incorrectly',
  cannotVisuallyGroupObjects: 'Cannot visually group objects',
  difficultyCopyingMathFromBoard: 'Difficulty copying math from board',
  confusesMathSymbols: 'Confuses math symbols',
  cannotUnderstandEqualsMeansSameAs: 'Cannot understand equals means same as',
  treatsEqualsAsAnswerComesAfter: 'Treats equals as answer-comes-after',
  difficultyRememberingOperationRules: 'Difficulty remembering operation rules',
  cannotDifferentiateTensOnes: 'Cannot differentiate tens and ones',
  misunderstandsMoreLess: 'Misunderstands more/less concepts',
  avoidsMathTasks: 'Avoids math tasks',
  lowMathConfidence: 'Low math confidence',
  givesUpQuickly: 'Gives up quickly on math tasks',
  anxiousDuringMathActivities: 'Anxious during math activities',
  needsConstantPrompting: 'Needs constant prompting in math',
  appearsConfusedAfterExplanation: 'Appears confused after explanation',
  poorAttentionDuringMath: 'Poor attention during math',
};

export class AIReportService {
  private openai: OpenAI;
  private assessmentRepo: AssessmentRepository;
  private iepRepo: IEPRepository;
  private skillAssessmentRepo: SkillAssessmentRepository;
  private weeklyLessonPlanRepo: WeeklyLessonPlanRepository;

  constructor(
    assessmentRepo: AssessmentRepository,
    iepRepo: IEPRepository,
    skillAssessmentRepo: SkillAssessmentRepository,
    weeklyLessonPlanRepo: WeeklyLessonPlanRepository
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    this.assessmentRepo = assessmentRepo;
    this.iepRepo = iepRepo;
    this.skillAssessmentRepo = skillAssessmentRepo;
    this.weeklyLessonPlanRepo = weeklyLessonPlanRepo;
  }

  async generateComprehensiveReport(studentId: string, educatorId: string, reportType: 'ASSESSMENT' | 'LESSON_PLAN' = 'ASSESSMENT') {
    try {
      console.log(`Starting AI report generation for student: ${studentId}, type: ${reportType}`);

      // Fetch all student data in parallel
      const [student, assessments, weeklyLessonPlans, iepGoalsResult, iepDocuments, readingAssessments, writingAssessments, mathAssessments, intakeForms, formalAssessments] = await Promise.all([
        prisma.student.findUnique({ where: { id: studentId }, include: { school: { select: { name: true } } } }),
        this.assessmentRepo.findAssessmentsByStudent(studentId),
        this.weeklyLessonPlanRepo.findByStudent(studentId).then(r => r.plans),
        this.assessmentRepo.findIEPGoalsByStudent(studentId),
        this.iepRepo.findIEPDocumentsByStudent(studentId),
        this.skillAssessmentRepo.findReadingAssessmentsByStudent(studentId),
        this.skillAssessmentRepo.findWritingAssessmentsByStudent(studentId),
        this.skillAssessmentRepo.findMathAssessmentsByStudent(studentId),
        this.assessmentRepo.findIntakeFormsByStudent(studentId),
        prisma.formalAssessment.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      ]);

      console.log(`Fetched: ${assessments.length} assessments, ${readingAssessments.length} reading, ${writingAssessments.length} writing, ${mathAssessments.length} math, ${intakeForms.length} intake, ${formalAssessments.length} formal`);

      const iepGoals = iepGoalsResult.iepGoals;

      const studentData = {
        student,
        assessments: assessments.slice(0, 5),
        weeklyLessonPlans: weeklyLessonPlans.slice(0, 10),
        iepGoals: iepGoals.filter(g => g.status !== 'ACHIEVED'),
        iepDocuments: iepDocuments.slice(0, 5),
        intakeForms: intakeForms.slice(0, 1),
        formalAssessments: formalAssessments.slice(0, 3),
        skillAssessments: {
          reading: readingAssessments.slice(0, 5),
          writing: writingAssessments.slice(0, 5),
          math: mathAssessments.slice(0, 5),
        },
      };

      const prompt = reportType === 'ASSESSMENT'
        ? this.buildAssessmentReportPrompt(studentData)
        : this.buildLessonPlanReportPrompt(studentData);

      const systemPrompt = reportType === 'ASSESSMENT'
        ? `You are an expert special education assessment analyst. Generate comprehensive, professional assessment reports. You must respond with a valid JSON object with exactly these keys: "overallInterpretation", "keyStrengths", "skillGaps", "areasToInvestigate", "parentTeacherExplanation", "recommendedInterventions", "suggestedGoals", "closingStatement". Each value should be a detailed string with full paragraphs, bullet points using dashes (-), and sub-sections. Use markdown formatting within each value (bold with **, headers with ##).`
        : `You are an expert special education analyst. Generate comprehensive lesson plan reports. You must respond with a valid JSON object with exactly these keys: "executiveSummary", "lessonPlanAnalysis", "teachingEffectiveness", "progressPatterns", "areasOfRemediation", "recommendations", "nextSteps", "closingStatement". Each value should be a detailed string. Use markdown formatting within each value.`;

      console.log('AI Prompt length:', prompt.length);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 8000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) throw new Error('AI response was empty');

      console.log('AI response received, length:', aiResponse.length);
      return this.parseAIResponse(aiResponse, studentId, educatorId, reportType, studentData.student);
    } catch (error) {
      console.error('AI Report Generation Error:', error);
      throw new Error(`Failed to generate AI report: ${(error as Error).message}`);
    }
  }

  private buildAssessmentReportPrompt(data: any): string {
    const student = data.student;
    const studentInfo = student ? `Name: ${student.fullName || 'N/A'}, Grade: ${student.grade || 'N/A'}, Age: ${student.age || 'N/A'}, School: ${student.school?.name || 'N/A'}` : 'No student info';

    const intakeData = this.extractIntakeData(data.intakeForms[0]);
    const readingData = this.extractReadingData(data.skillAssessments.reading);
    const writingData = this.extractWritingData(data.skillAssessments.writing);
    const mathData = this.extractMathData(data.skillAssessments.math);
    const informalData = this.extractInformalAssessments(data.assessments);
    const formalData = this.extractFormalAssessments(data.formalAssessments);
    const iepData = this.extractIEPData(data.iepGoals);

    return `Generate a comprehensive ASSESSMENT REPORT for this child. Respond with a JSON object.

STUDENT INFORMATION:
${studentInfo}

INTAKE FORM (DEVELOPMENTAL & BACKGROUND):
${intakeData}

READING ASSESSMENT DATA:
${readingData}

WRITING ASSESSMENT DATA:
${writingData}

MATH ASSESSMENT DATA:
${mathData}

INFORMAL ASSESSMENT OBSERVATIONS:
${informalData}

FORMAL ASSESSMENT/DIAGNOSIS:
${formalData}

IEP GOALS (Active):
${iepData}

INSTRUCTIONS:
Generate a JSON with these 8 keys. Each value must be a detailed, thorough string:

1. "overallInterpretation" - Comprehensive interpretation covering: reading level analysis (grade levels, frustration/instructional/independent levels), writing analysis (handwriting, creative writing, copying skills), math analysis, comprehension abilities, and overall cognitive observations. Be specific about grade levels and use data provided.

2. "keyStrengths" - Identify ALL positive aspects: motivation, willingness to attempt tasks, any areas of competence, comprehension abilities, near copying skills, idea generation in writing, math attempt willingness, etc. This is critical for balanced reporting.

3. "skillGaps" - Detailed breakdown by domain: Reading gaps (decoding, fluency, vocabulary, phonics), Writing gaps (sentence structure, grammar, vocabulary, spelling - sight words vs phonic words), Math gaps (specific concepts), Visual Processing/Copying gaps. Include severity indications.

4. "areasToInvestigate" - Suggest further evaluations: vision screening, learning difficulty screening (dyslexia/SLD risk), attention assessment, psycho-educational assessment needs. Reference specific symptoms that warrant investigation.

5. "parentTeacherExplanation" - Write this in SIMPLE, non-technical language that parents can understand. Explain what the assessment shows, acknowledge the child's strengths, explain the challenges in everyday terms, and what it means for their learning. This should sound warm and supportive.

6. "recommendedInterventions" - Detailed interventions for each area: Reading (phonics instruction, sight word practice, guided reading, vocabulary building with specific strategies), Writing (sentence formation, grammar basics, paragraph structure with specific exercises), Spelling (phonics-based practice, word families, sight word lists), Math (conceptual teaching, visual aids, step-by-step methods), Classroom Accommodations (printed notes, extra time, short instructions, frequent checks).

7. "suggestedGoals" - Specific measurable goals for the next 6 months in each area: Reading (fluency targets, vocabulary goals), Writing (paragraph writing targets, grammar accuracy), Spelling (sight word mastery targets), Math (concept mastery targets, accuracy goals). Include specific metrics.

8. "closingStatement" - Professional closing that acknowledges the child's potential, summarizes key needs, and expresses confidence about improvement with proper support. Should be suitable for an official report.

Be SPECIFIC - reference actual data from the assessments above. Do NOT use generic statements. If data is limited, note that and provide recommendations based on available information.`;
  }

  private buildLessonPlanReportPrompt(data: any): string {
    const student = data.student;
    const studentInfo = student ? `Name: ${student.fullName || 'N/A'}, Grade: ${student.grade || 'N/A'}` : 'No student info';
    const readingData = this.extractReadingData(data.skillAssessments.reading);
    const writingData = this.extractWritingData(data.skillAssessments.writing);
    const mathData = this.extractMathData(data.skillAssessments.math);

    const lessonPlans = data.weeklyLessonPlans.slice(0, 10).map((p: any) => ({
      date: p.sessionDate, week: p.weekNumber, topics: p.topics,
      remediation: p.areasOfRemediation, plannedTime: p.averageTime,
      actualTime: p.actualTime, motivation: p.motivationStrategy,
      resources: p.resourcesUsed, outcome: p.outcome, status: p.status,
      stpGoal: p.shortTermPlan?.stpGoal || null,
    }));

    return `Generate a comprehensive LESSON PLAN REPORT. Respond with a JSON object.

STUDENT: ${studentInfo}

WEEKLY LESSON PLANS:
${JSON.stringify(lessonPlans, null, 2)}

SYMPTOM CONTEXT:
Reading: ${readingData}
Writing: ${writingData}
Math: ${mathData}

Generate JSON with keys: "executiveSummary", "lessonPlanAnalysis", "teachingEffectiveness", "progressPatterns", "areasOfRemediation", "recommendations", "nextSteps", "closingStatement". Each value = detailed string with markdown formatting.`;
  }

  private extractIntakeData(intake: any): string {
    if (!intake) return 'No intake form available';
    const fields: string[] = [];
    if (intake.familyType) fields.push(`Family Type: ${intake.familyType}`);
    if (intake.familyIncome) fields.push(`Family Income: ${intake.familyIncome}`);
    if (intake.digitalResourcesAtHome != null) fields.push(`Digital Resources at Home: ${intake.digitalResourcesAtHome ? 'Yes' : 'No'}`);
    if (intake.studyAssistant) fields.push(`Study Assistant: ${intake.studyAssistant}`);
    if (intake.externalAcademicSupport != null) fields.push(`External Academic Support: ${intake.externalAcademicSupport ? 'Yes' : 'No'}`);
    if (intake.pregnancyNormal != null) fields.push(`Pregnancy: ${intake.pregnancyNormal ? 'Normal' : 'Complications noted'}`);
    if (intake.medicationsDuringPregnancy) fields.push(`Medications During Pregnancy: ${intake.medicationsDuringPregnancy}`);
    if (intake.fullTermOrPremature) fields.push(`Birth: ${intake.fullTermOrPremature}`);
    if (intake.deliveryType) fields.push(`Delivery: ${intake.deliveryType}`);
    if (intake.birthCry) fields.push(`Birth Cry: ${intake.birthCry}`);
    if (intake.breastFed != null) fields.push(`Breast Fed: ${intake.breastFed ? 'Yes' : 'No'}`);
    if (intake.infantJaundice) fields.push(`Infant Jaundice: Yes`);
    if (intake.incubation) fields.push(`Required Incubation: Yes`);
    if (intake.immunizationDone != null) fields.push(`Immunization: ${intake.immunizationDone ? 'Done' : 'Not done'}`);
    if (intake.consanguineousMarriage) fields.push(`Consanguineous Marriage: Yes`);
    if (intake.delayInNeckStanding) fields.push(`Delay in Neck Standing: Yes${intake.delayInNeckStandingDetails ? ' - ' + intake.delayInNeckStandingDetails : ''}`);
    if (intake.ageOfWalking) fields.push(`Age of Walking: ${intake.ageOfWalking} months`);
    if (intake.ageOfTwoWordSpeech) fields.push(`Age of Two-Word Speech: ${intake.ageOfTwoWordSpeech} months`);
    if (intake.healthConcerns) fields.push(`Health Concerns: ${intake.healthConcerns}`);
    if (intake.epilepticHistory) fields.push(`Epileptic History: Yes`);
    if (intake.onMedication && intake.medicationDetails) fields.push(`Current Medication: ${intake.medicationDetails}`);
    if (intake.asthmaWheezing) fields.push(`Asthma/Wheezing: Yes`);
    if (intake.wearsGlasses) fields.push(`Wears Glasses: Yes`);
    if (intake.visionTestDone != null) fields.push(`Vision Test Done: ${intake.visionTestDone ? 'Yes' : 'No'}`);
    if (intake.hearingTestDone != null) fields.push(`Hearing Test Done: ${intake.hearingTestDone ? 'Yes' : 'No'}`);
    if (intake.attendedPreschool != null) fields.push(`Attended Preschool: ${intake.attendedPreschool ? 'Yes' : 'No'}`);
    if (intake.repeatedGrades && intake.whichGradeRepeated) fields.push(`Repeated Grade: ${intake.whichGradeRepeated}`);
    if (intake.dominantWritingHand) fields.push(`Dominant Hand: ${intake.dominantWritingHand}`);
    if (intake.strugglesInLanguages) fields.push(`Struggles in Languages: Yes`);
    if (intake.enjoysSchool != null) fields.push(`Enjoys School: ${intake.enjoysSchool ? 'Yes' : 'No'}`);
    if (intake.enjoysReading != null) fields.push(`Enjoys Reading: ${intake.enjoysReading ? 'Yes' : 'No'}`);
    if (intake.childType) fields.push(`Child Type/Temperament: ${intake.childType}`);
    return fields.length > 0 ? fields.join('\n') : 'No detailed intake data available';
  }

  private extractReadingData(assessments: any[]): string {
    if (!assessments?.length) return 'No reading assessments available';
    const parts: string[] = [];
    assessments.forEach((a, i) => {
      const lines: string[] = [`--- Reading Assessment ${i + 1} (${new Date(a.createdAt).toLocaleDateString()}) ---`];
      // Grade-level questions
      if (a.readingQ1) lines.push(`Grade-level reading: ${a.readingQ1}`);
      if (a.readingQ2) lines.push(`Decoding ability: ${a.readingQ2}`);
      if (a.readingQ3) lines.push(`Comprehension ability: ${a.readingQ3}`);
      // Grade-level mapping
      if (a.isAtGradeLevel != null) lines.push(`At Grade Level: ${a.isAtGradeLevel ? 'Yes' : 'No'}`);
      if (a.functionalGradeLevel) lines.push(`Functional Grade Level: ${a.functionalGradeLevel}`);
      if (a.performanceSummary) lines.push(`Performance Summary: ${a.performanceSummary}`);
      if (a.gradeLevelMappings) {
        try {
          const mappings = typeof a.gradeLevelMappings === 'string' ? JSON.parse(a.gradeLevelMappings) : a.gradeLevelMappings;
          if (Array.isArray(mappings) && mappings.length > 0) {
            lines.push('Grade Level Mappings:');
            mappings.forEach((m: any) => {
              const levels = [];
              if (m.independent) levels.push('Independent');
              if (m.instructional) levels.push('Instructional');
              if (m.frustration) levels.push('Frustration');
              lines.push(`  Grade ${m.gradeLevel}: ${levels.join(', ') || 'Not assessed'}`);
            });
          }
        } catch (e) { /* skip parse errors */ }
      }
      if (a.gradeLevelObservation) lines.push(`Grade Level Observation: ${a.gradeLevelObservation}`);
      // Reading level booleans
      const readingLevels: string[] = [];
      if (a.independentLevelKnownText) readingLevels.push('Independent level on known text');
      if (a.independentLevelUnknownText) readingLevels.push('Independent level on unknown text');
      if (a.instructionalLevelKnownText) readingLevels.push('Instructional level on known text');
      if (a.instructionalLevelUnknownText) readingLevels.push('Instructional level on unknown text');
      if (a.frustrationLevelKnownText) readingLevels.push('Frustration level on known text');
      if (a.frustrationLevelUnknownText) readingLevels.push('Frustration level on unknown text');
      if (readingLevels.length) lines.push(`Reading Levels: ${readingLevels.join(', ')}`);
      // Comprehension
      if (a.atGradeLevelComprehension != null) lines.push(`Comprehension at Grade Level: ${a.atGradeLevelComprehension ? 'Yes' : 'No'}`);
      if (a.comprehensionLevels?.length) lines.push(`Comprehension Levels: ${a.comprehensionLevels.join(', ')}`);
      if (a.currentLevelComprehension?.length) lines.push(`Current Comprehension Level: ${a.currentLevelComprehension.join(', ')}`);
      if (a.comprehensionObservation) lines.push(`Comprehension Observation: ${a.comprehensionObservation}`);
      // Battery test
      if (a.batteryTestConducted) {
        lines.push(`Battery Test: Conducted`);
        if (a.batteryTestSummary) lines.push(`Battery Test Summary: ${a.batteryTestSummary}`);
      }
      // Symptoms
      const symptoms = this.getActiveSymptoms(a, READING_SYMPTOM_MAP);
      if (symptoms.length) lines.push(`Observed Symptoms:\n${symptoms.map(s => `  - ${s}`).join('\n')}`);
      if (a.additionalNotes) lines.push(`Additional Notes: ${a.additionalNotes}`);
      parts.push(lines.join('\n'));
    });
    return parts.join('\n\n');
  }

  private extractWritingData(assessments: any[]): string {
    if (!assessments?.length) return 'No writing assessments available';
    const parts: string[] = [];
    assessments.forEach((a, i) => {
      const lines: string[] = [`--- Writing Assessment ${i + 1} (${new Date(a.createdAt).toLocaleDateString()}) ---`];
      if (a.writingQ1) lines.push(`Legibility: ${a.writingQ1}`);
      if (a.writingQ2) lines.push(`Letter formation: ${a.writingQ2}`);
      if (a.writingQ3) lines.push(`Sentence composition: ${a.writingQ3}`);
      // Near copying
      if (a.hasNearCopyingSkills != null) lines.push(`Near Copying Skills: ${a.hasNearCopyingSkills ? 'Yes' : 'No'}`);
      if (a.nearCopyingLevels?.length) lines.push(`Near Copying Levels: ${a.nearCopyingLevels.join(', ')}`);
      if (a.nearCopyingObservation) lines.push(`Near Copying Observation: ${a.nearCopyingObservation}`);
      // Board copying
      if (a.hasBoardCopyingSkills != null) lines.push(`Board Copying Skills: ${a.hasBoardCopyingSkills ? 'Yes' : 'No'}`);
      if (a.boardCopyingLevels?.length) lines.push(`Board Copying Levels: ${a.boardCopyingLevels.join(', ')}`);
      if (a.boardCopyingSpeedObservation) lines.push(`Board Copying Speed: ${a.boardCopyingSpeedObservation}`);
      if (a.boardCopyingObservation) lines.push(`Board Copying Observation: ${a.boardCopyingObservation}`);
      // Punctuation
      const punctCopying: string[] = [];
      if (a.usesCapitalLettersCopying) punctCopying.push('Capital letters');
      if (a.usesFullStopCopying) punctCopying.push('Full stop');
      if (a.usesQuestionMarkCopying) punctCopying.push('Question mark');
      if (a.usesCommaCopying) punctCopying.push('Comma');
      if (a.usesApostropheCopying) punctCopying.push('Apostrophe');
      if (punctCopying.length) lines.push(`Punctuation in Copying: ${punctCopying.join(', ')}`);
      const punctCreative: string[] = [];
      if (a.usesCapitalLettersCreative) punctCreative.push('Capital letters');
      if (a.usesFullStopCreative) punctCreative.push('Full stop');
      if (a.usesQuestionMarkCreative) punctCreative.push('Question mark');
      if (a.usesCommaCreative) punctCreative.push('Comma');
      if (a.usesApostropheCreative) punctCreative.push('Apostrophe');
      if (punctCreative.length) lines.push(`Punctuation in Creative Writing: ${punctCreative.join(', ')}`);
      // Spelling
      if (a.spellingStrengthSummary) lines.push(`Spelling Strengths: ${a.spellingStrengthSummary}`);
      if (a.spellingErrorPatternObservation) lines.push(`Spelling Error Patterns: ${a.spellingErrorPatternObservation}`);
      // Creative writing
      if (a.creativeWritingSummary) lines.push(`Creative Writing Summary: ${a.creativeWritingSummary}`);
      // Symptoms
      const symptoms = this.getActiveSymptoms(a, WRITING_SYMPTOM_MAP);
      if (symptoms.length) lines.push(`Observed Symptoms:\n${symptoms.map(s => `  - ${s}`).join('\n')}`);
      if (a.additionalNotes) lines.push(`Additional Notes: ${a.additionalNotes}`);
      parts.push(lines.join('\n'));
    });
    return parts.join('\n\n');
  }

  private extractMathData(assessments: any[]): string {
    if (!assessments?.length) return 'No math assessments available';
    const parts: string[] = [];
    assessments.forEach((a, i) => {
      const lines: string[] = [`--- Math Assessment ${i + 1} (${new Date(a.createdAt).toLocaleDateString()}) ---`];
      if (a.mathQ1) lines.push(`Number concepts: ${a.mathQ1}`);
      if (a.mathQ2) lines.push(`Basic operations: ${a.mathQ2}`);
      if (a.mathQ3) lines.push(`Word problems: ${a.mathQ3}`);
      // Grade level
      if (a.isAtMathGradeLevel != null) lines.push(`At Math Grade Level: ${a.isAtMathGradeLevel ? 'Yes' : 'No'}`);
      if (a.mathFunctionalGradeLevel) lines.push(`Math Functional Grade Level: ${a.mathFunctionalGradeLevel}`);
      if (a.mathPerformanceSummary) lines.push(`Math Performance Summary: ${a.mathPerformanceSummary}`);
      if (a.mathGradeLevelMappings) {
        try {
          const mappings = typeof a.mathGradeLevelMappings === 'string' ? JSON.parse(a.mathGradeLevelMappings) : a.mathGradeLevelMappings;
          if (Array.isArray(mappings) && mappings.length > 0) {
            lines.push('Math Grade Level Mappings:');
            mappings.forEach((m: any) => {
              const levels = [];
              if (m.independent) levels.push('Independent');
              if (m.instructional) levels.push('Instructional');
              if (m.frustration) levels.push('Frustration');
              lines.push(`  Grade ${m.gradeLevel}: ${levels.join(', ') || 'Not assessed'}${m.summaryNote ? ' - ' + m.summaryNote : ''}`);
            });
          }
        } catch (e) { /* skip */ }
      }
      // Battery test
      if (a.mathBatteryTestConducted) {
        lines.push('Math Battery Test: Conducted');
        if (a.mathBatteryTestSummary) lines.push(`Battery Test Summary: ${a.mathBatteryTestSummary}`);
      }
      // Concept performance
      const concepts = ['addition', 'subtraction', 'multiplication', 'division', 'placeValue', 'numberLine', 'fractions', 'decimals', 'algebra', 'statementSums', 'geometry'];
      concepts.forEach(c => {
        const perf = a[`${c}Performance`];
        if (perf) {
          try {
            const p = typeof perf === 'string' ? JSON.parse(perf) : perf;
            if (p.performance || p.summary || p.errorPattern) {
              lines.push(`${c.charAt(0).toUpperCase() + c.slice(1)}: Performance=${p.performance || 'N/A'}, Summary=${p.summary || 'N/A'}${p.errorPattern ? ', Errors=' + p.errorPattern : ''}`);
            }
          } catch (e) { /* skip */ }
        }
      });
      // Symptoms
      const symptoms = this.getActiveSymptoms(a, MATH_SYMPTOM_MAP);
      if (symptoms.length) lines.push(`Observed Symptoms:\n${symptoms.map(s => `  - ${s}`).join('\n')}`);
      if (a.additionalNotes) lines.push(`Additional Notes: ${a.additionalNotes}`);
      parts.push(lines.join('\n'));
    });
    return parts.join('\n\n');
  }

  private extractInformalAssessments(assessments: any[]): string {
    if (!assessments?.length) return 'No informal assessments available';
    return assessments.slice(0, 3).map((a, i) => {
      const lines = [`--- Informal Assessment ${i + 1} (${a.assessmentType}, ${new Date(a.createdAt).toLocaleDateString()}) ---`];
      if (a.readingObservations) lines.push(`Reading Observations: ${a.readingObservations}`);
      if (a.readingLevel) lines.push(`Reading Level: ${a.readingLevel}`);
      if (a.writingObservations) lines.push(`Writing Observations: ${a.writingObservations}`);
      if (a.writingLevel) lines.push(`Writing Level: ${a.writingLevel}`);
      if (a.mathObservations) lines.push(`Math Observations: ${a.mathObservations}`);
      if (a.mathLevel) lines.push(`Math Level: ${a.mathLevel}`);
      if (a.vpObservations) lines.push(`Visual Perception Observations: ${a.vpObservations}`);
      if (a.vpLevel) lines.push(`Visual Perception Level: ${a.vpLevel}`);
      if (a.motorObservations) lines.push(`Motor Skills Observations: ${a.motorObservations}`);
      if (a.motorLevel) lines.push(`Motor Skills Level: ${a.motorLevel}`);
      if (a.attentionObservations) lines.push(`Attention Observations: ${a.attentionObservations}`);
      if (a.attentionLevel) lines.push(`Attention Level: ${a.attentionLevel}`);
      return lines.join('\n');
    }).join('\n\n');
  }

  private extractFormalAssessments(assessments: any[]): string {
    if (!assessments?.length) return 'No formal assessments/diagnosis available';
    return assessments.map((a, i) => {
      const lines = [`--- Formal Assessment ${i + 1} (${a.assessmentType}, ${new Date(a.createdAt).toLocaleDateString()}) ---`];
      if (a.referralReason) lines.push(`Referral Reason: ${a.referralReason}`);
      if (a.conductedBy) lines.push(`Conducted By: ${a.conductedBy}${a.credentials ? ', ' + a.credentials : ''}`);
      if (a.diagnosis) lines.push(`Diagnosis: ${a.diagnosis}`);
      if (a.keyFindings) lines.push(`Key Findings: ${a.keyFindings}`);
      if (a.recommendations) lines.push(`Recommendations: ${a.recommendations}`);
      return lines.join('\n');
    }).join('\n\n');
  }

  private extractIEPData(goals: any[]): string {
    if (!goals?.length) return 'No active IEP goals';
    return goals.map(g => `- ${g.domain}: ${g.goalStatement} (Progress: ${g.progressPercent}%, Status: ${g.status}${g.strategy ? ', Strategy: ' + g.strategy : ''})`).join('\n');
  }

  private getActiveSymptoms(assessment: any, symptomMap: Record<string, string>): string[] {
    const active: string[] = [];
    for (const [field, description] of Object.entries(symptomMap)) {
      if (assessment[field] === true) {
        active.push(description);
      }
    }
    return active;
  }

  private parseAIResponse(aiResponse: string, studentId: string, educatorId: string, reportType: 'ASSESSMENT' | 'LESSON_PLAN', student: any): any {
    let parsed: any;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse AI JSON response, using raw text');
      parsed = null;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const studentName = student?.fullName || 'Student';

    if (reportType === 'ASSESSMENT' && parsed) {
      const summary = [
        parsed.overallInterpretation || '',
        parsed.keyStrengths ? `\n\n## Key Strengths\n${parsed.keyStrengths}` : '',
      ].filter(Boolean).join('');

      const recommendations = [
        parsed.recommendedInterventions || '',
        parsed.suggestedGoals ? `\n\n## Suggested Goals for Next 6 Months\n${parsed.suggestedGoals}` : '',
      ].filter(Boolean).join('');

      const content = [
        `## 1. Overall Interpretation of Assessment\n${parsed.overallInterpretation || 'N/A'}`,
        `## 2. Key Strengths of the Child\n${parsed.keyStrengths || 'N/A'}`,
        `## 3. Major Skill Gaps Identified\n${parsed.skillGaps || 'N/A'}`,
        `## 4. Areas to Investigate Further\n${parsed.areasToInvestigate || 'N/A'}`,
        `## 5. How to Explain This to Parents/Teachers\n${parsed.parentTeacherExplanation || 'N/A'}`,
        `## 6. Recommended Interventions\n${parsed.recommendedInterventions || 'N/A'}`,
        `## 7. Suggested Goals for Next 6 Months\n${parsed.suggestedGoals || 'N/A'}`,
        `## 8. Closing Statement\n${parsed.closingStatement || 'N/A'}`,
      ].join('\n\n');

      return {
        studentId,
        specialEducatorId: educatorId,
        type: 'ASSESSMENT',
        title: `Assessment Report - ${studentName} - ${dateStr}`,
        content,
        summary,
        recommendations,
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
      };
    } else if (reportType === 'LESSON_PLAN' && parsed) {
      const content = [
        `## 1. Executive Summary\n${parsed.executiveSummary || 'N/A'}`,
        `## 2. Lesson Plan Analysis\n${parsed.lessonPlanAnalysis || 'N/A'}`,
        `## 3. Teaching Strategies Effectiveness\n${parsed.teachingEffectiveness || 'N/A'}`,
        `## 4. Student Progress Patterns\n${parsed.progressPatterns || 'N/A'}`,
        `## 5. Areas of Remediation\n${parsed.areasOfRemediation || 'N/A'}`,
        `## 6. Recommendations\n${parsed.recommendations || 'N/A'}`,
        `## 7. Next Steps\n${parsed.nextSteps || 'N/A'}`,
        `## 8. Closing Statement\n${parsed.closingStatement || 'N/A'}`,
      ].join('\n\n');

      return {
        studentId,
        specialEducatorId: educatorId,
        type: 'LESSON_PLAN',
        title: `Lesson Plan Report - ${studentName} - ${dateStr}`,
        content,
        summary: parsed.executiveSummary || '',
        recommendations: [parsed.recommendations || '', parsed.nextSteps ? `\n\n## Next Steps\n${parsed.nextSteps}` : ''].filter(Boolean).join(''),
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
      };
    }

    // Fallback for unparseable response
    return {
      studentId,
      specialEducatorId: educatorId,
      type: reportType,
      title: `${reportType === 'ASSESSMENT' ? 'Assessment' : 'Lesson Plan'} Report - ${studentName} - ${dateStr}`,
      content: aiResponse,
      summary: '',
      recommendations: '',
      status: 'COMPLETED',
      createdAt: now,
      updatedAt: now,
    };
  }
}