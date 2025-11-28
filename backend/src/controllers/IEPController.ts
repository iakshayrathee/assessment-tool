import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { IEPService } from '../services/IEPService';
import { IEPDocumentData, IEPSubjectSectionData, IEPLongTermGoalData, IEPShortTermGoalData, IEPWeeklyEvaluationData, IEPWeeklyActivityData } from '../models/IEPModels';

export class IEPController {
  private iepService: IEPService;

  constructor(prisma: PrismaClient) {
    this.iepService = new IEPService(prisma);
  }

  // Create IEP document
  createIEPDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const specialEducatorId = (req as any).user?.profileId || (req as any).profileId;
      
      if (!specialEducatorId) {
        res.status(400).json({ error: 'Special educator profile ID is required' });
        return;
      }

      const iepData: IEPDocumentData = req.body;

      const document = await this.iepService.createIEPDocument(specialEducatorId, iepData);
      res.status(201).json(document);
    } catch (error: any) {
      console.error('Create IEP document error:', error);
      res.status(400).json({ error: error.message });
    }
  };

  // Get IEP document by ID
  getIEPDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const document = await this.iepService.getIEPDocumentById(id);

      if (!document) {
        res.status(404).json({ error: 'IEP document not found' });
        return;
      }

      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get IEP documents by student
  getIEPDocumentsByStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId } = req.params;
      const documents = await this.iepService.getIEPDocumentsByStudent(studentId);
      res.json(documents);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get IEP documents by educator
  getIEPDocumentsByEducator = async (req: Request, res: Response): Promise<void> => {
    try {
      const { educatorId } = req.params;
      const documents = await this.iepService.getIEPDocumentsByEducator(educatorId);
      res.json(documents);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Update IEP document
  updateIEPDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const document = await this.iepService.updateIEPDocument(id, updates);
      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Delete IEP document
  deleteIEPDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.iepService.deleteIEPDocument(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Add subject section
  addSubjectSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { iepDocumentId } = req.params;
      const sectionData: IEPSubjectSectionData = req.body;

      const section = await this.iepService.addSubjectSection(iepDocumentId, sectionData);
      res.status(201).json(section);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Add long-term goal
  addLongTermGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { subjectSectionId } = req.params;
      const goalData: IEPLongTermGoalData = req.body;

      const goal = await this.iepService.addLongTermGoal(subjectSectionId, goalData);
      res.status(201).json(goal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Add short-term goal
  addShortTermGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { subjectSectionId } = req.params;
      const goalData: IEPShortTermGoalData = req.body;

      const goal = await this.iepService.addShortTermGoal(subjectSectionId, goalData);
      res.status(201).json(goal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Add weekly evaluation
  addWeeklyEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { iepDocumentId } = req.params;
      const evaluationData: IEPWeeklyEvaluationData = req.body;

      const evaluation = await this.iepService.addWeeklyEvaluation(iepDocumentId, evaluationData);
      res.status(201).json(evaluation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Add weekly activity
  addWeeklyActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { weeklyEvaluationId } = req.params;
      const activityData: IEPWeeklyActivityData = req.body;

      const activity = await this.iepService.addWeeklyActivity(weeklyEvaluationId, activityData);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get weekly evaluation
  getWeeklyEvaluation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const evaluation = await this.iepService.getWeeklyEvaluationById(id);

      if (!evaluation) {
        res.status(404).json({ error: 'Weekly evaluation not found' });
        return;
      }

      res.json(evaluation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get subject section
  getSubjectSection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const section = await this.iepService.getSubjectSectionById(id);

      if (!section) {
        res.status(404).json({ error: 'Subject section not found' });
        return;
      }

      res.json(section);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}