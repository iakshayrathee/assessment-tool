import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../utils/auth';

export class SchoolController {
  constructor(private prisma: PrismaClient) {}

  // Get school by ID
  async getSchoolById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const school = await this.prisma.school.findUnique({
        where: { id },
        include: {
          center: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  isActive: true
                }
              }
            }
          },
          students: {
            include: {
              parent: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          viewers: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  isActive: true
                }
              }
            }
          }
        }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      res.json({
        success: true,
        data: school
      });
    } catch (error: any) {
      console.error('Get school by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch school'
      });
    }
  }

  // Update school
  async updateSchool(req: AuthenticatedRequest, res: Response) {
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
        name,
        address,
        phone,
        email,
        principalName
      } = req.body;

      // Check if school exists
      const existingSchool = await this.prisma.school.findUnique({
        where: { id }
      });

      if (!existingSchool) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      // Update school
      const updatedSchool = await this.prisma.school.update({
        where: { id },
        data: {
          name: name || existingSchool.name,
          address: address || existingSchool.address,
          phone: phone || existingSchool.phone,
          email: email || existingSchool.email,
          principalName: principalName || existingSchool.principalName
        },
        include: {
          center: true,
          students: true
        }
      });

      res.json({
        success: true,
        data: updatedSchool,
        message: 'School updated successfully'
      });
    } catch (error: any) {
      console.error('Update school error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update school'
      });
    }
  }

  // Delete school
  async deleteSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Check if school exists
      const existingSchool = await this.prisma.school.findUnique({
        where: { id },
        include: {
          students: true
        }
      });

      if (!existingSchool) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      // Check if school has students
      if (existingSchool.students.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete school with enrolled students. Please transfer or remove students first.'
        });
      }

      // Delete school
      await this.prisma.school.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'School deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete school error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete school'
      });
    }
  }

  // Get schools with pagination and filtering
  async getSchools(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const centerId = req.query.centerId as string;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { principalName: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (centerId) {
        where.centerId = centerId;
      }

      const [schools, total] = await Promise.all([
        this.prisma.school.findMany({
          where,
          include: {
            center: {
              select: {
                id: true,
                centerName: true
              }
            },
            students: {
              select: { id: true }
            },
            _count: {
              select: {
                students: true,
                viewers: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.school.count({ where })
      ]);

      res.json({
        success: true,
        data: schools,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Get schools error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch schools'
      });
    }
  }

  // Get school students
  async getSchoolStudents(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const where: any = {
        schoolId: id
      };

      if (search) {
        where.fullName = {
          contains: search,
          mode: 'insensitive'
        };
      }

      if (status) {
        where.status = status;
      }

      const [students, total] = await Promise.all([
        this.prisma.student.findMany({
          where,
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            },
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
          },
          skip,
          take: limit,
          orderBy: { registrationDate: 'desc' }
        }),
        this.prisma.student.count({ where })
      ]);

      res.json({
        success: true,
        data: students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Get school students error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch school students'
      });
    }
  }

  // Activate school
  async activateSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const school = await this.prisma.school.findUnique({
        where: { id }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      // Note: Schools don't have an isActive field in the current schema
      // This would require a schema update to add isActive field
      res.json({
        success: true,
        message: 'School activation feature requires schema update'
      });
    } catch (error: any) {
      console.error('Activate school error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate school'
      });
    }
  }

  // Deactivate school
  async deactivateSchool(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const school = await this.prisma.school.findUnique({
        where: { id }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }

      // Note: Schools don't have an isActive field in the current schema
      // This would require a schema update to add isActive field
      res.json({
        success: true,
        message: 'School deactivation feature requires schema update'
      });
    } catch (error: any) {
      console.error('Deactivate school error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate school'
      });
    }
  }
}
