import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models';

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  profileId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export class AuthUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  static authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    try {
      const decoded = AuthUtils.verifyToken(token);
      
      // Ensure req.user has the correct id field (map userId to id if needed)
      req.user = {
        ...decoded,
        id: decoded.id || decoded.userId, // Use id if present, otherwise use userId
        userId: decoded.userId || decoded.id // Ensure userId is also available
      };
      
      next();
    } catch (error) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
  }

  static requireRole(allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      const hasPermission = allowedRoles.includes(req.user.role);

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }

      next();
    };
  }

  static requireAnyRole(...roles: UserRole[]) {
    return AuthUtils.requireRole(roles);
  }

  static requireAdminOrSuperSpecialEducator() {
    return AuthUtils.requireRole([UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR]);
  }

  static requireEducatorRoles() {
    return AuthUtils.requireRole([
      UserRole.ADMIN,
      UserRole.SUPER_SPECIAL_EDUCATOR,
      UserRole.SPECIAL_EDUCATOR
    ]);
  }
}
