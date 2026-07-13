import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorPayload, generateAiJson } from "@/lib/ai-provider";
import { errorSolutionOutputJsonSchema, projectCoachSystemPrompt } from "@/lib/ai-schemas";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  selectedTool: z.enum(["codex", "claude", "antigravity"]).optional(),
  currentStep: z.string().optional(),
  errorMessage: z.string().min(1).max(20000),
});

const responseSchema = z.object({
  summary: z.string().min(1).max(1000),
  possibleCauses: z.array(z.string().min(1)).min(1).max(6),
  solutionSteps: z.array(z.string().min(1)).min(2).max(10),
  suggestedPrompt: z.string().min(1).max(5000),
  relatedTerms: z.array(z.string().min(1)).max(6),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "에러 메시지를 입력해주세요.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateAiJson({
      system: projectCoachSystemPrompt,
      prompt: `다음 개발 오류를 초보자가 해결할 수 있도록 분석하세요.
오류 메시지에 없는 사실을 확정하지 말고 가능성이 높은 순서로 점검하게 하세요.
API 키, 토큰, DB 주소 같은 비밀정보는 출력하거나 다시 입력하도록 요구하지 마세요.

사용자 역할: ${parsed.data.role}
사용 도구: ${parsed.data.selectedTool ?? "미선택"}
현재 단계: ${parsed.data.currentStep ?? "알 수 없음"}

오류 메시지:
<error>
${parsed.data.errorMessage}
</error>

다음 JSON 형식으로 반환하세요:
{
  "summary":"쉬운 오류 요약",
  "possibleCauses":["가능한 원인"],
  "solutionSteps":["확인할 순서"],
  "suggestedPrompt":"사용자가 AI 개발 도구에 붙여넣을 구체적인 질문",
  "relatedTerms":["관련 용어"]
}`,
      maxTokens: 2500,
      outputSchema: errorSolutionOutputJsonSchema,
    });
    return NextResponse.json(responseSchema.parse(result.data), {
      headers: { "x-ai-provider": result.provider },
    });
  } catch (error) {
    const failure = aiErrorPayload(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
