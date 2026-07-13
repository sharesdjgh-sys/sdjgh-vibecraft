import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropicErrorPayload, generateClaudeJson } from "@/lib/anthropic";
import {
  projectCoachSystemPrompt,
  recommendationJsonShape,
  recommendationOutputJsonSchema,
  recommendationResponseSchema,
} from "@/lib/ai-schemas";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  extractedText: z.string().min(10).max(200000),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "기획서 내용은 10자 이상 200,000자 이하로 입력해주세요. 긴 문서는 핵심 범위만 남기면 더 정확합니다.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateClaudeJson({
      system: projectCoachSystemPrompt,
      prompt: `다음 기획서를 분석해 프로젝트 브리프를 작성하세요.

사용자 역할: ${parsed.data.role}

반드시 다음 JSON 구조와 키를 그대로 사용하세요:
${recommendationJsonShape}

기획서:
<plan>
${parsed.data.extractedText}
</plan>`,
      maxTokens: 8000,
      outputSchema: recommendationOutputJsonSchema,
    });
    const recommendation = recommendationResponseSchema.parse(result);
    return NextResponse.json(recommendation);
  } catch (error) {
    const failure = anthropicErrorPayload(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
