/**
 * Integration tests for auth routes.
 *
 * Because routes/auth.ts instantiates `new PrismaClient()` at module scope,
 * we mock @prisma/client BEFORE importing the router.
 * Variables prefixed with "mock" can be referenced inside jest.mock() factories
 * (Jest's babel transform hoists jest.mock() but preserves these variable
 * references per the official exception for "mock"-prefixed names).
 */

import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';

// ─── Mock @prisma/client ──────────────────────────────────────────────────────

const mockPrismaUserMethods = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  groupBy: jest.fn(),
  findMany: jest.fn()
};

const mockPrismaPasswordResetToken = {
  updateMany: jest.fn(),
  create: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn()
};

const mockProfileCreate = { create: jest.fn() };

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: mockPrismaUserMethods,
    passwordResetToken: mockPrismaPasswordResetToken,
    adminProfile: mockProfileCreate,
    centerProfile: { create: jest.fn() },
    specialEducatorProfile: { create: jest.fn() },
    superSpecialEducatorProfile: { create: jest.fn() },
    parentProfile: { create: jest.fn() },
    schoolViewerProfile: { create: jest.fn() }
  })),
  UserRole: {
    ADMIN: 'ADMIN',
    CENTER: 'CENTER',
    SPECIAL_EDUCATOR: 'SPECIAL_EDUCATOR',
    SUPER_SPECIAL_EDUCATOR: 'SUPER_SPECIAL_EDUCATOR',
    PARENT: 'PARENT',
    SCHOOL_VIEWER: 'SCHOOL_VIEWER'
  }
}));

// ─── Mock email utility ───────────────────────────────────────────────────────

jest.mock('../../utils/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ previewUrl: null })
}));

// ─── Import router AFTER mocks are set up ─────────────────────────────────────

import authRouter from '../../routes/auth';

// ─── Build test Express app ────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Generic error handler so unhandled errors return JSON instead of HTML
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: err.message });
});

// ─── Helper ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short (< 6 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6 characters/i);
  });

  it('returns 401 when user does not exist', async () => {
    mockPrismaUserMethods.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  it('returns 401 when account is deactivated', async () => {
    mockPrismaUserMethods.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      isActive: false,
      password: 'hashed'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/deactivated/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'pass123', role: 'ADMIN' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.com', password: '12', role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 6 characters/i);
  });

  it('returns 400 for an invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.com', password: 'pass123', role: 'NOT_A_ROLE' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid user role/i);
  });

  it('returns 400 when email already exists', async () => {
    mockPrismaUserMethods.findUnique.mockResolvedValue({ id: 'existing-u' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'taken@test.com', password: 'pass123', role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 200 even when the email does not exist (prevents enumeration attacks)', async () => {
    mockPrismaUserMethods.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ password: 'newpassword123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'some-token', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/i);
  });

  it('returns 400 for an invalid/non-existent token', async () => {
    mockPrismaPasswordResetToken.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'bad-token', password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 400 for an already-used token', async () => {
    mockPrismaPasswordResetToken.findUnique.mockResolvedValue({
      id: 'rt1',
      token: 'used-token',
      used: true,
      expiresAt: new Date(Date.now() + 3600000),
      userId: 'u1',
      user: {}
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'used-token', password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already been used/i);
  });

  it('returns 400 for an expired token', async () => {
    mockPrismaPasswordResetToken.findUnique.mockResolvedValue({
      id: 'rt2',
      token: 'expired-token',
      used: false,
      expiresAt: new Date(Date.now() - 3600000), // 1 hour in the past
      userId: 'u1',
      user: {}
    });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'expired-token', password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expired/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/validate-token
// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/validate-token', () => {
  it('returns 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/validate-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/token is required/i);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/validate-token')
      .send({ token: 'garbage.token.value' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid bearer token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalid.token.here')
      .send({});

    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
// GET /api/auth/profile
// ────────────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/profile', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not.valid.token');

    expect(res.status).toBe(401);
  });
});
