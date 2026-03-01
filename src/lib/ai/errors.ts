export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}

export function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Falha ao gerar resumo.";

  if (err.message === "Stream timeout") {
    return "A geração do resumo excedeu o tempo limite.";
  }

  // Anthropic/OpenAI APIError: has `status` property
  const status = (err as { status?: number }).status;
  if (status === 401) {
    return "Chave de API inválida. Verifique as configurações do provider.";
  }
  if (status === 429) {
    return "Limite de requisições excedido. Aguarde um momento e tente novamente.";
  }
  if (status === 403) {
    return "Acesso negado. Verifique as permissões da chave de API.";
  }

  // Anthropic-specific: "Could not resolve authentication"
  if (err.message.includes("Could not resolve authentication")) {
    return "Chave de API inválida. Verifique as configurações do provider.";
  }

  // Gemini: content blocked by safety filters
  if (
    err.message.includes("SAFETY") ||
    err.message.includes("blocked")
  ) {
    return "O conteúdo foi bloqueado pelos filtros de segurança do provider.";
  }

  // Try to extract nested message from SDK JSON error bodies
  // e.g. "401 {"type":"error","error":{...,"message":"invalid x-api-key"}}"
  const nested = err.message.match(/"message"\s*:\s*"([^"]+)"/);
  const message = nested?.[1] || err.message;

  if (message.length > 200) return message.slice(0, 200) + "…";
  return message;
}
