import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';

export class AuthController {
  private authService: AuthService;

  constructor(prisma: PrismaClient) {
    this.authService = new AuthService(prisma);
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const loginResponse = await this.authService.login(req.body);
      return ResponseHelper.success(res, loginResponse, 'Login successful');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 401);
    }
  }

  async register(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { email, password, role, profileData } = req.body;
      const userProfile = await this.authService.register(email, password, role, profileData);
      return ResponseHelper.success(res, userProfile, 'User registered successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(req.user!.userId, currentPassword, newPassword);
      return ResponseHelper.success(res, null, 'Password changed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { email } = req.body;
      const tempPassword = await this.authService.resetPassword(email);
      
      // In production, send email instead of returning password
      return ResponseHelper.success(res, { tempPassword }, 'Temporary password generated');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userProfile = await this.authService.getUserProfile(req.user!.userId);
      return ResponseHelper.success(res, userProfile);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const userProfile = await this.authService.updateUserProfile(req.user!.userId, req.body);
      return ResponseHelper.success(res, userProfile, 'Profile updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async validateToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.body;
      if (!token) {
        return ResponseHelper.error(res, 'Token is required', 400);
      }

      const userProfile = await this.authService.validateToken(token);
      return ResponseHelper.success(res, userProfile, 'Token is valid');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 401);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // In a more sophisticated setup, you might want to blacklist the token
      // For now, we'll just return success as the client should remove the token
      return ResponseHelper.success(res, null, 'Logged out successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getUsersByRole(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { role } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.authService.getUsersByRole(role as any, page, limit);
      return ResponseHelper.paginated(res, result.users, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async searchUsers(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { query, role } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || (query as string).trim().length < 2) {
        return ResponseHelper.error(res, 'Search query must be at least 2 characters long', 400);
      }

      const result = await this.authService.searchUsers(query as string, role as any, page, limit);
      return ResponseHelper.paginated(res, result.users, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const stats = await this.authService.getUserStats();
      return ResponseHelper.success(res, stats);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }
}
