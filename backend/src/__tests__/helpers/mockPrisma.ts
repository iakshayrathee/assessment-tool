import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

/**
 * Creates a fully type-safe deep mock of PrismaClient.
 * Use this in service/repository unit tests where you want to
 * control what the database returns without a real DB connection.
 *
 * @example
 * const prisma = createMockPrisma();
 * prisma.user.findUnique.mockResolvedValue({ id: 'u1', ... });
 * const service = new SomeService(prisma);
 */
export const createMockPrisma = (): MockProxy<PrismaClient> => mockDeep<PrismaClient>();

/**
 * Builds a minimal valid Express res mock for controller/middleware unit tests.
 */
export const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Builds a minimal valid Express req mock.
 */
export const createMockReq = (overrides: Record<string, any> = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  user: undefined,
  ...overrides
}) as any;
