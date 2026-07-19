import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorPayload, generateAiJson } from "@/lib/ai-provider";
import { chatOutputJsonSchema, projectCoachSystemPrompt } from "@/lib/ai-schemas";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  message: z.string().min(1).max(10000),
  currentPage: z.string().optional(),
  selectedTool: z.enum(["codex", "claude", "antigravity"]).optional(),
  selectedServiceType: z.enum(["web", "mobile-web", "game", "software"]).optional(),
  projectSummary: z.string().optional(),
});

const responseSchema = z.object({
  answer: z.string().min(1).max(5000),
  relatedLinks: z
    .array(z.enum(["실습 체크리스트", "용어 사전", "프롬프트 템플릿", "에러 해결", "배포 점검"]))
    .max(3),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "질문을 입력해주세요.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateAiJson({
      system: projectCoachSystemPrompt,
      prompt: `현재 프로젝트 맥락을 바탕으로 사용자의 질문에 짧고 실행 가능하게 답하세요.
확실하지 않은 내용은 단정하지 말고, 비밀키나 DB 주소를 공유하지 않도록 안내하세요.

현재 단계: ${parsed.data.currentPage ?? "알 수 없음"}
사용자 역할: ${parsed.data.role}
선택 도구: ${parsed.data.selectedTool ?? "미선택"}
서비스 형태: ${parsed.data.selectedServiceType ?? "미선택"}
프로젝트: ${parsed.data.projectSummary ?? "아직 없음"}
질문: ${parsed.data.message}

다음 JSON 형식으로 반환하세요:
{"answer":"한국어 답변", "relatedLinks":["관련 링크"]}
relatedLinks에는 실습 체크리스트, 용어 사전, 프롬프트 템플릿, 에러 해결, 배포 점검 중 관련 있는 항목만 최대 3개 넣으세요.`,
      maxTokens: 1500,
      outputSchema: chatOutputJsonSchema,
    });
    return NextResponse.json(responseSchema.parse(result.data), {
      headers: { "x-ai-provider": result.provider },
    });
  } catch (error) {
    const failure = aiErrorPayload(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
