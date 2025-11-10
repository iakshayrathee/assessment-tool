import { Request, Response } from 'express';
import { SuperSpecialEducatorService } from '../services/SuperSpecialEducatorService';
import { AuthenticatedRequest } from '../utils/auth';

export class SuperSpecialEducatorController {
  private superSpecialEducatorService: SuperSpecialEducatorService;

  constructor() {
    this.superSpecialEducatorService = new SuperSpecialEducatorService();
  }

  /**
   * Get Super Special Educator dashboard data
   * Includes center overview, educator tracking, pending reviews
   */
  getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const dashboardData = await this.superSpecialEducatorService.getDashboardData(userId);
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error fetching Super Special Educator dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  };

  /**
   * Get Super Special Educator profile
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const profile = await this.superSpecialEducatorService.getProfile(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error fetching Super Special Educator profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  };

  /**
   * Update Super Special Educator profile
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updatedProfile = await this.superSpecialEducatorService.updateProfile(userId, req.body);
      
      res.json({
        success: true,
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error updating Super Special Educator profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  };

  /**
   * Get all assigned centers with their details
   */
  getAssignedCenters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const centers = await this.superSpecialEducatorService.getAssignedCenters(
        userId, 
        { page, limit, search }
      );
      
      res.json(centers);
    } catch (error) {
      console.error('Error fetching assigned centers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned centers'
      });
    }
  };

  /**
   * Get all Special Educators under supervision
   */
  getAssignedEducators = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const centerId = req.query.centerId as string;

      const educators = await this.superSpecialEducatorService.getAssignedEducators(
        userId, 
        { page, limit, search, centerId }
      );
      
      res.json(educators);
    } catch (error) {
      console.error('Error fetching assigned educators:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned educators'
      });
    }
  };

  /**
   * Get all students under supervision (across all assigned educators)
   */
  getStudentsUnderSupervision = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const centerId = req.query.centerId as string;
      const educatorId = req.query.educatorId as string;
      const status = req.query.status as string;

      const students = await this.superSpecialEducatorService.getStudentsUnderSupervision(
        userId, 
        { page, limit, search, centerId, educatorId, status }
      );
      
      res.json(students);
    } catch (error) {
      console.error('Error fetching students under supervision:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students under supervision'
      });
    }
  };

  /**
   * Get reports pending review
   */
  getPendingReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const priority = req.query.priority as string;

      const pendingReviews = await this.superSpecialEducatorService.getPendingReviews(
        userId, 
        { page, limit, type, priority }
      );
      
      res.json(pendingReviews);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending reviews'
      });
    }
  };

  /**
   * Review and approve/reject a report
   */
  reviewReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { reportId } = req.params;
      const { action, comments, recommendations } = req.body;

      const reviewedReport = await this.superSpecialEducatorService.reviewReport(
        userId,
        reportId,
        action,
        comments,
        recommendations
      );
      
      res.json({
        success: true,
        data: reviewedReport
      });
    } catch (error) {
      console.error('Error reviewing report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review report'
      });
    }
  };

  /**
   * Get flagged cases (students with minimal progress or escalated issues)
   */
  getFlaggedCases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const severity = req.query.severity as string;
      const centerId = req.query.centerId as string;

      const flaggedCases = await this.superSpecialEducatorService.getFlaggedCases(
        userId, 
        { page, limit, severity, centerId }
      );
      
      res.json(flaggedCases);
    } catch (error) {
      console.error('Error fetching flagged cases:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch flagged cases'
      });
    }
  };

  /**
   * Create training log entry
   */
  createTrainingLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const trainingLog = await this.superSpecialEducatorService.createTrainingLog(
        userId,
        req.body
      );
      
      res.json({
        success: true,
        data: trainingLog
      });
    } catch (error) {
      console.error('Error creating training log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create training log'
      });
    }
  };

  /**
   * Get training logs
   */
  getTrainingLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const educatorId = req.query.educatorId as string;

      const trainingLogs = await this.superSpecialEducatorService.getTrainingLogs(
        userId, 
        { page, limit, educatorId }
      );
      
      res.json(trainingLogs);
    } catch (error) {
      console.error('Error fetching training logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training logs'
      });
    }
  };

  /**
   * Get cross-center comparison data
   */
  getCrossCenterComparison = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const period = req.query.period as string || 'month';
      const metrics = req.query.metrics as string;

      const comparisonData = await this.superSpecialEducatorService.getCrossCenterComparison(
        userId,
        period,
        metrics?.split(',')
      );
      
      res.json({
        success: true,
        data: comparisonData
      });
    } catch (error) {
      console.error('Error fetching cross-center comparison:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cross-center comparison'
      });
    }
  };

  /**
   * Get performance analytics for assigned centers/educators
   */
  getPerformanceAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const period = req.query.period as string || 'month';
      const centerId = req.query.centerId as string;

      const analytics = await this.superSpecialEducatorService.getPerformanceAnalytics(
        userId,
        period,
        centerId
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch performance analytics'
      });
    }
  };

  /**
   * Get recent activities across all supervised entities
   */
  getRecentActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;

      const activities = await this.superSpecialEducatorService.getRecentActivities(
        userId,
        limit,
        type
      );
      
      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activities'
      });
    }
  };

  /**
   * Create a new Special Educator
   */
  createSpecialEducator = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const specialEducator = await this.superSpecialEducatorService.createSpecialEducator(
        userId,
        req.body
      );
      
      res.status(201).json({
        success: true,
        data: specialEducator,
        message: 'Special Educator created successfully'
      });
    } catch (error: any) {
      console.error('Error creating Special Educator:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create Special Educator'
      });
    }
  };
}
