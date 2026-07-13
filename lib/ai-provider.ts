import { ZodError } from "zod";
import { AnthropicApiError, generateClaudeJson } from "./anthropic";
import { GeminiApiError, generateGeminiJson } from "./gemini";

type GenerateJsonInput = {
  system: string;
  prompt: string;
  maxTokens?: number;
  outputSchema: Record<string, unknown>;
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

function safeProviderMessage(error: unknown) {
  if (error instanceof GeminiApiError || error instanceof AnthropicApiError) return error.message;
  return "알 수 없는 공급자 오류";
}

export async function generateAiJson(input: GenerateJsonInput): Promise<{
  data: unknown;
  provider: "gemini" | "claude";
}> {
  try {
    const result = await generateGeminiJson(input);
    console.info("[VibeCraft AI] provider=gemini status=success");
    return { data: result, provider: "gemini" };
  } catch (geminiError) {
    console.warn(`[VibeCraft AI] provider=gemini status=fallback reason=${safeProviderMessage(geminiError)}`);
    try {
      const result = await generateClaudeJson(input);
      console.info("[VibeCraft AI] provider=claude status=success fallback=true");
      return { data: result, provider: "claude" };
    } catch (claudeError) {
      throw new AiProviderError(
        `Gemini와 Claude 요청이 모두 실패했습니다. Gemini: ${safeProviderMessage(geminiError)} Claude: ${safeProviderMessage(claudeError)}`,
        502,
      );
    }
  }
}

export function aiErrorPayload(error: unknown) {
  if (error instanceof AiProviderError) {
    return { error: error.message, status: error.status };
  }
  if (error instanceof ZodError) {
    const fields = Array.from(new Set(error.issues.map((issue) => issue.path.join(".")).filter(Boolean)))
      .slice(0, 3)
      .join(", ");
    return {
      error: `AI 응답의 일부 형식이 올바르지 않습니다${fields ? ` (${fields})` : ""}. 다시 시도해주세요.`,
      status: 502,
    };
  }
  return { error: "AI 처리 중 예상하지 못한 오류가 발생했습니다.", status: 500 };
}
