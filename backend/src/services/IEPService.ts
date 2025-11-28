import { PrismaClient, IEPDocument, IEPSubjectSection, IEPLongTermGoal, IEPShortTermGoal, IEPWeeklyEvaluation, IEPWeeklyActivity } from '@prisma/client';
import { IEPDocumentData, IEPSubjectSectionData, IEPLongTermGoalData, IEPShortTermGoalData, IEPWeeklyEvaluationData, IEPWeeklyActivityData, IEPDocumentWithRelations } from '../models/IEPModels';
import { IEPRepository } from '../repositories/IepRepository';

export class IEPService {
  private iepRepository: IEPRepository;

  constructor(prisma: PrismaClient) {
    this.iepRepository = new IEPRepository(prisma);
  }

  // Create a new IEP document
  async createIEPDocument(specialEducatorId: string, iepData: IEPDocumentData): Promise<IEPDocument> {
    // Validate special educator ID
    if (!specialEducatorId) {
      throw new Error('Special educator ID is required');
    }

    // Validate required fields
    if (!iepData.studentId || !iepData.title || !iepData.durationMonths || !iepData.startDate || !iepData.endDate) {
      throw new Error('Student ID, title, duration, start date, and end date are required');
    }

    if (iepData.endDate <= iepData.startDate) {
      throw new Error('End date must be after start date');
    }

    if (iepData.durationMonths <= 0) {
      throw new Error('Duration must be a positive number');
    }

    return await this.iepRepository.createIEPDocument(specialEducatorId, iepData);
  }

  // Get IEP document by ID with all relations
  async getIEPDocumentById(id: string): Promise<IEPDocumentWithRelations | null> {
    return await this.iepRepository.findIEPDocumentById(id);
  }

  // Get all IEP documents for a student
  async getIEPDocumentsByStudent(studentId: string): Promise<IEPDocumentWithRelations[]> {
    return await this.iepRepository.findIEPDocumentsByStudent(studentId);
  }

  // Get all IEP documents for an educator
  async getIEPDocumentsByEducator(educatorId: string): Promise<IEPDocumentWithRelations[]> {
    return await this.iepRepository.findIEPDocumentsByEducator(educatorId);
  }

  // Update IEP document
  async updateIEPDocument(id: string, updates: Partial<IEPDocumentData>): Promise<IEPDocument> {
    const existingDocument = await this.iepRepository.findIEPDocumentById(id);
    if (!existingDocument) {
      throw new Error('IEP document not found');
    }

    if (updates.endDate && updates.startDate && updates.endDate <= updates.startDate) {
      throw new Error('End date must be after start date');
    }

    return await this.iepRepository.updateIEPDocument(id, updates);
  }

  // Add subject section to IEP document
  async addSubjectSection(iepDocumentId: string, sectionData: IEPSubjectSectionData): Promise<IEPSubjectSection> {
    const existingDocument = await this.iepRepository.findIEPDocumentById(iepDocumentId);
    if (!existingDocument) {
      throw new Error('IEP document not found');
    }

    return await this.iepRepository.addSubjectSection(iepDocumentId, sectionData);
  }

  // Add long-term goal to subject section
  async addLongTermGoal(subjectSectionId: string, goalData: IEPLongTermGoalData): Promise<IEPLongTermGoal> {
    return await this.iepRepository.addLongTermGoal(subjectSectionId, goalData);
  }

  // Add short-term goal to subject section
  async addShortTermGoal(subjectSectionId: string, goalData: IEPShortTermGoalData): Promise<IEPShortTermGoal> {
    return await this.iepRepository.addShortTermGoal(subjectSectionId, goalData);
  }

  // Add weekly evaluation to IEP document
  async addWeeklyEvaluation(iepDocumentId: string, evaluationData: IEPWeeklyEvaluationData): Promise<IEPWeeklyEvaluation> {
    const existingDocument = await this.iepRepository.findIEPDocumentById(iepDocumentId);
    if (!existingDocument) {
      throw new Error('IEP document not found');
    }

    return await this.iepRepository.addWeeklyEvaluation(iepDocumentId, evaluationData);
  }

  // Add activity to weekly evaluation
  async addWeeklyActivity(weeklyEvaluationId: string, activityData: IEPWeeklyActivityData): Promise<IEPWeeklyActivity> {
    return await this.iepRepository.addWeeklyActivity(weeklyEvaluationId, activityData);
  }

  // Delete IEP document
  async deleteIEPDocument(id: string): Promise<void> {
    const existingDocument = await this.iepRepository.findIEPDocumentById(id);
    if (!existingDocument) {
      throw new Error('IEP document not found');
    }

    await this.iepRepository.deleteIEPDocument(id);
  }

  // Get weekly evaluation by ID
  async getWeeklyEvaluationById(id: string): Promise<IEPWeeklyEvaluation | null> {
    return await this.iepRepository.findWeeklyEvaluationById(id);
  }

  // Get subject section by ID
  async getSubjectSectionById(id: string): Promise<IEPSubjectSection | null> {
    return await this.iepRepository.findSubjectSectionById(id);
  }
}