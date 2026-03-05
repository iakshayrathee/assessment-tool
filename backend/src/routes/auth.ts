import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email';

const router = Router();
const prisma = new PrismaClient();

// Helper function to verify JWT token
const verifyToken = (token: string) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.verify(token, JWT_SECRET) as any;
};

// Helper function to generate JWT token
const generateToken = (payload: any) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// Helper function to hash password
const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

// Helper function to compare password
const comparePassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};

// POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        adminProfile: true,
        centerProfile: true,
        specialEducatorProfile: true,
        superSpecialEducatorProfile: true,
        parentProfile: true,
        schoolViewerProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is deactivated. Please contact administrator.' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Prepare user profile
    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: user.adminProfile || user.centerProfile || user.specialEducatorProfile ||
        user.superSpecialEducatorProfile || user.parentProfile || user.schoolViewerProfile,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      data: {
        user: userProfile,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role, profileData } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Email, password, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid user role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        isActive: true
      }
    });

    // Create role-specific profile
    let profile;
    switch (role) {
      case UserRole.ADMIN:
        profile = await prisma.adminProfile.create({
          data: { userId: user.id, ...profileData }
        });
        break;
      case UserRole.CENTER:
        profile = await prisma.centerProfile.create({
          data: { userId: user.id, ...profileData }
        });
        break;
      case UserRole.SPECIAL_EDUCATOR:
        profile = await prisma.specialEducatorProfile.create({
          data: { userId: user.id, ...profileData }
        });
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        profile = await prisma.superSpecialEducatorProfile.create({
          data: { userId: user.id, ...profileData }
        });
        break;
      case UserRole.PARENT:
        profile = await prisma.parentProfile.create({
          data: { userId: user.id, ...profileData }
        });
        break;
      case UserRole.SCHOOL_VIEWER:
        profile = await prisma.schoolViewerProfile.create({
          data: { userId: user.id, ...profileData }
        });
        break;
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile,
      lastLogin: user.lastLogin
    };

    res.json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/change-password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const { currentPassword, newPassword } = req.body;

    // Basic validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedNewPassword }
    });

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.json({ success: true, data: { message: 'If an account with that email exists, a password reset link has been sent.' } });
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the token in the database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt
      }
    });

    // Send the reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    const responseData: any = {
      message: 'If an account with that email exists, a password reset link has been sent.'
    };

    // In development, include the preview URL so devs can see the email
    if (emailResult.previewUrl) {
      responseData.previewUrl = emailResult.previewUrl;
    }

    res.json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset link. Please request a new one.' });
    }

    if (resetToken.used) {
      return res.status(400).json({ success: false, error: 'This reset link has already been used. Please request a new one.' });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'This reset link has expired. Please request a new one.' });
    }

    // Hash the new password and update
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    res.json({ success: true, data: { message: 'Password has been reset successfully.' } });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true,
        centerProfile: true,
        specialEducatorProfile: true,
        superSpecialEducatorProfile: true,
        parentProfile: true,
        schoolViewerProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: user.adminProfile || user.centerProfile || user.specialEducatorProfile ||
        user.superSpecialEducatorProfile || user.parentProfile || user.schoolViewerProfile,
      lastLogin: user.lastLogin
    };

    res.json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update role-specific profile
    let updatedProfile;
    switch (user.role) {
      case UserRole.ADMIN:
        updatedProfile = await prisma.adminProfile.update({
          where: { userId: user.id },
          data: req.body
        });
        break;
      case UserRole.CENTER:
        updatedProfile = await prisma.centerProfile.update({
          where: { userId: user.id },
          data: req.body
        });
        break;
      case UserRole.SPECIAL_EDUCATOR:
        updatedProfile = await prisma.specialEducatorProfile.update({
          where: { userId: user.id },
          data: req.body
        });
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        updatedProfile = await prisma.superSpecialEducatorProfile.update({
          where: { userId: user.id },
          data: req.body
        });
        break;
      case UserRole.PARENT:
        updatedProfile = await prisma.parentProfile.update({
          where: { userId: user.id },
          data: req.body
        });
        break;
      case UserRole.SCHOOL_VIEWER:
        updatedProfile = await prisma.schoolViewerProfile.update({
          where: { userId: user.id },
          data: req.body
        });
        break;
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: updatedProfile,
      lastLogin: user.lastLogin
    };

    res.json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/validate-token
export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true,
        centerProfile: true,
        specialEducatorProfile: true,
        superSpecialEducatorProfile: true,
        parentProfile: true,
        schoolViewerProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: user.adminProfile || user.centerProfile || user.specialEducatorProfile ||
        user.superSpecialEducatorProfile || user.parentProfile || user.schoolViewerProfile,
      lastLogin: user.lastLogin
    };

    res.json({ success: true, data: userProfile });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    try {
      verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // In a more sophisticated setup, you might want to blacklist the token
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users/role/:role - Get users by role
export const getUsersByRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Role check
    if (![UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR].includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const { role } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: role as UserRole },
        skip: offset,
        take: limit,
        include: {
          adminProfile: true,
          centerProfile: true,
          specialEducatorProfile: true,
          superSpecialEducatorProfile: true,
          parentProfile: true,
          schoolViewerProfile: true
        }
      }),
      prisma.user.count({ where: { role: role as UserRole } })
    ]);

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.adminProfile || user.centerProfile || user.specialEducatorProfile ||
          user.superSpecialEducatorProfile || user.parentProfile || user.schoolViewerProfile,
        lastLogin: user.lastLogin
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users/search - Search users
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Role check
    if (![UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR].includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const { query, role } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    if (!query || (query as string).trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters long' });
    }

    const whereClause: any = {
      email: {
        contains: query as string,
        mode: 'insensitive'
      }
    };

    if (role) {
      whereClause.role = role as UserRole;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        include: {
          adminProfile: true,
          centerProfile: true,
          specialEducatorProfile: true,
          superSpecialEducatorProfile: true,
          parentProfile: true,
          schoolViewerProfile: true
        }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: user.adminProfile || user.centerProfile || user.specialEducatorProfile ||
          user.superSpecialEducatorProfile || user.parentProfile || user.schoolViewerProfile,
        lastLogin: user.lastLogin
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users/stats - Get user statistics
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Role check
    if (![UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR].includes(decoded.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        byRole: stats.reduce((acc, stat) => {
          acc[stat.role] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Setup routes
router.post('/login', login);
router.post('/register', register);
router.post('/change-password', changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/validate-token', validateToken);
router.post('/logout', logout);
router.get('/users/role/:role', getUsersByRole);
router.get('/users/search', searchUsers);
router.get('/users/stats', getUserStats);

export default router;
