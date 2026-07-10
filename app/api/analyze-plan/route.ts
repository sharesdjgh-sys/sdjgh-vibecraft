import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRecommendation } from "@/lib/recommendation";

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

  const recommendation = buildRecommendation({
    role: parsed.data.role,
    text: parsed.data.extractedText,
  });

  return NextResponse.json(recommendation);
}
