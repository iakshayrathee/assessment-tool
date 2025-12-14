import { Request, Response } from 'express';
import { SpecialEducatorService } from '../services/SpecialEducatorService';
import { AuthenticatedRequest } from '../utils/auth';
import { validateSpecialEducatorProfile } from '../utils/validation';

export class SpecialEducatorController {
  private specialEducatorService: SpecialEducatorService;

  constructor() {
    this.specialEducatorService = new SpecialEducatorService();
  }

  /**
   * Get special educator dashboard data
   */
  getDashboard = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const dashboardData = await this.specialEducatorService.getDashboardData(educatorId);

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error getting educator dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard data'
      });
    }
  };

  /**
   * Get special educator profile
   */
  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const profile = await this.specialEducatorService.getProfile(userId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error getting educator profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  };

  /**
   * Update special educator profile
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Validate profile data
      const validation = validateSpecialEducatorProfile(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
      }

      const updatedProfile = await this.specialEducatorService.updateProfile(userId, req.body);

      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating educator profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  };

  /**
   * Get assigned students
   */
  getAssignedStudents = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await this.specialEducatorService.getAssignedStudents(
        educatorId,
        { page, limit, search, status }
      );

      res.json({
        success: true,
        data: result.students,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting assigned students:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get assigned students'
      });
    }
  };

  /**
   * Get student details with assessment summary
   */
  getStudentDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      const studentId = req.params.studentId;

      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const studentDetails = await this.specialEducatorService.getStudentDetails(
        educatorId,
        studentId
      );

      res.json({
        success: true,
        data: studentDetails
      });
    } catch (error) {
      console.error('Error getting student details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get student details'
      });
    }
  };

  /**
   * Get recent activities for the educator
   */
  getRecentActivities = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await this.specialEducatorService.getRecentActivities(educatorId, limit);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Error getting recent activities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recent activities'
      });
    }
  };

  /**
   * Get educator statistics
   */
  getStatistics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const stats = await this.specialEducatorService.getStatistics(educatorId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting educator statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics'
      });
    }
  };

  /**
   * Get today's schedule
   */
  getTodaysSchedule = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const schedule = await this.specialEducatorService.getTodaysSchedule(educatorId);

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Error getting today\'s schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get today\'s schedule'
      });
    }
  };

  /**
   * Create or update session note
   */
  createSessionNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const sessionNoteData = {
        ...req.body,
        specialEducatorId: educatorId
      };

      const sessionNote = await this.specialEducatorService.createSessionNote(sessionNoteData);

      res.status(201).json({
        success: true,
        data: sessionNote,
        message: 'Session note created successfully'
      });
    } catch (error) {
      console.error('Error creating session note:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create session note'
      });
    }
  };

  /**
   * Get session notes for a student
   */
  getSessionNotes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      const studentId = req.params.studentId;

      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.specialEducatorService.getSessionNotes(
        educatorId,
        studentId,
        { page, limit }
      );

      res.json({
        success: true,
        data: result.sessionNotes,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting session notes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session notes'
      });
    }
  };

  /**
   * Upload documents to educator's S3 folder
   */
  uploadDocuments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      // Import S3Service
      const { S3Service } = await import('../services/s3Service');
      const s3Service = new S3Service();

      // Upload files to educator's folder
      const folder = `educators/${educatorId}`;
      const uploadedKeys = await s3Service.uploadMultipleFiles(files, folder);

      res.status(201).json({
        success: true,
        data: {
          uploadedFiles: uploadedKeys.length,
          keys: uploadedKeys
        },
        message: `${uploadedKeys.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload documents'
      });
    }
  };

  /**
   * Get all documents for the educator
   */
  getDocuments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      // Import S3Service
      const { S3Service } = await import('../services/s3Service');
      const s3Service = new S3Service();

      // List all files in educator's folder
      const folder = `educators/${educatorId}`;
      const files = await s3Service.listFiles(folder);

      res.json({
        success: true,
        data: {
          files,
          total: files.length
        }
      });
    } catch (error) {
      console.error('Error getting documents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get documents'
      });
    }
  };

  /**
   * Delete a document from educator's S3 folder
   */
  deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const educatorId = req.user?.profileId;
      if (!educatorId) {
        return res.status(400).json({
          success: false,
          error: 'Special educator profile not found'
        });
      }

      const fileKey = decodeURIComponent(req.params.fileKey);

      // Verify the file belongs to this educator
      const folder = `educators/${educatorId}`;
      if (!fileKey.startsWith(folder)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this file'
        });
      }

      // Import S3Service
      const { S3Service } = await import('../services/s3Service');
      const s3Service = new S3Service();

      // Delete file from S3
      await s3Service.deleteFile(fileKey);

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete document'
      });
    }
  };
}
