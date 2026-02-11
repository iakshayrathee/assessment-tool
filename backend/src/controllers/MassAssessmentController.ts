import { Request, Response } from 'express';
import { MassAssessmentService } from '../services/MassAssessmentService';
import { MassAssessmentAIService } from '../services/MassAssessmentAIService';
import { DocumentParserService } from '../services/DocumentParserService';
import { QuestionExtractionService } from '../services/QuestionExtractionService';
import { MassAssessmentRepository } from '../repositories/MassAssessmentRepository';

const repository = new MassAssessmentRepository();
const massAssessmentService = new MassAssessmentService(repository);
const aiService = new MassAssessmentAIService(repository);
const documentParser = new DocumentParserService();
const questionExtractor = new QuestionExtractionService();

interface AuthenticatedRequest extends Request {
    user?: any;
}

export class MassAssessmentController {
    // POST /api/mass-assessment - Create new assessment
    static async createAssessment(req: AuthenticatedRequest, res: Response) {
        try {
            const { schoolId, centerId, grade, className, totalStudents } = req.body;
            const educatorId = req.user?.profileId || req.user?.id;

            if (!educatorId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const assessment = await massAssessmentService.createMassAssessment({
                educatorId,
                schoolId,
                centerId,
                grade,
                className,
                totalStudents,
            });

            res.status(201).json({
                success: true,
                assessment,
            });
        } catch (error) {
            console.error('Create assessment error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // POST /api/mass-assessment/:id/results - Submit student results
    static async submitResults(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const { studentId, scores, flags } = req.body;

            const result = await massAssessmentService.submitStudentScores(
                id,
                studentId,
                scores,
                flags
            );

            res.status(201).json({
                success: true,
                result,
            });
        } catch (error) {
            console.error('Submit results error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // POST /api/mass-assessment/:id/batch-results - Batch submit results
    static async batchSubmitResults(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const { results } = req.body;

            const processedResults = await massAssessmentService.batchSubmitScores(
                id,
                results
            );

            res.status(201).json({
                success: true,
                results: processedResults,
            });
        } catch (error) {
            console.error('Batch submit error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // GET /api/mass-assessment/:id - Get assessment details
    static async getAssessment(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const assessment = await repository.findById(id);

            if (!assessment) {
                return res.status(404).json({ error: 'Assessment not found' });
            }

            res.status(200).json({
                success: true,
                assessment,
            });
        } catch (error) {
            console.error('Get assessment error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // GET /api/mass-assessment/educator/:educatorId - Get educator's assessments
    static async getEducatorAssessments(req: AuthenticatedRequest, res: Response) {
        try {
            const educatorId = req.user?.profileId || req.user?.id;

            console.log('User object:', req.user);
            console.log('Extracted educatorId:', educatorId);

            if (!educatorId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const assessments = await repository.findByEducator(educatorId);
            
            console.log('Found assessments:', assessments.length);

            res.status(200).json({
                success: true,
                assessments,
            });
        } catch (error) {
            console.error('Get educator assessments error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // GET /api/mass-assessment/:id/heatmap - Get class heatmap
    static async getHeatmap(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const heatmap = await massAssessmentService.getClassHeatmap(id);

            res.status(200).json({
                success: true,
                heatmap,
            });
        } catch (error) {
            console.error('Get heatmap error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // GET /api/mass-assessment/:id/tiers - Get tier distribution
    static async getTierDistribution(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const distribution = await massAssessmentService.getTierDistribution(id);

            res.status(200).json({
                success: true,
                distribution,
            });
        } catch (error) {
            console.error('Get tier distribution error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // GET /api/mass-assessment/:id/tier/:tierLevel - Get students by tier
    static async getStudentsByTier(req: AuthenticatedRequest, res: Response) {
        try {
            const { id, tierLevel } = req.params;
            const students = await massAssessmentService.getStudentsByTier(
                id,
                tierLevel as any
            );

            res.status(200).json({
                success: true,
                students,
            });
        } catch (error) {
            console.error('Get students by tier error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // POST /api/mass-assessment/:id/analyze - Trigger AI analysis
    static async analyzeAssessment(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const analysis = await aiService.analyzeClassPatterns(id);

            res.status(200).json({
                success: true,
                analysis,
            });
        } catch (error) {
            console.error('Analyze assessment error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // GET /api/mass-assessment/:id/report - Generate educator report
    static async generateReport(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const report = await aiService.generateEducatorReport(id);

            res.status(200).json({
                success: true,
                report,
            });
        } catch (error) {
            console.error('Generate report error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // POST /api/mass-assessment/upload-document - Upload and create assessment
    static async uploadDocument(req: AuthenticatedRequest, res: Response) {
        try {
            const file = req.file;
            const { schoolId, grade, targetDomain } = req.body;
            const educatorId = req.user?.profileId || req.user?.id;

            console.log('User object:', req.user);
            console.log('Extracted educatorId:', educatorId);

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            if (!schoolId || !grade) {
                return res.status(400).json({ error: 'School and grade are required' });
            }

            if (!educatorId) {
                return res.status(401).json({ error: 'Unauthorized - No educator ID found' });
            }

            // Extract text from document
            const text = await documentParser.extractText(file.buffer, file.mimetype);

            // Extract questions using AI
            const result = await questionExtractor.extractQuestions(
                text,
                targetDomain,
                grade
            );

            // Create the assessment first
            const assessment = await massAssessmentService.createMassAssessment({
                educatorId,
                schoolId,
                grade,
                totalStudents: 0, // Will be updated when students are added
            });

            // Store extracted questions with the assessment
            console.log(`Created assessment ${assessment.id} with ${result.questions?.length || 0} questions`);

            res.status(201).json({
                success: true,
                assessment,
                extractedQuestions: result.questions || [],
                extractedText: text.substring(0, 500), // Preview
            });
        } catch (error) {
            console.error('Document upload error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }

    // PUT /api/mass-assessment/:id/results/:resultId/tier - Override tier allocation
    static async overrideTierAllocation(req: AuthenticatedRequest, res: Response) {
        try {
            const { resultId } = req.params;
            const { newTier, reason } = req.body;
            const educatorId = req.user?.profileId || req.user?.id;

            if (!educatorId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const updated = await massAssessmentService.overrideTierAllocation(
                resultId,
                newTier,
                educatorId,
                reason
            );

            res.status(200).json({
                success: true,
                result: updated,
            });
        } catch (error) {
            console.error('Override tier error:', error);
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    }
}
