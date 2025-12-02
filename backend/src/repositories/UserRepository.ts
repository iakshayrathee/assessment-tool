import { PrismaClient, User, UserRole } from '@prisma/client';
import { UserProfile, AdminProfileData, EducatorProfileData, CenterProfileData, ParentProfileData, SchoolViewerProfileData } from '../models';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private convertDateFields(data: any): any {
    const converted = { ...data };
    
    // Convert date string fields to Date objects
    const dateFields = ['dateOfBirth', 'rciValidityDate', 'startDate', 'targetDate', 'sessionDate', 'registrationDate'];
    
    dateFields.forEach(field => {
      if (converted[field] && typeof converted[field] === 'string') {
        // Convert date string to Date object
        converted[field] = new Date(converted[field]);
      }
    });
    
    return converted;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        adminProfile: true,
        superSpecialEducatorProfile: true,
        specialEducatorProfile: true,
        centerProfile: true,
        parentProfile: true,
        schoolViewerProfile: {
          include: {
            school: true
          }
        }
      }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
        superSpecialEducatorProfile: true,
        specialEducatorProfile: true,
        centerProfile: true,
        parentProfile: true,
        schoolViewerProfile: {
          include: {
            school: true
          }
        }
      }
    });
  }

  async create(email: string, hashedPassword: string, role: UserRole): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role
      }
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
  }

  async deactivateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async activateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: true }
    });
  }

  // Profile management methods
  async createAdminProfile(userId: string, profileData: AdminProfileData): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.adminProfile.create({
      data: {
        userId,
        ...convertedData
      }
    });
  }

  async updateAdminProfile(userId: string, profileData: Partial<AdminProfileData>): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.adminProfile.update({
      where: { userId },
      data: convertedData
    });
  }

  async createSpecialEducatorProfile(userId: string, profileData: EducatorProfileData): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.specialEducatorProfile.create({
      data: {
        userId,
        ...convertedData
      }
    });
  }

  async updateSpecialEducatorProfile(userId: string, profileData: Partial<EducatorProfileData>): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.specialEducatorProfile.update({
      where: { userId },
      data: convertedData
    });
  }

  async createSuperSpecialEducatorProfile(userId: string, profileData: EducatorProfileData): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.superSpecialEducatorProfile.create({
      data: {
        userId,
        ...convertedData
      }
    });
  }

  async updateSuperSpecialEducatorProfile(userId: string, profileData: Partial<EducatorProfileData>): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.superSpecialEducatorProfile.update({
      where: { userId },
      data: convertedData
    });
  }

  async createCenterProfile(userId: string, profileData: CenterProfileData): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.centerProfile.create({
      data: {
        userId,
        ...convertedData
      }
    });
  }

  async updateCenterProfile(userId: string, profileData: Partial<CenterProfileData>): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.centerProfile.update({
      where: { userId },
      data: convertedData
    });
  }

  async createParentProfile(userId: string, profileData: ParentProfileData): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.parentProfile.create({
      data: {
        userId,
        ...convertedData
      }
    });
  }

  async updateParentProfile(userId: string, profileData: Partial<ParentProfileData>): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.parentProfile.update({
      where: { userId },
      data: convertedData
    });
  }

  async createSchoolViewerProfile(userId: string, profileData: SchoolViewerProfileData): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.schoolViewerProfile.create({
      data: {
        userId,
        ...convertedData
      }
    });
  }

  async updateSchoolViewerProfile(userId: string, profileData: Partial<SchoolViewerProfileData>): Promise<void> {
    const convertedData = this.convertDateFields(profileData);
    await this.prisma.schoolViewerProfile.update({
      where: { userId },
      data: convertedData
    });
  }

  // List and search methods
  async findAllByRole(role: UserRole, page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role },
        skip,
        take: limit,
        include: {
          adminProfile: true,
          superSpecialEducatorProfile: true,
          specialEducatorProfile: true,
          centerProfile: true,
          parentProfile: true,
          schoolViewerProfile: {
            include: {
              school: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where: { role } })
    ]);

    return { users, total };
  }

  async searchUsers(query: string, role?: UserRole, page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { adminProfile: { fullName: { contains: query, mode: 'insensitive' } } },
        { superSpecialEducatorProfile: { fullName: { contains: query, mode: 'insensitive' } } },
        { specialEducatorProfile: { fullName: { contains: query, mode: 'insensitive' } } },
        { centerProfile: { centerName: { contains: query, mode: 'insensitive' } } },
        { parentProfile: { fullName: { contains: query, mode: 'insensitive' } } },
        { schoolViewerProfile: { fullName: { contains: query, mode: 'insensitive' } } }
      ]
    };

    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          adminProfile: true,
          superSpecialEducatorProfile: true,
          specialEducatorProfile: true,
          centerProfile: true,
          parentProfile: true,
          schoolViewerProfile: {
            include: {
              school: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where: whereClause })
    ]);

    return { users, total };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    totalSuperSpecialEducators: number;
    totalSpecialEducators: number;
    totalCenters: number;
    totalParents: number;
    totalSchoolViewers: number;
    activeUsers: number;
  }> {
    const [
      totalUsers,
      totalAdmins,
      totalSuperSpecialEducators,
      totalSpecialEducators,
      totalCenters,
      totalParents,
      totalSchoolViewers,
      activeUsers
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { role: UserRole.SUPER_SPECIAL_EDUCATOR } }),
      this.prisma.user.count({ where: { role: UserRole.SPECIAL_EDUCATOR } }),
      this.prisma.user.count({ where: { role: UserRole.CENTER } }),
      this.prisma.user.count({ where: { role: UserRole.PARENT } }),
      this.prisma.user.count({ where: { role: UserRole.SCHOOL_VIEWER } }),
      this.prisma.user.count({ where: { isActive: true } })
    ]);

    return {
      totalUsers,
      totalAdmins,
      totalSuperSpecialEducators,
      totalSpecialEducators,
      totalCenters,
      totalParents,
      totalSchoolViewers,
      activeUsers
    };
  }

  async createApprovalRequest(data: {
    type: 'USER_CREATION' | 'ROLE_ASSIGNMENT' | 'CENTER_CREATION' | 'SCHOOL_CREATION';
    requestedById: string;
    targetUserId?: string;
    targetCenterId?: string;
    targetSchoolId?: string;
    requestedRole?: UserRole;
    requestedData: any;
    comments?: string;
  }) {
    return this.prisma.approvalRequest.create({
      data: {
        type: data.type,
        status: 'PENDING',
        requestedById: data.requestedById,
        targetUserId: data.targetUserId,
        targetCenterId: data.targetCenterId,
        targetSchoolId: data.targetSchoolId,
        requestedRole: data.requestedRole,
        requestedData: data.requestedData,
        comments: data.comments
      }
    });
  }
}
