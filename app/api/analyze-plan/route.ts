import { NextResponse } from "next/server";
import { z } from "zod";
import { buildRecommendation } from "@/lib/recommendation";

const schema = z.object({
  role: z.enum(["student", "teacher", "adult"]),
  extractedText: z.string().min(10).max(50000),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "기획서 내용이 부족합니다. txt, md 내용을 붙여넣거나 아이디어를 더 자세히 입력해주세요.",
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
