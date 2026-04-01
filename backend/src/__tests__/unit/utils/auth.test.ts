import { AuthUtils } from '../../../utils/auth';
import { UserRole } from '../../../models';
import { createMockReq, createMockRes } from '../../helpers/mockPrisma';

describe('AuthUtils', () => {
  // ─── Password hashing ──────────────────────────────────────────────────────

  describe('hashPassword / comparePassword', () => {
    it('hashes a password (output differs from plaintext)', async () => {
      const hash = await AuthUtils.hashPassword('secret123');
      expect(hash).not.toBe('secret123');
      // bcryptjs produces $2a$ prefixed hashes; bcrypt (C binding) uses $2b$
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('verifies correct password against hash', async () => {
      const hash = await AuthUtils.hashPassword('correct');
      await expect(AuthUtils.comparePassword('correct', hash)).resolves.toBe(true);
    });

    it('rejects wrong password against hash', async () => {
      const hash = await AuthUtils.hashPassword('correct');
      await expect(AuthUtils.comparePassword('wrong', hash)).resolves.toBe(false);
    });
  });

  // ─── JWT sign / verify ─────────────────────────────────────────────────────

  describe('generateToken / verifyToken', () => {
    const payload = {
      id: 'user-1',
      userId: 'user-1',
      email: 'test@example.com',
      role: UserRole.ADMIN
    };

    it('generates a non-empty token string', () => {
      const token = AuthUtils.generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('verifies a valid token and returns the original payload fields', () => {
      const token = AuthUtils.generateToken(payload);
      const decoded = AuthUtils.verifyToken(token);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.userId).toBe(payload.userId);
    });

    it('throws on a malformed token string', () => {
      expect(() => AuthUtils.verifyToken('not.a.token')).toThrow();
    });

    it('throws on a tampered token', () => {
      const token = AuthUtils.generateToken(payload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => AuthUtils.verifyToken(tampered)).toThrow();
    });
  });

  // ─── authenticateToken middleware ──────────────────────────────────────────

  describe('authenticateToken', () => {
    it('returns 401 when there is no Authorization header', () => {
      const req = createMockReq({ headers: {} });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 for an invalid token value', () => {
      const req = createMockReq({ headers: { authorization: 'Bearer totally-invalid' } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next() and attaches user for a valid token', () => {
      const token = AuthUtils.generateToken({
        id: 'u1',
        userId: 'u1',
        email: 'a@a.com',
        role: UserRole.SPECIAL_EDUCATOR
      });
      const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.email).toBe('a@a.com');
      expect(req.user.role).toBe(UserRole.SPECIAL_EDUCATOR);
    });

    it('ensures both id and userId are populated from token', () => {
      const token = AuthUtils.generateToken({
        id: 'u-abc',
        userId: 'u-abc',
        email: 'x@x.com',
        role: UserRole.PARENT
      });
      const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.authenticateToken(req, res, next);

      expect(req.user.id).toBe('u-abc');
      expect(req.user.userId).toBe('u-abc');
    });
  });

  // ─── requireRole middleware ────────────────────────────────────────────────

  describe('requireRole', () => {
    it('returns 401 when req.user is not set', () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.requireRole([UserRole.ADMIN])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user role is not in the allowed list', () => {
      const req = createMockReq({ user: { role: UserRole.PARENT } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.requireRole([UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next() when role matches', () => {
      const req = createMockReq({ user: { role: UserRole.ADMIN } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.requireRole([UserRole.ADMIN])(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('allows access when one of multiple roles matches', () => {
      const req = createMockReq({ user: { role: UserRole.SPECIAL_EDUCATOR } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.requireRole([UserRole.ADMIN, UserRole.SPECIAL_EDUCATOR])(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ─── requireAnyRole ────────────────────────────────────────────────────────

  describe('requireAnyRole', () => {
    it('delegates to requireRole and allows matching role', () => {
      const req = createMockReq({ user: { role: UserRole.CENTER } });
      const res = createMockRes();
      const next = jest.fn();

      AuthUtils.requireAnyRole(UserRole.CENTER, UserRole.ADMIN)(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
