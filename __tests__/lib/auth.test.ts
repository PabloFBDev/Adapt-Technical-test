import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

// Use var to avoid TDZ since vi.mock is hoisted
var capturedAuthorize: Function;

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config: any) => {
    capturedAuthorize = config.authorize;
    return { id: "credentials", type: "credentials" };
  }),
}));

// Unmock auth to get the real implementation
vi.unmock("@/lib/auth");

// Import triggers CredentialsProvider mock which captures authorize
import { authOptions } from "@/lib/auth";

describe("auth - authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when credentials are missing", async () => {
    const result = await capturedAuthorize(undefined);
    expect(result).toBeNull();
  });

  it("should return null when email is missing", async () => {
    const result = await capturedAuthorize({ email: "", password: "Password1" });
    expect(result).toBeNull();
  });

  it("should return null when password is missing", async () => {
    const result = await capturedAuthorize({ email: "test@test.com", password: "" });
    expect(result).toBeNull();
  });

  it("should return null for password shorter than 8 characters", async () => {
    const result = await capturedAuthorize({ email: "test@test.com", password: "Pass1" });
    expect(result).toBeNull();
  });

  it("should return null for password without letters", async () => {
    const result = await capturedAuthorize({ email: "test@test.com", password: "12345678" });
    expect(result).toBeNull();
  });

  it("should return null for password without numbers", async () => {
    const result = await capturedAuthorize({ email: "test@test.com", password: "abcdefgh" });
    expect(result).toBeNull();
  });

  it("should return null when user is not found", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await capturedAuthorize({ email: "test@test.com", password: "Password1" });
    expect(result).toBeNull();
  });

  it("should return null when password does not match", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test",
      password: "hashed",
    });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const result = await capturedAuthorize({ email: "test@test.com", password: "Password1" });
    expect(result).toBeNull();
  });

  it("should return user when credentials are valid", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      name: "Test User",
      password: "hashed",
    });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const result = await capturedAuthorize({ email: "test@test.com", password: "Password1" });
    expect(result).toEqual({ id: "user-1", email: "test@test.com", name: "Test User" });
  });
});

describe("auth - callbacks", () => {
  it("jwt callback should add user id to token", async () => {
    const callbacks = authOptions.callbacks!;
    const token = await callbacks.jwt!({ token: {} as any, user: { id: "user-1" } as any } as any);
    expect((token as any).id).toBe("user-1");
  });

  it("jwt callback should return token unchanged when no user", async () => {
    const callbacks = authOptions.callbacks!;
    const token = await callbacks.jwt!({ token: { id: "existing" } as any, user: undefined as any } as any);
    expect((token as any).id).toBe("existing");
  });

  it("session callback should add id to session.user", async () => {
    const callbacks = authOptions.callbacks!;
    const session = await callbacks.session!({
      session: { user: { email: "test@test.com" } } as any,
      token: { id: "user-1" } as any,
    } as any);
    expect((session as any).user.id).toBe("user-1");
  });
});
