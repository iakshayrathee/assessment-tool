import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../utils/auth';
import { CenterService } from '../services/CenterService';
import { AppError } from '../utils/errors';

export class CenterController {
  private centerService: CenterService;

  constructor(private prisma: PrismaClient) {
    this.centerService = new CenterService(prisma);
  }

  // Create new center
  async createCenter(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        email,
        password,
        centerName,
        address,
        phone,
        contactPerson,
        operatingHours,
        description
      } = req.body;

      // Create user account first
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'CENTER',
          centerProfile: {
            create: {
              centerName,
              address,
              phone: phone || email, // Use email as fallback
              email,
              contactPerson,
              operatingHours,
              description
            }
          }
        },
        include: {
          centerProfile: true
        }
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: 'Center created successfully'
      });
    } catch (error: any) {
      console.error('Create center error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create center'
      });
    }
  }

  // Get centers with pagination
  async getCenters(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { centerProfile: { centerName: { contains: search, mode: 'insensitive' } } },
          { centerProfile: { contactPerson: { contains: search, mode: 'insensitive' } } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Role-based filtering
      if (req.user?.role === 'CENTER') {
        where.id = req.user.userId;
      }

      const [centers, total] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            role: 'CENTER',
            ...where
          },
          include: {
            centerProfile: {
              include: {
                schools: true,
                students: {
                  select: { id: true }
                },
                assignments: {
                  include: {
                    specialEducator: {
                      select: {
                        id: true,
                        fullName: true
                      }
                    },
                    superSpecialEducator: {
                      select: {
                        id: true,
                        fullName: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.user.count({
          where: {
            role: 'CENTER',
            ...where
          }
        })
      ]);

      // Remove passwords from response
      const centersWithoutPasswords = centers.map(({ password, ...center }) => center);

      res.json({
        success: true,
        data: centersWithoutPasswords,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Get centers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch centers'
      });
    }
  }

  // Get center by ID
  async getCenterById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const center = await this.prisma.user.findFirst({
        where: {
          id,
          role: 'CENTER'
        },
        include: {
          centerProfile: {
            include: {
              schools: {
                include: {
                  students: {
                    select: {
                      id: true,
                      fullName: true,
                      status: true
                    }
                  }
                }
              },
              students: {
                include: {
                  assignments: {
                    include: {
                      specialEducator: {
                        select: {
                          id: true,
                          fullName: true
                        }
                      }
                    }
                  }
                }
              },
              assignments: {
                include: {
                  specialEducator: {
                    select: {
                      id: true,
                      fullName: true,
                      yearsOfExperience: true
                    }
                  },
                  superSpecialEducator: {
                    select: {
                      id: true,
                      fullName: true,
                      yearsOfExperience: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!center) {
        return res.status(404).json({
          success: false,
          error: 'Center not found'
        });
      }

      // Remove password from response
      const { password, ...centerWithoutPassword } = center;

      res.json({
        success: true,
        data: centerWithoutPassword
      });
    } catch (error: any) {
      console.error('Get center by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch center'
      });
    }
  }

  // Update center
  async updateCenter(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const {
        centerName,
        address,
        phone,
        email,
        contactPerson,
        operatingHours,
        description
      } = req.body;

      // Check if center exists
      const existingCenter = await this.prisma.user.findFirst({
        where: { id, role: 'CENTER' },
        include: { centerProfile: true }
      });

      if (!existingCenter) {
        return res.status(404).json({
          success: false,
          error: 'Center not found'
        });
      }

      // Update user and profile
      const updatedCenter = await this.prisma.user.update({
        where: { id },
        data: {
          email: email || existingCenter.email,
          centerProfile: {
            update: {
              centerName: centerName || existingCenter.centerProfile?.centerName,
              address: address || existingCenter.centerProfile?.address,
              phone: phone || existingCenter.centerProfile?.phone,
              email: email || existingCenter.centerProfile?.email,
              contactPerson: contactPerson || existingCenter.centerProfile?.contactPerson,
              operatingHours: operatingHours || existingCenter.centerProfile?.operatingHours,
              description: description || existingCenter.centerProfile?.description
            }
          }
        },
        include: {
          centerProfile: true
        }
      });

      // Remove password from response
      const { password, ...centerWithoutPassword } = updatedCenter;

      res.json({
        success: true,
        data: centerWithoutPassword,
        message: 'Center updated successfully'
      });
    } catch (error: any) {
      console.error('Update center error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update center'
      });
    }
  }

  // Get current user's center dashboard data (no ID required)
  async getCurrentUserCenterDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'CENTER') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only center users can access this endpoint.'
        });
      }

      const centerUser = await this.prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { centerProfile: true }
      });

      const centerId = centerUser?.centerProfile?.id;
      if (!centerId) {
        return res.status(400).json({
          success: false,
          error: 'Center profile not found for user'
        });
      }

      const dashboardData = await this.centerService.getCenterDashboard(
        centerId,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      console.error('Get current user center dashboard error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch center dashboard'
      });
    }
  }

  // Get center dashboard data
  async getCenterDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      // For CENTER role, get their own center ID from the database
      let centerId: string | undefined = req.params.id;
      
      if (req.user?.role === 'CENTER') {
        const centerUser = await this.prisma.user.findUnique({
          where: { id: req.user.userId },
          include: { centerProfile: true }
        });
        centerId = centerUser?.centerProfile?.id;
      }

      if (!centerId) {
        return res.status(400).json({
          success: false,
          error: 'Center ID is required'
        });
      }

      const dashboardData = await this.centerService.getCenterDashboard(
        centerId,
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      console.error('Get center dashboard error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch center dashboard'
      });
    }
  }

  // Link school to center
  async linkSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id: centerId } = req.params;
      const { name, address, phone, email, principalName } = req.body;

      // Verify center exists - try both id and userId
      let center = await this.prisma.centerProfile.findUnique({
        where: { id: centerId }
      });

      // If not found by id, try by userId
      if (!center) {
        center = await this.prisma.centerProfile.findUnique({
          where: { userId: centerId }
        });
      }

      if (!center) {
        return res.status(404).json({
          success: false,
          error: 'Center not found'
        });
      }

      const school = await this.prisma.school.create({
        data: {
          name,
          address,
          phone,
          email,
          principalName,
          centerId: center.id
        }
      });

      res.status(201).json({
        success: true,
        data: school,
        message: 'School linked to center successfully'
      });
    } catch (error: any) {
      console.error('Link school error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to link school'
      });
    }
  }

  // Assign educator to center
  async assignEducator(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: centerId } = req.params;
      const { educatorId, educatorType } = req.body;

      // Verify center exists - try both id and userId
      let center = await this.prisma.centerProfile.findUnique({
        where: { id: centerId }
      });

      // If not found by id, try by userId
      if (!center) {
        center = await this.prisma.centerProfile.findUnique({
          where: { userId: centerId }
        });
      }

      if (!center) {
        return res.status(404).json({
          success: false,
          error: 'Center not found'
        });
      }

      // Create assignment
      const assignmentData: any = {
        centerId: center.id
      };

      if (educatorType === 'SPECIAL_EDUCATOR') {
        assignmentData.specialEducatorId = educatorId;
      } else if (educatorType === 'SUPER_SPECIAL_EDUCATOR') {
        assignmentData.superSpecialEducatorId = educatorId;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid educator type'
        });
      }

      const assignment = await this.prisma.centerAssignment.create({
        data: assignmentData,
        include: {
          specialEducator: {
            select: {
              id: true,
              fullName: true
            }
          },
          superSpecialEducator: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Educator assigned to center successfully'
      });
    } catch (error: any) {
      console.error('Assign educator error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign educator'
      });
    }
  }

  // Get center students with filtering
  async getCenterStudents(req: AuthenticatedRequest, res: Response) {
    try {
      const centerId = req.params.id;
      const {
        page = 1,
        limit = 10,
        search,
        status,
        schoolId,
        hasAssignment
      } = req.query;

      const result = await this.centerService.getCenterStudents(centerId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as any,
        schoolId: schoolId as string,
        hasAssignment: hasAssignment === 'true' ? true : hasAssignment === 'false' ? false : undefined
      });

      res.json({
        success: true,
        data: result.students,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Get center students error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch center students'
      });
    }
  }

  // Get center schools
  async getCenterSchools(req: AuthenticatedRequest, res: Response) {
    try {
      const centerId = req.params.id;
      const schools = await this.centerService.getCenterSchools(centerId);

      res.json({
        success: true,
        data: schools
      });
    } catch (error: any) {
      console.error('Get center schools error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch center schools'
      });
    }
  }

  // Get center educators
  async getCenterEducators(req: AuthenticatedRequest, res: Response) {
    try {
      const centerId = req.params.id;
      const { page = 1, limit = 50, search } = req.query;
      
      const result = await this.centerService.getCenterEducators(centerId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string
      });

      res.json({
        success: true,
        data: result.educators,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Get center educators error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch center educators'
      });
    }
  }

  // Remove educator assignment
  async removeEducatorAssignment(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: centerId, assignmentId } = req.params;
      
      await this.centerService.removeEducatorAssignment(centerId, assignmentId);

      res.json({
        success: true,
        message: 'Educator assignment removed successfully'
      });
    } catch (error: any) {
      console.error('Remove educator assignment error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to remove educator assignment'
      });
    }
  }

  // Get center reports with pagination and filtering
  async getCenterReports(req: Request, res: Response): Promise<void> {
    try {
      const centerId = req.params.id;
      const { page = 1, limit = 10, type, status } = req.query;

      const reports = await this.centerService.getCenterReports(
        centerId,
        {
          page: Number(page),
          limit: Number(limit),
          type: type as string,
          status: status as string
        }
      );

      res.json({
        success: true,
        data: reports.data,
        pagination: reports.pagination
      });
    } catch (error) {
      console.error('Get center reports error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get center reports'
        });
      }
    }
  }

  // Get compliance monitoring data
  async getCenterCompliance(req: Request, res: Response): Promise<void> {
    try {
      const centerId = req.params.id;
      
      const complianceData = await this.centerService.getCenterCompliance(centerId);

      res.json({
        success: true,
        data: complianceData
      });
    } catch (error) {
      console.error('Get center compliance error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get center compliance data'
        });
      }
    }
  }

  // Get overdue reports
  async getCenterOverdueReports(req: Request, res: Response): Promise<void> {
    try {
      const centerId = req.params.id;
      const { page = 1, limit = 10 } = req.query;

      const overdueReports = await this.centerService.getCenterOverdueReports(
        centerId,
        {
          page: Number(page),
          limit: Number(limit)
        }
      );

      res.json({
        success: true,
        data: overdueReports.data,
        pagination: overdueReports.pagination
      });
    } catch (error) {
      console.error('Get center overdue reports error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get center overdue reports'
        });
      }
    }
  }

  // Get available special educators for assignment
  async getAvailableEducators(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 100 } = req.query;
      
      const result = await this.centerService.getAvailableEducators({
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      return res.json({
        success: true,
        data: result.educators,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Get available educators error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch available educators'
      });
    }
  }

  // Get cities and centers data for work locations dropdown
  async getCitiesAndCenters(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const citiesAndCenters = await this.centerService.getCitiesAndCenters();

      return res.json({
        success: true,
        data: citiesAndCenters
      });
    } catch (error: any) {
      console.error('Get cities and centers error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch cities and centers data'
      });
    }
  }
}
