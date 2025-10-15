import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../utils/auth';
import { UserRole } from '../models';

const prisma = new PrismaClient();

/**
 * Middleware to attach the profile ID to the request user object
 */
export const attachProfileId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  try {
    const { userId, role } = req.user;
    let profileId: string | undefined;

    // Get profile ID based on user role
    switch (role) {
      case UserRole.ADMIN:
        const adminProfile = await prisma.adminProfile.findUnique({ where: { userId } });
        profileId = adminProfile?.id;
        break;
      case UserRole.SPECIAL_EDUCATOR:
        const specialEducatorProfile = await prisma.specialEducatorProfile.findUnique({ where: { userId } });
        profileId = specialEducatorProfile?.id;
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        const superSpecialEducatorProfile = await prisma.superSpecialEducatorProfile.findUnique({ where: { userId } });
        profileId = superSpecialEducatorProfile?.id;
        break;
      case UserRole.CENTER:
        const centerProfile = await prisma.centerProfile.findUnique({ where: { userId } });
        profileId = centerProfile?.id;
        break;
      case UserRole.PARENT:
        const parentProfile = await prisma.parentProfile.findUnique({ where: { userId } });
        profileId = parentProfile?.id;
        break;
      case UserRole.SCHOOL_VIEWER:
        const schoolViewerProfile = await prisma.schoolViewerProfile.findUnique({ where: { userId } });
        profileId = schoolViewerProfile?.id;
        break;
    }

    // Attach profile ID to request user object
    if (profileId) {
      req.user.profileId = profileId;
    }

    next();
  } catch (error) {
    console.error('Error attaching profile ID:', error);
    next();
  }
};
