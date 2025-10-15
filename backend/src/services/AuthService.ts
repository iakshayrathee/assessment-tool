import { PrismaClient, UserRole } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository';
import { AuthUtils } from '../utils/auth';
import { LoginRequest, LoginResponse, UserProfile, AdminProfileData, EducatorProfileData, CenterProfileData, ParentProfileData, SchoolViewerProfileData } from '../models';

export class AuthService {
  private userRepository: UserRepository;

  constructor(prisma: PrismaClient) {
    this.userRepository = new UserRepository(prisma);
  }

  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Get profile ID based on user role
    const profileId = this.getUserProfileId(user);
    
    // Generate JWT token
    const token = AuthUtils.generateToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      profileId
    });

    // Prepare user profile based on role
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: this.getUserProfileData(user),
      lastLogin: user.lastLogin
    };

    return {
      user: userProfile,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
  }

  async register(email: string, password: string, role: UserRole, profileData: any): Promise<UserProfile> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Create user
    const user = await this.userRepository.create(email, hashedPassword, role);

    // Create role-specific profile
    await this.createRoleProfile(user.id, role, profileData);

    // Fetch complete user data
    const completeUser = await this.userRepository.findById(user.id);
    if (!completeUser) {
      throw new Error('Failed to create user profile');
    }

    return {
      id: completeUser.id,
      email: completeUser.email,
      role: completeUser.role,
      isActive: completeUser.isActive,
      profile: this.getUserProfileData(completeUser),
      lastLogin: completeUser.lastLogin
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

    // Update password
    await this.userRepository.updatePassword(userId, hashedNewPassword);
  }

  async resetPassword(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User with this email does not exist');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedTempPassword = await AuthUtils.hashPassword(tempPassword);

    // Update password
    await this.userRepository.updatePassword(user.id, hashedTempPassword);

    // In a real application, you would send this via email
    return tempPassword;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: this.getUserProfileData(user),
      lastLogin: user.lastLogin
    };
  }

  async updateUserProfile(userId: string, profileData: any): Promise<UserProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update role-specific profile
    await this.updateRoleProfile(userId, user.role, profileData);

    // Fetch updated user data
    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser) {
      throw new Error('Failed to update user profile');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      profile: this.getUserProfileData(updatedUser),
      lastLogin: updatedUser.lastLogin
    };
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.userRepository.deactivateUser(userId);
  }

  async activateUser(userId: string): Promise<void> {
    await this.userRepository.activateUser(userId);
  }

  private async createRoleProfile(userId: string, role: UserRole, profileData: any): Promise<void> {
    switch (role) {
      case UserRole.ADMIN:
        await this.userRepository.createAdminProfile(userId, profileData as AdminProfileData);
        break;
      case UserRole.SPECIAL_EDUCATOR:
        await this.userRepository.createSpecialEducatorProfile(userId, profileData as EducatorProfileData);
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        await this.userRepository.createSuperSpecialEducatorProfile(userId, profileData as EducatorProfileData);
        break;
      case UserRole.CENTER:
        await this.userRepository.createCenterProfile(userId, profileData as CenterProfileData);
        break;
      case UserRole.PARENT:
        await this.userRepository.createParentProfile(userId, profileData as ParentProfileData);
        break;
      case UserRole.SCHOOL_VIEWER:
        await this.userRepository.createSchoolViewerProfile(userId, profileData as SchoolViewerProfileData);
        break;
      default:
        throw new Error('Invalid user role');
    }
  }

  private async updateRoleProfile(userId: string, role: UserRole, profileData: any): Promise<void> {
    switch (role) {
      case UserRole.ADMIN:
        await this.userRepository.updateAdminProfile(userId, profileData as Partial<AdminProfileData>);
        break;
      case UserRole.SPECIAL_EDUCATOR:
        await this.userRepository.updateSpecialEducatorProfile(userId, profileData as Partial<EducatorProfileData>);
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        await this.userRepository.updateSuperSpecialEducatorProfile(userId, profileData as Partial<EducatorProfileData>);
        break;
      case UserRole.CENTER:
        await this.userRepository.updateCenterProfile(userId, profileData as Partial<CenterProfileData>);
        break;
      case UserRole.PARENT:
        await this.userRepository.updateParentProfile(userId, profileData as Partial<ParentProfileData>);
        break;
      case UserRole.SCHOOL_VIEWER:
        await this.userRepository.updateSchoolViewerProfile(userId, profileData as Partial<SchoolViewerProfileData>);
        break;
      default:
        throw new Error('Invalid user role');
    }
  }

  private getUserProfileData(user: any): any {
    switch (user.role) {
      case UserRole.ADMIN:
        return user.adminProfile;
      case UserRole.SPECIAL_EDUCATOR:
        return user.specialEducatorProfile;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        return user.superSpecialEducatorProfile;
      case UserRole.CENTER:
        return user.centerProfile;
      case UserRole.PARENT:
        return user.parentProfile;
      case UserRole.SCHOOL_VIEWER:
        return user.schoolViewerProfile;
      default:
        return null;
    }
  }

  private getUserProfileId(user: any): string | undefined {
    switch (user.role) {
      case UserRole.ADMIN:
        return user.adminProfile?.id;
      case UserRole.SPECIAL_EDUCATOR:
        return user.specialEducatorProfile?.id;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        return user.superSpecialEducatorProfile?.id;
      case UserRole.CENTER:
        return user.centerProfile?.id;
      case UserRole.PARENT:
        return user.parentProfile?.id;
      case UserRole.SCHOOL_VIEWER:
        return user.schoolViewerProfile?.id;
      default:
        return undefined;
    }
  }

  async validateToken(token: string): Promise<UserProfile> {
    try {
      const decoded = AuthUtils.verifyToken(token);
      return await this.getUserProfile(decoded.userId);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getUsersByRole(role: UserRole, page: number = 1, limit: number = 10): Promise<{ users: UserProfile[], total: number }> {
    const { users, total } = await this.userRepository.findAllByRole(role, page, limit);
    
    const userProfiles = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: this.getUserProfileData(user),
      lastLogin: user.lastLogin
    }));

    return { users: userProfiles, total };
  }

  async searchUsers(query: string, role?: UserRole, page: number = 1, limit: number = 10): Promise<{ users: UserProfile[], total: number }> {
    const { users, total } = await this.userRepository.searchUsers(query, role, page, limit);
    
    const userProfiles = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: this.getUserProfileData(user),
      lastLogin: user.lastLogin
    }));

    return { users: userProfiles, total };
  }

  async getUserStats(): Promise<any> {
    return await this.userRepository.getUserStats();
  }
}
