import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../utils/auth';
import { ParentService } from '../services/ParentService';

export class ParentController {
  private parentService: ParentService;

  constructor(private prisma: PrismaClient) {
    this.parentService = new ParentService(prisma);
  }

  // Get parent dashboard data
  async getParentDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.role === 'PARENT' ? req.user.id : req.params.id;

      const dashboardData = await this.parentService.getDashboardData(parentId);

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      console.error('Get parent dashboard error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch parent dashboard'
      });
    }
  }

  // Submit parent concern
  async submitConcern(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { studentId, title, description, category, priority } = req.body;

      const concern = await this.parentService.createConcern(parentId, {
        studentId,
        title,
        description,
        category,
        priority
      });

      res.status(201).json({
        success: true,
        data: concern,
        message: 'Concern submitted successfully'
      });
    } catch (error: any) {
      console.error('Submit concern error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit concern'
      });
    }
  }

  // Get parent concerns
  async getConcerns(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await this.parentService.getConcerns(parentId, page, limit, status);

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get concerns error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch concerns'
      });
    }
  }

  // Upload parent document
  async uploadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { fileName, filePath, fileType, fileSize, category, description } = req.body;

      const document = await this.parentService.createDocument(parentId, {
        fileName,
        filePath,
        fileType,
        fileSize,
        category,
        description
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload document'
      });
    }
  }

  // Get parent documents
  async getDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;

      const result = await this.parentService.getDocuments(parentId, page, limit, category);

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch documents'
      });
    }
  }

  // Get child reports (for parent)
  async getChildReports(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { childId } = req.params;
      const reports = await this.parentService.getChildReports(parentId, childId);

      res.json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      console.error('Get child reports error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child reports'
      });
    }
  }

  // Get child IEP goals (for parent)
  async getChildIEPGoals(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { childId } = req.params;
      const iepGoals = await this.parentService.getChildIEPGoals(parentId, childId);

      res.json({
        success: true,
        data: iepGoals
      });
    } catch (error: any) {
      console.error('Get child IEP goals error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child IEP goals'
      });
    }
  }

  // Update parent profile
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { fullName, phone, address, emergencyContact } = req.body;

      const updatedParent = await this.parentService.updateProfile(parentId, {
        fullName,
        phone,
        address,
        emergencyContact
      });

      res.json({
        success: true,
        data: updatedParent,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Update parent profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  // Get child details (for parent)
  async getChildDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { childId } = req.params;
      const childDetails = await this.parentService.getChildDetails(parentId, childId);

      res.json({
        success: true,
        data: childDetails
      });
    } catch (error: any) {
      console.error('Get child details error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child details'
      });
    }
  }
}
