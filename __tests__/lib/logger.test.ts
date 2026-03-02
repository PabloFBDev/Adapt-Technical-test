import { describe, it, expect, vi, beforeEach } from "vitest";

describe("logger", () => {
  let logger: typeof import("@/lib/logger")["logger"];

  beforeEach(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Use importActual to get the real logger (not mocked by other test files)
    const mod = await vi.importActual<typeof import("@/lib/logger")>("@/lib/logger");
    logger = mod.logger;
  });

  it("should log info messages with console.log", () => {
    logger.info("test message");
    expect(console.log).toHaveBeenCalledOnce();

    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe("info");
    expect(output.message).toBe("test message");
    expect(output.timestamp).toBeDefined();
  });

  it("should log warn messages with console.warn", () => {
    logger.warn("warning message");
    expect(console.warn).toHaveBeenCalledOnce();

    const output = JSON.parse((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe("warn");
    expect(output.message).toBe("warning message");
  });

  it("should log error messages with console.error", () => {
    logger.error("error message");
    expect(console.error).toHaveBeenCalledOnce();

    const output = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(output.level).toBe("error");
    expect(output.message).toBe("error message");
  });

  it("should include metadata in log output", () => {
    logger.info("with meta", { userId: "123", action: "login" });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    // Find the call that has our "with meta" message
    const metaCall = calls.find((c: string[]) => c[0].includes("with meta"));
    expect(metaCall).toBeDefined();
    const output = JSON.parse(metaCall![0]);
    expect(output.userId).toBe("123");
    expect(output.action).toBe("login");
  });

  it("should include ISO timestamp", () => {
    logger.info("timestamp test");

    const output = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(() => new Date(output.timestamp)).not.toThrow();
    expect(new Date(output.timestamp).toISOString()).toBe(output.timestamp);
  });
});
