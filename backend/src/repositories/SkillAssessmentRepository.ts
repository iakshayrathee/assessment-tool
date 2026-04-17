import { PrismaClient, ReadingSkillAssessment, WritingSkillAssessment, MathSkillAssessment, AssessmentStatus } from '@prisma/client';

export interface ReadingSkillAssessmentData {
  studentId: string;

  // Section 1: Basic Info
  assessmentDate?: string | Date;
  mediumOfInstruction?: string;
  firstLanguage?: string;
  parentConcern?: string;

  // Section 2: Reading Context
  readingExposureAtHome?: string;
  readingSupportAtHome?: boolean;
  readingSupportDetails?: string;
  typeOfSchooling?: string;
  languageMismatch?: boolean;
  previousIntervention?: boolean;
  previousInterventionType?: string;

  // Section 3: Reading Resources (JSON)
  readingResources?: any;

  // Section 4: Reading Behavior
  interestInReading?: number;
  attentionSpanMinutes?: number;
  readingStamina?: number;
  frustrationTolerance?: number;
  emotionalResponse?: string;
  taskAvoidance?: boolean;
  motivation?: string;
  confidenceLevel?: number;
  selfCorrectionAbility?: string;
  promptDependency?: string;
  behaviorObservations?: string;

  // Section 5: Core Reading Skills
  phonologicalAwareness?: any;
  decodingSkills?: any;
  wordsPerMinute?: number;
  fluencyAccuracy?: number;
  fluencyErrorRate?: number;
  hesitationCount?: number;
  sightWordsPercent?: number;
  punctuationAwareness?: boolean;
  readingExpression?: string;
  pausingCorrectness?: string;
  skipsLinesVisual?: boolean;
  usesFinger?: boolean;
  losesPlace?: boolean;

  // Section 6: Comprehension (JSON)
  comprehension?: any;

  // Section 7: Error Analysis (JSON)
  errorAnalysis?: any;

  // Section 8: Strengths (JSON)
  strengths?: any;

  // Section 9: Challenges
  primaryChallenge?: string;
  secondaryChallenge?: string;
  challengeSeverity?: string;

  // Section 10: Red Flags (JSON)
  redFlags?: any;

  // Section 11: Level Classification
  knownTextAccuracy?: number;
  unknownTextAccuracy?: number;
  knownTextLevel?: string;
  unknownTextLevel?: string;
  finalReadingLevel?: string;

  // Section 12: Grade Level Mapping
  currentGrade?: string;
  readingGradeLevel?: string;
  gradeGap?: string;

  // Section 13: AI Insights (JSON)
  aiInsights?: any;
  aiInsightsStatus?: string;

  // Section 14: Progress Tracking (JSON)
  progressTracking?: any;

  // Computed scores (set by backend)
  decodingScore?: number;
  fluencyScore?: number;
  comprehensionScore?: number;
  behaviorScore?: number;
  overallReadingScore?: number;
  tier?: string;
  ldRiskFlag?: boolean;
  ldRiskDetails?: string;

  // Legacy fields (backward compat)
  readingQ1?: string;
  readingQ2?: string;
  readingQ3?: string;
  missesLetters?: boolean;
  missesWords?: boolean;
  missesSentences?: boolean;
  substitution?: boolean;
  omissionBeginning?: boolean;
  omissionEnding?: boolean;
  omissionWholeWord?: boolean;
  additionWordsOrSyllables?: boolean;
  guessingWords?: boolean;
  mispronunciation?: boolean;
  troubleBlendingSyllables?: boolean;
  difficultyDecodingUnfamiliar?: boolean;
  poorWordRecognition?: boolean;
  troubleRememberingSightWords?: boolean;
  troubleLearningLetterSound?: boolean;
  shortLongVowelConfusion?: boolean;
  poorSyllabication?: boolean;
  poorFlowWhileReading?: boolean;
  choppyReading?: boolean;
  lotsOfGaps?: boolean;
  wordByWordReading?: boolean;
  reReadingSameLine?: boolean;
  repetitionOfWords?: boolean;
  vocalizeDuringSilentReading?: boolean;
  poorIntonations?: boolean;
  poorPhrasing?: boolean;
  slowEffortfulReading?: boolean;
  movesHeadWhileReading?: boolean;
  losesPlaceWhileReading?: boolean;
  skipsLines?: boolean;
  poorEyeTracking?: boolean;
  poorScanningSkills?: boolean;
  holdsBookTooClose?: boolean;
  difficultyLeftRightEyeMovement?: boolean;
  difficultyRecognizingSimilarLetters?: boolean;
  readsWithoutUnderstanding?: boolean;
  forgetsWhatWasRead?: boolean;
  difficultyAnsweringQuestions?: boolean;
  notInterestedInReading?: boolean;
  avoidsReadingAloud?: boolean;
  avoidsReadingActivities?: boolean;
  yawningFrequently?: boolean;
  easilyFrustrated?: boolean;
  lowConfidence?: boolean;
  poorReadingStamina?: boolean;
  punctuationErrors?: boolean;
  doesNotPauseAtFullStop?: boolean;
  extraPausesAtCommas?: boolean;
  incorrectToneForQuestionExclamation?: boolean;
  independentLevelKnownText?: boolean;
  independentLevelUnknownText?: boolean;
  instructionalLevelKnownText?: boolean;
  instructionalLevelUnknownText?: boolean;
  frustrationLevelKnownText?: boolean;
  frustrationLevelUnknownText?: boolean;
  isAtGradeLevel?: boolean;
  functionalGradeLevel?: string;
  performanceSummary?: string;
  gradeLevelMappings?: any;
  gradeLevelObservation?: string;
  batteryTestConducted?: boolean;
  batteryTestSummary?: string;
  batteryTestReportUrl?: string;
  atGradeLevelComprehension?: boolean;
  comprehensionLevels?: string[];
  currentLevelComprehension?: string[];
  comprehensionObservation?: string;

  // Meta
  currentStep?: number;
  additionalNotes?: string;
}

export interface WritingSkillAssessmentData {
  studentId: string;
  // All boolean fields for writing assessment
  [key: string]: any;
  additionalNotes?: string;
}

export interface MathSkillAssessmentData {
  studentId: string;
  // All boolean fields for math assessment
  [key: string]: any;
  additionalNotes?: string;
}

export class SkillAssessmentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Reading Skill Assessment Methods
  async createReadingAssessment(specialEducatorId: string, data: ReadingSkillAssessmentData): Promise<ReadingSkillAssessment> {
    return this.prisma.readingSkillAssessment.create({
      data: {
        specialEducatorId,
        ...data,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findReadingAssessmentById(id: string): Promise<ReadingSkillAssessment | null> {
    return this.prisma.readingSkillAssessment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findReadingAssessmentsByStudent(studentId: string): Promise<ReadingSkillAssessment[]> {
    return this.prisma.readingSkillAssessment.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReadingAssessment(id: string, data: Partial<ReadingSkillAssessmentData>): Promise<ReadingSkillAssessment> {
    return this.prisma.readingSkillAssessment.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async completeReadingAssessment(id: string): Promise<ReadingSkillAssessment> {
    return this.prisma.readingSkillAssessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Writing Skill Assessment Methods
  async createWritingAssessment(specialEducatorId: string, data: WritingSkillAssessmentData): Promise<WritingSkillAssessment> {
    return this.prisma.writingSkillAssessment.create({
      data: {
        specialEducatorId,
        ...data,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findWritingAssessmentById(id: string): Promise<WritingSkillAssessment | null> {
    return this.prisma.writingSkillAssessment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findWritingAssessmentsByStudent(studentId: string): Promise<WritingSkillAssessment[]> {
    return this.prisma.writingSkillAssessment.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateWritingAssessment(id: string, data: Partial<WritingSkillAssessmentData>): Promise<WritingSkillAssessment> {
    return this.prisma.writingSkillAssessment.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async completeWritingAssessment(id: string): Promise<WritingSkillAssessment> {
    return this.prisma.writingSkillAssessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  // Math Skill Assessment Methods
  async createMathAssessment(specialEducatorId: string, data: MathSkillAssessmentData): Promise<MathSkillAssessment> {
    return this.prisma.mathSkillAssessment.create({
      data: {
        specialEducatorId,
        ...data,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findMathAssessmentById(id: string): Promise<MathSkillAssessment | null> {
    return this.prisma.mathSkillAssessment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findMathAssessmentsByStudent(studentId: string): Promise<MathSkillAssessment[]> {
    return this.prisma.mathSkillAssessment.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMathAssessment(id: string, data: Partial<MathSkillAssessmentData>): Promise<MathSkillAssessment> {
    return this.prisma.mathSkillAssessment.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async completeMathAssessment(id: string): Promise<MathSkillAssessment> {
    return this.prisma.mathSkillAssessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
          },
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
}

