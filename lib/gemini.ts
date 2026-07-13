const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}

function geminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiApiError(
      ".env.local에 GEMINI_API_KEY가 설정되지 않았습니다.",
      503,
    );
  }
  return key;
}

function parseGeminiJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new GeminiApiError("Gemini 응답을 JSON으로 해석하지 못했습니다.");
  }
}

export async function generateGeminiJson(input: {
  system: string;
  prompt: string;
  maxTokens?: number;
  outputSchema: Record<string, unknown>;
}): Promise<unknown> {
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": geminiApiKey(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: input.outputSchema,
          maxOutputTokens: input.maxTokens ?? 3000,
        },
      }),
    });
  } catch (error) {
    if (error instanceof GeminiApiError) throw error;
    throw new GeminiApiError("Gemini API에 연결하지 못했습니다.");
  }

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;
  if (!response.ok) {
    const detail = payload?.error?.message;
    throw new GeminiApiError(
      detail ? `Gemini API 오류: ${detail}` : "Gemini API 요청에 실패했습니다.",
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    const reason = payload?.promptFeedback?.blockReason ?? payload?.candidates?.[0]?.finishReason;
    throw new GeminiApiError(
      reason ? `Gemini가 응답을 생성하지 못했습니다: ${reason}` : "Gemini가 비어 있는 응답을 반환했습니다.",
    );
  }
  return parseGeminiJson(text);
}
