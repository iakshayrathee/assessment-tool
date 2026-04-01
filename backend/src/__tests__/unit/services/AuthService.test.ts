import { AuthService } from '../../../services/AuthService';
import { UserRepository } from '../../../repositories/UserRepository';
import { AuthUtils } from '../../../utils/auth';
import { UserRole } from '../../../models';

// Auto-mock replaces all UserRepository instance methods with jest.fn()
jest.mock('../../../repositories/UserRepository');

const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeActiveUser = (overrides: Record<string, any> = {}): any => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'ADMIN' as any,
  isActive: true,
  password: 'hashed-password',
  lastLogin: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  adminProfile: null,
  centerProfile: null,
  specialEducatorProfile: null,
  superSpecialEducatorProfile: null,
  parentProfile: null,
  schoolViewerProfile: null,
  ...overrides
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    MockedUserRepository.mockClear();
    // PrismaClient arg doesn't matter — the repo is fully mocked
    service = new AuthService({} as any);
    repo = MockedUserRepository.mock.instances[0] as jest.Mocked<UserRepository>;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // login
  // ────────────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws when user is not found', async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'pass123' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws when account is deactivated', async () => {
      repo.findByEmail.mockResolvedValue(makeActiveUser({ isActive: false }));

      await expect(
        service.login({ email: 'user@test.com', password: 'pass123' })
      ).rejects.toThrow('deactivated');
    });

    it('throws when password does not match', async () => {
      repo.findByEmail.mockResolvedValue(makeActiveUser());
      jest.spyOn(AuthUtils, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('returns a token and user profile on successful login', async () => {
      const user = makeActiveUser();
      repo.findByEmail.mockResolvedValue(user);
      repo.updateLastLogin.mockResolvedValue(user as any);
      jest.spyOn(AuthUtils, 'comparePassword').mockResolvedValue(true);

      const result = await service.login({ email: 'user@test.com', password: 'correct' });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('user@test.com');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(repo.updateLastLogin).toHaveBeenCalledWith('user-1');
    });

    it('includes profileId in token when a role-profile exists', async () => {
      const user = makeActiveUser({ adminProfile: { id: 'profile-1' } });
      repo.findByEmail.mockResolvedValue(user);
      repo.updateLastLogin.mockResolvedValue(user as any);
      jest.spyOn(AuthUtils, 'comparePassword').mockResolvedValue(true);

      const result = await service.login({ email: 'user@test.com', password: 'correct' });
      const decoded = AuthUtils.verifyToken(result.token);

      expect(decoded.profileId).toBe('profile-1');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // register
  // ────────────────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('throws when email is already taken', async () => {
      repo.findByEmail.mockResolvedValue(makeActiveUser());

      await expect(
        service.register('user@test.com', 'pass', UserRole.PARENT, {})
      ).rejects.toThrow('already exists');
    });

    it('throws with approval message for roles requiring review', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.createApprovalRequest.mockResolvedValue({} as any);

      await expect(
        service.register('new@test.com', 'pass', UserRole.SPECIAL_EDUCATOR, {}, 'admin-1')
      ).rejects.toThrow('requires approval');
    });

    it('throws when approval-required role is registered without requestedById', async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(
        service.register('new@test.com', 'pass', UserRole.SPECIAL_EDUCATOR, {})
      ).rejects.toThrow('Approval request requires a requesting user ID');
    });

    it('creates user directly for PARENT role (no approval needed)', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'new-user' } as any);
      repo.createParentProfile.mockResolvedValue(undefined as any);
      repo.findById.mockResolvedValue(makeActiveUser({ role: 'PARENT', parentProfile: { id: 'p1' } }));

      const result = await service.register('parent@test.com', 'pass123', UserRole.PARENT, {
        fullName: 'Test Parent',
        phone: '9999999999'
      });

      expect(repo.create).toHaveBeenCalled();
      expect(result.email).toBe('user@test.com');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // changePassword
  // ────────────────────────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('throws when user does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.changePassword('bad-id', 'old', 'new-pass')
      ).rejects.toThrow('User not found');
    });

    it('throws when current password is wrong', async () => {
      repo.findById.mockResolvedValue(makeActiveUser());
      jest.spyOn(AuthUtils, 'comparePassword').mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', 'wrong-old', 'new-pass')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('updates the password on success', async () => {
      const user = makeActiveUser();
      repo.findById.mockResolvedValue(user);
      repo.updatePassword.mockResolvedValue(user as any);
      jest.spyOn(AuthUtils, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(AuthUtils, 'hashPassword').mockResolvedValue('new-hash');

      await service.changePassword('user-1', 'correct-old', 'new-pass');

      expect(repo.updatePassword).toHaveBeenCalledWith('user-1', 'new-hash');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getUserProfile
  // ────────────────────────────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('throws when user does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getUserProfile('bad-id')).rejects.toThrow('User not found');
    });

    it('returns a UserProfile shape', async () => {
      repo.findById.mockResolvedValue(makeActiveUser());
      const profile = await service.getUserProfile('user-1');
      expect(profile.id).toBe('user-1');
      expect(profile.email).toBe('user@test.com');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // validateToken
  // ────────────────────────────────────────────────────────────────────────────

  describe('validateToken', () => {
    it('throws for an invalid token', async () => {
      await expect(service.validateToken('bad.token')).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('returns user profile for a valid token', async () => {
      const token = AuthUtils.generateToken({
        id: 'user-1',
        userId: 'user-1',
        email: 'user@test.com',
        role: UserRole.ADMIN
      });
      repo.findById.mockResolvedValue(makeActiveUser());

      const profile = await service.validateToken(token);
      expect(profile.id).toBe('user-1');
    });
  });
});
