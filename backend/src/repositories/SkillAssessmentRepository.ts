import { PrismaClient, ReadingSkillAssessment, WritingSkillAssessment, MathSkillAssessment, AssessmentStatus } from '@prisma/client';

export interface ReadingSkillAssessmentData {
  studentId: string;
  // Assessment Questions
  readingQ1?: string; // Is the child reading at grade level?
  readingQ2?: string; // Can the child decode unfamiliar words?
  readingQ3?: string; // Can the child answer comprehension questions?
  // Decoding & Word Reading Errors
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
  // Fluency & Reading Flow
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
  // Tracking, Eye Movement, Visual Skills
  movesHeadWhileReading?: boolean;
  losesPlaceWhileReading?: boolean;
  skipsLines?: boolean;
  poorEyeTracking?: boolean;
  poorScanningSkills?: boolean;
  holdsBookTooClose?: boolean;
  difficultyLeftRightEyeMovement?: boolean;
  difficultyRecognizingSimilarLetters?: boolean;
  // Comprehension Indicators
  readsWithoutUnderstanding?: boolean;
  forgetsWhatWasRead?: boolean;
  difficultyAnsweringQuestions?: boolean;
  // Attention & Reading Behavior
  notInterestedInReading?: boolean;
  avoidsReadingAloud?: boolean;
  avoidsReadingActivities?: boolean;
  yawningFrequently?: boolean;
  easilyFrustrated?: boolean;
  lowConfidence?: boolean;
  poorReadingStamina?: boolean;
  // Mechanics & Punctuation
  punctuationErrors?: boolean;
  doesNotPauseAtFullStop?: boolean;
  extraPausesAtCommas?: boolean;
  incorrectToneForQuestionExclamation?: boolean;
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

