import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/mock-provider", () => {
  const MockAIProvider = vi.fn().mockImplementation(function () {
    return { generateSummary: vi.fn() };
  });
  return { MockAIProvider };
});

import { getAIProvider } from "@/lib/ai/factory";
import { MockAIProvider } from "@/lib/ai/mock-provider";

describe("getAIProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AI_PROVIDER;
  });

  it("should return MockAIProvider by default", () => {
    const provider = getAIProvider();
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
    expect(provider.generateSummary).toBeDefined();
  });

  it("should return MockAIProvider when AI_PROVIDER is 'mock'", () => {
    process.env.AI_PROVIDER = "mock";
    const provider = getAIProvider();
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
  });

  it("should return MockAIProvider for unknown provider", () => {
    process.env.AI_PROVIDER = "unknown";
    const provider = getAIProvider();
    expect(MockAIProvider).toHaveBeenCalled();
    expect(provider).toBeDefined();
  });
});
