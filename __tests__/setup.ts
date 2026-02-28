import { vi } from "vitest";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
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
  },
}));

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
