import { PrismaClient, FormalAssessment, ReadingSkillAssessment, WritingSkillAssessment, MathSkillAssessment, AssessmentStatus } from '@prisma/client';
import { FormalAssessmentRepository, FormalAssessmentData } from '../repositories/FormalAssessmentRepository';
import { SkillAssessmentRepository, ReadingSkillAssessmentData, WritingSkillAssessmentData, MathSkillAssessmentData } from '../repositories/SkillAssessmentRepository';
import { ReadingScoreService } from './ReadingScoreService';

export class NewAssessmentService {
  private formalAssessmentRepository: FormalAssessmentRepository;
  private skillAssessmentRepository: SkillAssessmentRepository;
  private readingScoreService: ReadingScoreService;

  constructor(prisma: PrismaClient) {
    this.formalAssessmentRepository = new FormalAssessmentRepository(prisma);
    this.skillAssessmentRepository = new SkillAssessmentRepository(prisma);
    this.readingScoreService = new ReadingScoreService();
  }

  // Formal Assessment Services
  async createFormalAssessment(specialEducatorId: string, data: FormalAssessmentData): Promise<FormalAssessment> {
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }

    if (!data.assessmentType) {
      throw new Error('Assessment type is required');
    }

    if (!data.referralDate) {
      throw new Error('Referral date is required');
    }

    return await this.formalAssessmentRepository.create(specialEducatorId, data);
  }

  async getFormalAssessmentById(id: string): Promise<FormalAssessment> {
    const assessment = await this.formalAssessmentRepository.findById(id);
    if (!assessment) {
      throw new Error('Formal assessment not found');
    }
    return assessment;
  }

  async getFormalAssessmentsByStudent(studentId: string): Promise<FormalAssessment[]> {
    return await this.formalAssessmentRepository.findByStudent(studentId);
  }

  async getFormalAssessmentsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ assessments: FormalAssessment[]; total: number }> {
    return await this.formalAssessmentRepository.findByEducator(specialEducatorId, page, limit);
  }

  async updateFormalAssessment(id: string, data: Partial<FormalAssessmentData>): Promise<FormalAssessment> {
    const existingAssessment = await this.formalAssessmentRepository.findById(id);
    if (!existingAssessment) {
      throw new Error('Formal assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Cannot update completed assessment');
    }

    return await this.formalAssessmentRepository.update(id, data);
  }

  async completeFormalAssessment(id: string): Promise<FormalAssessment> {
    const existingAssessment = await this.formalAssessmentRepository.findById(id);
    if (!existingAssessment) {
      throw new Error('Formal assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Assessment is already completed');
    }

    return await this.formalAssessmentRepository.complete(id);
  }

  async deleteFormalAssessment(id: string): Promise<void> {
    const existingAssessment = await this.formalAssessmentRepository.findById(id);
    if (!existingAssessment) {
      throw new Error('Formal assessment not found');
    }

    await this.formalAssessmentRepository.delete(id);
  }

  // Reading Skill Assessment Services
  async createReadingAssessment(specialEducatorId: string, data: ReadingSkillAssessmentData): Promise<ReadingSkillAssessment> {
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }

    // Normalize assessmentDate: Prisma requires full ISO-8601 DateTime, not just a date string
    const normalizedData = { ...data };
    if (normalizedData.assessmentDate && typeof normalizedData.assessmentDate === 'string') {
      const d = normalizedData.assessmentDate as string;
      // If it's just "YYYY-MM-DD" without time, append midnight UTC
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        normalizedData.assessmentDate = new Date(`${d}T00:00:00.000Z`);
      } else {
        normalizedData.assessmentDate = new Date(d);
      }
    }

    // Compute scores from input data
    const scores = this.readingScoreService.computeScores(normalizedData);
    const enrichedData: ReadingSkillAssessmentData = {
      ...normalizedData,
      decodingScore: scores.decodingScore ?? undefined,
      fluencyScore: scores.fluencyScore ?? undefined,
      comprehensionScore: scores.comprehensionScore ?? undefined,
      behaviorScore: scores.behaviorScore ?? undefined,
      overallReadingScore: scores.overallReadingScore ?? undefined,
      knownTextLevel: scores.knownTextLevel ?? undefined,
      unknownTextLevel: scores.unknownTextLevel ?? undefined,
      finalReadingLevel: scores.finalReadingLevel ?? undefined,
      tier: scores.tier ?? undefined,
      ldRiskFlag: scores.ldRiskFlag,
      ldRiskDetails: scores.ldRiskDetails ?? undefined,
    };

    // Enrich error analysis with computed fields
    if (enrichedData.errorAnalysis && scores.errorAnalysisComputed) {
      enrichedData.errorAnalysis = {
        ...enrichedData.errorAnalysis,
        errorFrequencyPercent: scores.errorAnalysisComputed.errorFrequencyPercent,
        dominantErrorType: scores.errorAnalysisComputed.dominantErrorType,
      };
    }

    return await this.skillAssessmentRepository.createReadingAssessment(specialEducatorId, enrichedData);
  }

  async getReadingAssessmentById(id: string): Promise<ReadingSkillAssessment> {
    const assessment = await this.skillAssessmentRepository.findReadingAssessmentById(id);
    if (!assessment) {
      throw new Error('Reading assessment not found');
    }
    return assessment;
  }

  async getReadingAssessmentsByStudent(studentId: string): Promise<ReadingSkillAssessment[]> {
    return await this.skillAssessmentRepository.findReadingAssessmentsByStudent(studentId);
  }

  async updateReadingAssessment(id: string, data: Partial<ReadingSkillAssessmentData>): Promise<ReadingSkillAssessment> {
    const existingAssessment = await this.skillAssessmentRepository.findReadingAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Reading assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Cannot update completed assessment');
    }

    // Normalize assessmentDate to full ISO-8601 DateTime
    const normalizedData = { ...data };
    if (normalizedData.assessmentDate && typeof normalizedData.assessmentDate === 'string') {
      const d = normalizedData.assessmentDate as string;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        normalizedData.assessmentDate = new Date(`${d}T00:00:00.000Z`);
      } else {
        normalizedData.assessmentDate = new Date(d);
      }
    }

    // Merge existing data with updates for score computation
    const merged = { ...existingAssessment, ...normalizedData };
    const scores = this.readingScoreService.computeScores(merged);
    const enrichedData: Partial<ReadingSkillAssessmentData> = {
      ...normalizedData,
      decodingScore: scores.decodingScore ?? undefined,
      fluencyScore: scores.fluencyScore ?? undefined,
      comprehensionScore: scores.comprehensionScore ?? undefined,
      behaviorScore: scores.behaviorScore ?? undefined,
      overallReadingScore: scores.overallReadingScore ?? undefined,
      knownTextLevel: scores.knownTextLevel ?? undefined,
      unknownTextLevel: scores.unknownTextLevel ?? undefined,
      finalReadingLevel: scores.finalReadingLevel ?? undefined,
      tier: scores.tier ?? undefined,
      ldRiskFlag: scores.ldRiskFlag,
      ldRiskDetails: scores.ldRiskDetails ?? undefined,
    };

    if (enrichedData.errorAnalysis && scores.errorAnalysisComputed) {
      enrichedData.errorAnalysis = {
        ...enrichedData.errorAnalysis,
        errorFrequencyPercent: scores.errorAnalysisComputed.errorFrequencyPercent,
        dominantErrorType: scores.errorAnalysisComputed.dominantErrorType,
      };
    }

    return await this.skillAssessmentRepository.updateReadingAssessment(id, enrichedData);
  }

  async completeReadingAssessment(id: string): Promise<ReadingSkillAssessment> {
    const existingAssessment = await this.skillAssessmentRepository.findReadingAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Reading assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Assessment is already completed');
    }

    // Final score computation before completing
    const scores = this.readingScoreService.computeScores(existingAssessment);
    await this.skillAssessmentRepository.updateReadingAssessment(id, {
      studentId: existingAssessment.studentId,
      decodingScore: scores.decodingScore ?? undefined,
      fluencyScore: scores.fluencyScore ?? undefined,
      comprehensionScore: scores.comprehensionScore ?? undefined,
      behaviorScore: scores.behaviorScore ?? undefined,
      overallReadingScore: scores.overallReadingScore ?? undefined,
      knownTextLevel: scores.knownTextLevel ?? undefined,
      unknownTextLevel: scores.unknownTextLevel ?? undefined,
      finalReadingLevel: scores.finalReadingLevel ?? undefined,
      tier: scores.tier ?? undefined,
      ldRiskFlag: scores.ldRiskFlag,
      ldRiskDetails: scores.ldRiskDetails ?? undefined,
    });

    return await this.skillAssessmentRepository.completeReadingAssessment(id);
  }

  // Writing Skill Assessment Services
  async createWritingAssessment(specialEducatorId: string, data: WritingSkillAssessmentData): Promise<WritingSkillAssessment> {
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }

    return await this.skillAssessmentRepository.createWritingAssessment(specialEducatorId, data);
  }

  async getWritingAssessmentById(id: string): Promise<WritingSkillAssessment> {
    const assessment = await this.skillAssessmentRepository.findWritingAssessmentById(id);
    if (!assessment) {
      throw new Error('Writing assessment not found');
    }
    return assessment;
  }

  async getWritingAssessmentsByStudent(studentId: string): Promise<WritingSkillAssessment[]> {
    return await this.skillAssessmentRepository.findWritingAssessmentsByStudent(studentId);
  }

  async updateWritingAssessment(id: string, data: Partial<WritingSkillAssessmentData>): Promise<WritingSkillAssessment> {
    const existingAssessment = await this.skillAssessmentRepository.findWritingAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Writing assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Cannot update completed assessment');
    }

    return await this.skillAssessmentRepository.updateWritingAssessment(id, data);
  }

  async completeWritingAssessment(id: string): Promise<WritingSkillAssessment> {
    const existingAssessment = await this.skillAssessmentRepository.findWritingAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Writing assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Assessment is already completed');
    }

    return await this.skillAssessmentRepository.completeWritingAssessment(id);
  }

  // Math Skill Assessment Services
  async createMathAssessment(specialEducatorId: string, data: MathSkillAssessmentData): Promise<MathSkillAssessment> {
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }

    return await this.skillAssessmentRepository.createMathAssessment(specialEducatorId, data);
  }

  async getMathAssessmentById(id: string): Promise<MathSkillAssessment> {
    const assessment = await this.skillAssessmentRepository.findMathAssessmentById(id);
    if (!assessment) {
      throw new Error('Math assessment not found');
    }
    return assessment;
  }

  async getMathAssessmentsByStudent(studentId: string): Promise<MathSkillAssessment[]> {
    return await this.skillAssessmentRepository.findMathAssessmentsByStudent(studentId);
  }

  async updateMathAssessment(id: string, data: Partial<MathSkillAssessmentData>): Promise<MathSkillAssessment> {
    const existingAssessment = await this.skillAssessmentRepository.findMathAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Math assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Cannot update completed assessment');
    }

    return await this.skillAssessmentRepository.updateMathAssessment(id, data);
  }

  async completeMathAssessment(id: string): Promise<MathSkillAssessment> {
    const existingAssessment = await this.skillAssessmentRepository.findMathAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Math assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Assessment is already completed');
    }

    return await this.skillAssessmentRepository.completeMathAssessment(id);
  }
}

