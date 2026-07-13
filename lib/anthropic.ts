const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicResponse = {
  content?: AnthropicTextBlock[];
  error?: { message?: string };
};

export class AnthropicApiError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "AnthropicApiError";
  }
}

function apiKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new AnthropicApiError(
      ".env.local에 ANTHROPIC_API_KEY가 설정되지 않았습니다. 환경변수 이름을 확인해주세요.",
      503,
    );
  }
  return key;
}

function jsonFromText(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // The caller receives a useful, non-sensitive error below.
      }
    }
    throw new AnthropicApiError("Claude 응답을 JSON으로 해석하지 못했습니다. 다시 시도해주세요.");
  }
}

export async function generateClaudeJson(input: {
  system: string;
  prompt: string;
  maxTokens?: number;
  outputSchema: Record<string, unknown>;
}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
        max_tokens: input.maxTokens ?? 3000,
        output_config: {
          effort: "low",
          format: {
            type: "json_schema",
            schema: input.outputSchema,
          },
        },
        system: input.system,
        messages: [{ role: "user", content: input.prompt }],
      }),
    });
  } catch (error) {
    if (error instanceof AnthropicApiError) throw error;
    throw new AnthropicApiError("Claude API에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }

  const payload = (await response.json().catch(() => null)) as AnthropicResponse | null;
  if (!response.ok) {
    const detail = payload?.error?.message;
    throw new AnthropicApiError(
      detail ? `Claude API 오류: ${detail}` : "Claude API 요청에 실패했습니다.",
      response.status === 401 ? 503 : 502,
    );
  }

  const text = payload?.content
    ?.filter((block): block is AnthropicTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!text) throw new AnthropicApiError("Claude가 비어 있는 응답을 반환했습니다.");
  return jsonFromText(text);
}
