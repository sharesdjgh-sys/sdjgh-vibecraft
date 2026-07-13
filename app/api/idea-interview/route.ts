import { NextResponse } from "next/server";
import { z } from "zod";
import { aiErrorPayload, generateAiJson } from "@/lib/ai-provider";
import {
  interviewQuestionsResponseSchema,
  interviewQuestionsOutputJsonSchema,
  interviewResultResponseSchema,
  interviewResultOutputJsonSchema,
  projectCoachSystemPrompt,
  recommendationJsonShape,
} from "@/lib/ai-schemas";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  idea: z.string().min(4).max(3000),
  answers: z.record(z.string()).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "만들고 싶은 서비스를 한 문장 이상으로 입력해주세요.",
      },
      { status: 400 },
    );
  }

  try {
    if (!parsed.data.answers || Object.keys(parsed.data.answers).length === 0) {
      const result = await generateAiJson({
        system: projectCoachSystemPrompt,
        prompt: `다음 아이디어를 실제 MVP로 구체화하기 위해 꼭 필요한 질문만 만드세요.
이미 아이디어에 답이 있는 내용은 다시 묻지 마세요. 기술 용어 대신 실제 사용 상황을 질문하세요.

사용자 역할: ${parsed.data.role}
아이디어: ${parsed.data.idea}

다음 JSON 형식으로 질문 3~5개만 반환하세요:
{"nextQuestions":["질문"]}`,
        maxTokens: 1000,
        outputSchema: interviewQuestionsOutputJsonSchema,
      });
      return NextResponse.json({
        ...interviewQuestionsResponseSchema.parse(result.data),
        projectBrief: null,
        recommendation: null,
      }, { headers: { "x-ai-provider": result.provider } });
    }

    const answers = Object.entries(parsed.data.answers)
      .map(([question, answer]) => `질문: ${question}\n답변: ${answer}`)
      .join("\n\n");
    const result = await generateAiJson({
      system: projectCoachSystemPrompt,
      prompt: `아이디어와 인터뷰 답변을 근거로 프로젝트 브리프와 추천을 작성하세요.
답변에 없는 요구사항은 임의로 핵심 기능에 넣지 말고, MVP 범위를 작게 유지하세요.

사용자 역할: ${parsed.data.role}
아이디어: ${parsed.data.idea}

인터뷰:
${answers}

다음 JSON 구조로 반환하세요:
{
  "projectBrief": {
    "title": "짧은 프로젝트 이름",
    "summary": "구체적인 프로젝트 설명",
    "screens": ["필요한 주요 화면"],
    "features": ["MVP 핵심 기능"]
  },
  "recommendation": ${recommendationJsonShape}
}`,
      maxTokens: 9000,
      outputSchema: interviewResultOutputJsonSchema,
    });
    const parsedResult = interviewResultResponseSchema.parse(result.data);
    return NextResponse.json(
      { nextQuestions: [], ...parsedResult },
      { headers: { "x-ai-provider": result.provider } },
    );
  } catch (error) {
    const failure = aiErrorPayload(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
