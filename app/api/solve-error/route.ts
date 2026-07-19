import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorPayload, generateAiJson } from "@/lib/ai-provider";
import { errorSolutionOutputJsonSchema, projectCoachSystemPrompt } from "@/lib/ai-schemas";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  selectedTool: z.enum(["codex", "claude", "antigravity"]).optional(),
  currentStep: z.string().optional(),
  platform: z.enum(["unknown", "windows", "macos"]).optional(),
  taskContext: z
    .object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(500),
    })
    .optional(),
  troubleshootingStep: z
    .object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(500),
      check: z.string().min(1).max(500),
    })
    .optional(),
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
사용자가 Git과 터미널을 처음 접한다고 가정하고, 전문 용어는 바로 뜻을 풀어 설명하세요.
한 번에 여러 해결책을 나열하기보다 지금 확인할 행동부터 순서대로 안내하세요.
명령어가 필요하면 어디를 열고, 무엇을 입력하고, 어떤 결과가 나오면 정상인지 함께 설명하세요.

사용자 역할: ${parsed.data.role}
사용 도구: ${parsed.data.selectedTool ?? "미선택"}
현재 단계: ${parsed.data.currentStep ?? "알 수 없음"}
사용 중인 컴퓨터: ${parsed.data.platform === "windows" ? "Windows" : parsed.data.platform === "macos" ? "macOS" : "모름"}
전체 작업 항목: ${parsed.data.taskContext?.title ?? "직접 입력"}
전체 작업의 목표: ${parsed.data.taskContext?.description ?? "제공되지 않음"}
선택한 준비 단계: ${parsed.data.troubleshootingStep?.title ?? "직접 입력"}
이 단계에서 할 일: ${parsed.data.troubleshootingStep?.description ?? "제공되지 않음"}
정상 확인 기준: ${parsed.data.troubleshootingStep?.check ?? "제공되지 않음"}

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
