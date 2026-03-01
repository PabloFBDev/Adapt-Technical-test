import { vi } from "vitest";

// Mock Prisma client
vi.mock("@/lib/prisma", () => {
  const mockPrismaClient = {
    ticket: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    aICache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    aIConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: typeof mockPrismaClient) => Promise<unknown>) => {
      return fn(mockPrismaClient);
    }),
  };
  return { prisma: mockPrismaClient };
});

// Mock NextAuth
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));
