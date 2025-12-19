import { Request, Response } from 'express';
import { PrismaClient, ReportPeriodType } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../utils/auth';
import { CenterService } from '../services/CenterService';
import { CenterReportService } from '../services/CenterReportService';
import { AppError } from '../utils/errors';

export class CenterController {
  private centerService: CenterService;
  private centerReportService: CenterReportService;

  constructor(private prisma: PrismaClient) {
    this.centerService = new CenterService(prisma);
    this.centerReportService = new CenterReportService(prisma);
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

      const center = await this.prisma.centerProfile.findUnique({
        where: {
          id
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              createdAt: true,
              role: true
            }
          },
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
      });

      if (!center) {
        return res.status(404).json({
          success: false,
          error: 'Center not found'
        });
      }

      // Format the response to match frontend expectations
      const responseData = {
        id: center.user.id,
        email: center.user.email,
        isActive: center.user.isActive,
        createdAt: center.user.createdAt,
        centerProfile: {
          id: center.id,
          centerName: center.centerName,
          address: center.address,
          phone: center.phone,
          email: center.email,
          contactPerson: center.contactPerson,
          operatingHours: center.operatingHours,
          description: center.description,
          schools: center.schools,
          students: center.students,
          assignments: center.assignments
        }
      };

      res.json({
        success: true,
        data: responseData
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
      const { schoolId } = req.body;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID is required'
        });
      }

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

      // Handle case where schoolId might be an object instead of string
      let actualSchoolId: string | undefined;

      if (typeof schoolId === 'string') {
        actualSchoolId = schoolId;
      } else if (schoolId && typeof schoolId === 'object') {
        // Try to extract ID from different possible object structures
        actualSchoolId = schoolId.id || schoolId.schoolId || schoolId.value || schoolId._id;

        // If no ID found but we have school details, we need to create a new school
        if (!actualSchoolId && schoolId.name) {
          // Create a new school with the provided details
          const newSchool = await this.prisma.school.create({
            data: {
              name: schoolId.name,
              address: schoolId.address || null,
              phone: schoolId.phone || null,
              email: schoolId.email || null,
              principalName: schoolId.principalName || null,
              centerId: center.id
            }
          });

          res.status(200).json({
            success: true,
            data: newSchool,
            message: 'School created and linked to center successfully'
          });
          return;
        }
      }

      if (!actualSchoolId) {
        console.error('Invalid schoolId format:', schoolId);
        return res.status(400).json({
          success: false,
          error: 'Invalid school ID format. Expected string ID or object with id property'
        });
      }

      // Verify school exists
      const school = await this.prisma.school.findUnique({
        where: { id: actualSchoolId }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      // Update the school to link it to the center
      const updatedSchool = await this.prisma.school.update({
        where: { id: actualSchoolId },
        data: {
          centerId: center.id
        }
      });

      res.status(200).json({
        success: true,
        data: updatedSchool,
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
        // Find the special educator profile for this user
        const specialEducatorProfile = await this.prisma.specialEducatorProfile.findUnique({
          where: { userId: educatorId }
        });

        if (!specialEducatorProfile) {
          return res.status(404).json({
            success: false,
            error: 'Special educator profile not found for this user'
          });
        }

        assignmentData.specialEducatorId = specialEducatorProfile.id;
      } else if (educatorType === 'SUPER_SPECIAL_EDUCATOR') {
        // Find the super special educator profile for this user
        const superSpecialEducatorProfile = await this.prisma.superSpecialEducatorProfile.findUnique({
          where: { userId: educatorId }
        });

        if (!superSpecialEducatorProfile) {
          return res.status(404).json({
            success: false,
            error: 'Super special educator profile not found for this user'
          });
        }

        assignmentData.superSpecialEducatorId = superSpecialEducatorProfile.id;
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
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          type: type as string,
          status: status as string
        }
      );

      res.json({
        success: true,
        data: reports.data,
        pagination: reports.pagination
      });
    } catch (error: any) {
      console.error('Get center reports error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch center reports'
      });
    }
  }

  // Get center compliance monitoring data
  async getCenterCompliance(req: Request, res: Response) {
    try {
      const centerId = req.params.id;
      const compliance = await this.centerService.getCenterCompliance(centerId);

      res.json({
        success: true,
        data: compliance
      });
    } catch (error: any) {
      console.error('Get center compliance error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch center compliance data'
      });
    }
  }

  // Get overdue reports for a center
  async getCenterOverdueReports(req: Request, res: Response) {
    try {
      const centerId = req.params.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await this.centerService.getCenterOverdueReports(centerId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Get center overdue reports error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch overdue reports'
      });
    }
  }

  // Get all special educators (for assignment dropdown)
  async getAllSpecialEducators(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 100, search } = req.query;

      const result = await this.centerService.getAllSpecialEducators({
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
      console.error('Get all special educators error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch special educators'
      });
    }
  }

  // Get unlinked schools (schools not associated with any center)
  async getUnlinkedSchools(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 50, search } = req.query;

      const result = await this.centerService.getUnlinkedSchools({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Get unlinked schools error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch unlinked schools'
      });
    }
  }

  // ==================== CENTER REPORT ENDPOINTS ====================

  // Generate new center report snapshot
  async generateCenterSnapshot(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: centerId } = req.params;
      const { periodType = 'MONTHLY', startDate, endDate } = req.body;

      // Verify center access
      if (req.user?.role === 'CENTER') {
        const centerUser = await this.prisma.user.findUnique({
          where: { id: req.user.userId },
          include: { centerProfile: true }
        });

        if (!centerUser || centerUser.centerProfile?.id !== centerId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this center'
          });
        }
      }

      // Get default dates if not provided
      const start = startDate ? new Date(startDate) : getDefaultStartDate(periodType as ReportPeriodType);
      const end = endDate ? new Date(endDate) : new Date();

      // Invalidate cache first
      await this.centerReportService.invalidateCache(centerId, periodType as ReportPeriodType);

      // Generate new snapshot
      const snapshot = await this.centerReportService.generateCenterSnapshot(
        centerId,
        periodType as ReportPeriodType,
        start,
        end
      );

      res.json({
        success: true,
        message: 'Center report snapshot generated successfully',
        data: snapshot
      });
    } catch (error: any) {
      console.error('Generate center snapshot error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate center snapshot'
      });
    }
  }

  // List all snapshots for a center
  async listCenterSnapshots(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: centerId } = req.params;
      const { page = 1, limit = 20, periodType } = req.query;

      // Verify center access
      if (req.user?.role === 'CENTER') {
        const centerUser = await this.prisma.user.findUnique({
          where: { id: req.user.userId },
          include: { centerProfile: true }
        });

        if (!centerUser || centerUser.centerProfile?.id !== centerId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this center'
          });
        }
      }

      // Build where clause
      const where: any = { centerId };
      if (periodType) {
        where.periodType = periodType as ReportPeriodType;
      }

      // Get total count
      const total = await this.prisma.centerReportSnapshot.count({ where });

      // Get paginated snapshots
      const snapshots = await this.prisma.centerReportSnapshot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      res.json({
        success: true,
        data: snapshots,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('List center snapshots error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to list center snapshots'
      });
    }
  }

  // Get complete center report data (single optimized call)
  async getCompleteCenterReportData(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: centerId } = req.params;
      const { snapshotId, periodType = 'MONTHLY', startDate, endDate } = req.query;

      // Verify center access
      if (req.user?.role === 'CENTER') {
        const centerUser = await this.prisma.user.findUnique({
          where: { id: req.user.userId },
          include: { centerProfile: true }
        });

        if (!centerUser || centerUser.centerProfile?.id !== centerId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied to this center'
          });
        }
      }

      // Get center info
      const center = await this.prisma.centerProfile.findUnique({
        where: { id: centerId },
        select: {
          id: true,
          centerName: true,
          address: true,
          contactPerson: true
        }
      });

      if (!center) {
        return res.status(404).json({
          success: false,
          error: 'Center not found'
        });
      }

      let snapshot;

      // If snapshotId is provided, fetch that specific snapshot
      if (snapshotId) {
        snapshot = await this.prisma.centerReportSnapshot.findFirst({
          where: {
            id: snapshotId as string,
            centerId
          }
        });

        if (!snapshot) {
          return res.status(404).json({
            success: false,
            error: 'Snapshot not found'
          });
        }
      } else {
        // Otherwise, generate or retrieve snapshot based on period
        const start = startDate ? new Date(startDate as string) : getDefaultStartDate(periodType as ReportPeriodType);
        const end = endDate ? new Date(endDate as string) : new Date();

        snapshot = await this.centerReportService.generateCenterSnapshot(
          centerId,
          periodType as ReportPeriodType,
          start,
          end
        );
      }

      // Return complete data for all dashboard sections
      res.json({
        success: true,
        data: {
          snapshot,
          center,
          // Structured data for easy consumption
          coverage: {
            totalStudentsRegistered: snapshot.totalStudentsRegistered,
            studentsAssessed: snapshot.studentsAssessed,
            studentsUnderIntervention: snapshot.studentsUnderIntervention,
            newStudentsThisPeriod: snapshot.newStudentsThisPeriod,
            activeStudents: snapshot.activeStudents,
            exitedMainstreamed: snapshot.exitedMainstreamed
          },
          assessments: {
            totalAssessmentsConducted: snapshot.totalAssessmentsConducted,
            baselineAssessments: snapshot.baselineAssessments,
            reviewProgressAssessments: snapshot.reviewProgressAssessments,
            averageAssessmentTime: snapshot.averageAssessmentTime,
            assessmentsPerEducator: snapshot.assessmentsPerEducator
          },
          interventions: {
            individualInterventionPlans: snapshot.individualInterventionPlans,
            smallGroupInterventions: snapshot.smallGroupInterventions,
            totalInterventionSessions: snapshot.totalInterventionSessions,
            avgSessionsPerStudent: snapshot.avgSessionsPerStudent,
            avgDurationPerSession: snapshot.avgDurationPerSession
          },
          progress: {
            readingImprovement: snapshot.readingImprovement,
            writingImprovement: snapshot.writingImprovement,
            mathematicsImprovement: snapshot.mathematicsImprovement,
            attentionBehaviorImprovement: snapshot.attentionBehaviorImprovement
          },
          productivity: {
            activeSpecialEducators: snapshot.activeSpecialEducators,
            avgStudentsPerEducator: snapshot.avgStudentsPerEducator,
            avgSessionsPerEducator: snapshot.avgSessionsPerEducator,
            avgReportsGenerated: snapshot.avgReportsGenerated
          },
          compliance: {
            assessmentRecordsAvailable: snapshot.assessmentRecordsAvailable,
            interventionPlansDocumented: snapshot.interventionPlansDocumented,
            progressReviewsCompleted: snapshot.progressReviewsCompleted,
            parentReportsShared: snapshot.parentReportsShared
          }
        }
      });
    } catch (error: any) {
      console.error('Get complete center report data error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get center report data'
      });
    }
  }
}

/**
 * Helper function to get default start date based on period type
 */
function getDefaultStartDate(periodType: ReportPeriodType): Date {
  const now = new Date();

  if (periodType === ReportPeriodType.MONTHLY) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (periodType === ReportPeriodType.QUARTERLY) {
    const quarter = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), quarter * 3, 1);
  } else {
    return new Date(now.getFullYear(), 0, 1);
  }
}
