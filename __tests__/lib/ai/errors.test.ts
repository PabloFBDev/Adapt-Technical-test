import { describe, it, expect } from "vitest";
import { AIProviderError, extractErrorMessage } from "@/lib/ai/errors";

describe("AIProviderError", () => {
  it("should be an instance of Error with name AIProviderError", () => {
    const err = new AIProviderError("test message");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AIProviderError");
    expect(err.message).toBe("test message");
  });
});

describe("extractErrorMessage", () => {
  it("should return timeout message for Stream timeout errors", () => {
    const err = new Error("Stream timeout");
    expect(extractErrorMessage(err)).toBe("A geração do resumo excedeu o tempo limite.");
  });

  it("should return API key message for 401 status errors", () => {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    expect(extractErrorMessage(err)).toBe(
      "Chave de API inválida. Verifique as configurações do provider."
    );
  });

  it("should return rate limit message for 429 status errors", () => {
    const err = new Error("Too Many Requests") as Error & { status: number };
    err.status = 429;
    expect(extractErrorMessage(err)).toBe(
      "Limite de requisições excedido. Aguarde um momento e tente novamente."
    );
  });

  it("should return API key message for Anthropic authentication errors", () => {
    const err = new Error("Could not resolve authentication method");
    expect(extractErrorMessage(err)).toBe(
      "Chave de API inválida. Verifique as configurações do provider."
    );
  });

  it("should return safety message for Gemini SAFETY errors", () => {
    const err = new Error("Response was blocked due to SAFETY");
    expect(extractErrorMessage(err)).toBe(
      "O conteúdo foi bloqueado pelos filtros de segurança do provider."
    );
  });

  it("should truncate messages longer than 200 characters", () => {
    const longMessage = "A".repeat(300);
    const err = new Error(longMessage);
    const result = extractErrorMessage(err);
    expect(result.length).toBeLessThanOrEqual(201); // 200 + "…"
    expect(result.endsWith("…")).toBe(true);
  });

  it("should return generic message for non-Error values", () => {
    expect(extractErrorMessage("string error")).toBe(
      "Falha ao gerar resumo."
    );
    expect(extractErrorMessage(null)).toBe("Falha ao gerar resumo.");
  });
});
